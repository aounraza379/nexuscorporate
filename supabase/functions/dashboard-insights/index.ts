import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const userRole = roleData?.role || "employee";

    // Gather data for insights
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, assigned_to, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: leaves } = await supabase
      .from("leave_requests")
      .select("id, user_id, leave_type, start_date, end_date, status, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    const { data: announcements } = await supabase
      .from("announcements")
      .select("id, title, priority, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    // Build stats summary for AI
    const pendingTasks = tasks?.filter(t => t.status === "pending").length || 0;
    const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;
    const highPriority = tasks?.filter(t => t.priority === "high" && t.status !== "completed").length || 0;
    const overdueTasks = tasks?.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed").length || 0;
    const pendingLeaves = leaves?.filter(l => l.status === "pending").length || 0;

    const dataContext = `
Role: ${userRole}
Tasks: ${tasks?.length || 0} total, ${pendingTasks} pending, ${completedTasks} completed, ${highPriority} high-priority, ${overdueTasks} overdue
Leave Requests: ${leaves?.length || 0} total, ${pendingLeaves} pending
Recent Announcements: ${announcements?.length || 0}
Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
`;

    const prompt = `You are a smart HR analytics assistant. Based on this data, generate a brief daily insight summary (3-4 bullet points max). Be specific with numbers. Include:
1. A key metric or trend observation
2. An actionable recommendation
3. A priority alert if applicable

Keep each point to 1 short sentence. Use emoji sparingly (1 per point max). Do NOT use markdown headers.

${dataContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const insights = aiData?.choices?.[0]?.message?.content || "No insights available.";

    // Auto-prioritize tasks
    const taskPrioritization = generateTaskPrioritization(tasks || []);

    return new Response(
      JSON.stringify({ insights, taskPrioritization }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Dashboard insights error:", error);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface TaskData {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  assigned_to: string | null;
  created_at: string | null;
}

function generateTaskPrioritization(tasks: TaskData[]) {
  // Score tasks by urgency
  const activeTasks = tasks.filter(t => t.status !== "completed");
  
  const scored = activeTasks.map(t => {
    let score = 0;
    
    // Priority weight
    if (t.priority === "high") score += 30;
    else if (t.priority === "medium") score += 15;
    else score += 5;
    
    // Overdue bonus
    if (t.due_date && new Date(t.due_date) < new Date()) {
      score += 50;
    }
    
    // Due soon bonus (within 3 days)
    if (t.due_date) {
      const daysUntilDue = (new Date(t.due_date).getTime() - Date.now()) / 86400000;
      if (daysUntilDue > 0 && daysUntilDue <= 3) score += 25;
      else if (daysUntilDue > 3 && daysUntilDue <= 7) score += 10;
    }
    
    // In-progress tasks get slight boost
    if (t.status === "in_progress") score += 10;
    
    return { ...t, urgencyScore: score };
  });
  
  return scored
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date,
      urgencyScore: t.urgencyScore,
      reason: t.urgencyScore >= 50 ? "Overdue" : t.urgencyScore >= 30 ? "High priority" : "Upcoming",
    }));
}
