import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Decode the requesting user from the JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) throw new Error("Unauthorized");

    const { start_date, end_date, department, request_id } = await req.json();

    // 1. Get total employees in department
    const { data: deptMembers, error: deptErr } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("department", department)
      .eq("employment_status", "active");

    if (deptErr) throw deptErr;
    const totalMembers = deptMembers?.length || 0;

    if (totalMembers === 0) {
      return new Response(JSON.stringify({ risk: "low", message: "No department data available.", absent_count: 0, total: 0, percentage: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Find overlapping approved leaves in same department
    const { data: overlappingLeaves, error: leaveErr } = await supabase
      .from("leave_requests")
      .select("id, user_id, start_date, end_date")
      .eq("status", "approved")
      .lte("start_date", end_date)
      .gte("end_date", start_date);

    if (leaveErr) throw leaveErr;

    // Filter to same department
    const deptMemberIds = new Set(deptMembers.map((m: any) => m.id));
    const deptOverlapping = (overlappingLeaves || []).filter((l: any) => deptMemberIds.has(l.user_id));
    const uniqueAbsentIds = new Set(deptOverlapping.map((l: any) => l.user_id));
    const absentCount = uniqueAbsentIds.size;
    const percentage = Math.round((absentCount / totalMembers) * 100);
    const availableCount = totalMembers - absentCount;

    // 3. Check for task deadline conflicts (for manager view)
    let taskConflicts: any[] = [];
    if (request_id) {
      // Get the requesting employee's pending tasks with deadlines in the leave period
      const { data: leaveReq } = await supabase
        .from("leave_requests")
        .select("user_id")
        .eq("id", request_id)
        .single();

      if (leaveReq) {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id, title, due_date, priority")
          .eq("assigned_to", leaveReq.user_id)
          .in("status", ["pending", "in_progress"])
          .gte("due_date", start_date)
          .lte("due_date", end_date);

        taskConflicts = tasks || [];
      }
    }

    const risk = percentage >= 20 ? "high" : percentage >= 10 ? "medium" : "low";

    // 4. Generate AI summary for managers
    let aiSummary = "";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY && (risk !== "low" || taskConflicts.length > 0)) {
      try {
        const taskInfo = taskConflicts.length > 0
          ? `The employee has ${taskConflicts.length} task(s) with deadlines during this period: ${taskConflicts.map((t: any) => `"${t.title}" (${t.priority} priority)`).join(", ")}.`
          : "No task deadline conflicts.";

        const prompt = `You are an HR analytics assistant. Give a single concise sentence summarizing this leave impact:
- Department: ${department}
- Total team members: ${totalMembers}
- Members already on leave during this period: ${absentCount}
- Available after approval: ${availableCount - 1}
- Absence percentage: ${percentage}%
- ${taskInfo}
Format: "Approving this leaves only X people in [Department] available. [Any task concern in brief]."`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          aiSummary = aiData.choices?.[0]?.message?.content?.trim() || "";
        }
      } catch (e) {
        console.error("AI summary error:", e);
      }
    }

    return new Response(
      JSON.stringify({
        risk,
        absent_count: absentCount,
        total: totalMembers,
        available: availableCount,
        percentage,
        task_conflicts: taskConflicts,
        ai_summary: aiSummary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("leave-impact-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
