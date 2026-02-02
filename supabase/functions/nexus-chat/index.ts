import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface UserContext {
  profile?: {
    id: string;
    full_name: string | null;
    department: string | null;
    bio: string | null;
  };
  tasks?: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string | null;
    priority: string | null;
    due_date: string | null;
  }>;
  leaveRequests?: Array<{
    id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: string;
    reason: string | null;
  }>;
  policies?: Array<{
    id: string;
    title: string;
    content: string;
    category: string | null;
  }>;
  teamLeaveRequests?: Array<{
    id: string;
    user_id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: string;
    reason: string | null;
    employee_name?: string;
  }>;
  allEmployees?: Array<{
    id: string;
    full_name: string | null;
    department: string | null;
  }>;
  teamTasks?: Array<{
    id: string;
    title: string;
    status: string | null;
    priority: string | null;
    assigned_to: string | null;
  }>;
}

interface RequestBody {
  messages: ChatMessage[];
  userRole: "employee" | "manager" | "hr";
  userId: string;
  context: UserContext;
}

const CONCISE_STYLE = `
RESPONSE STYLE:
- Be ULTRA-CONCISE. Max 1-2 sentences per response.
- Lead with action, not explanation.
- Use bullet points for lists.
- No filler words. No pleasantries unless asked.

Example good responses:
- "3 pending requests. John (sick, Feb 5-6), Sarah (annual, Feb 10-14). Want me to approve any?"
- "Approved. Leave request processed."
- "⚠️ Conflict: 2 team members already off Feb 10-12. Recommend caution."
`;

const DECISION_SUPPORT_PROMPT = `
DECISION SUPPORT (for leave requests):
When discussing a pending leave request, ALWAYS provide a quick recommendation:
1. Check if dates conflict with other approved leaves
2. Consider team coverage
3. Give a clear verdict: "✅ Recommend approving" or "⚠️ Caution: [reason]"

Example:
User: "Should I approve John's leave?"
You: "✅ Recommend approving. No conflicts found for Feb 10-14. Team coverage is adequate."
`;

const ACTION_COMMANDS_PROMPT = `
ACTION EXECUTION:
You can execute these actions when the user confirms:
- approve_leave(request_id) - Approve a pending leave
- reject_leave(request_id) - Reject a pending leave  
- create_announcement(title, content, priority) - Post announcement

When user says "approve", "reject", or similar:
1. Confirm which request
2. Execute and respond: "Done. [Action] completed."

The UI will handle the actual database update when you confirm the action.
`;

const STRICT_BOUNDARY_PROMPT = `
CRITICAL RESTRICTIONS:
1. You are NEXUS, a CONCISE AI HR assistant.
2. ONLY answer company-related questions.
3. Reference SPECIFIC data from context.
4. If outside scope: "I only handle company matters."

${CONCISE_STYLE}
`;

function buildEmployeeSystemPrompt(context: UserContext): string {
  let prompt = `${STRICT_BOUNDARY_PROMPT}

NEXUS for ${context.profile?.full_name || "Employee"} | ${context.profile?.department || "Dept N/A"}

YOUR TASKS:
`;

  if (context.tasks && context.tasks.length > 0) {
    const pending = context.tasks.filter(t => t.status === "pending").length;
    const inProgress = context.tasks.filter(t => t.status === "in_progress").length;
    prompt += `${context.tasks.length} total (${pending} pending, ${inProgress} in-progress)\n`;
    prompt += context.tasks.slice(0, 10).map(t => `• [${t.status}] ${t.title} (${t.priority})`).join("\n");
  } else {
    prompt += "No tasks assigned.\n";
  }

  if (context.leaveRequests && context.leaveRequests.length > 0) {
    prompt += `\n\nYOUR LEAVE HISTORY:\n`;
    prompt += context.leaveRequests.map(l => `• ${l.leave_type} (${l.start_date} to ${l.end_date}) - ${l.status}`).join("\n");
  }

  if (context.policies && context.policies.length > 0) {
    prompt += `\n\nPOLICIES:\n`;
    prompt += context.policies.map(p => `### ${p.title}\n${p.content.substring(0, 300)}...`).join("\n\n");
  }

  return prompt;
}

function buildManagerSystemPrompt(context: UserContext): string {
  let prompt = `${STRICT_BOUNDARY_PROMPT}
${DECISION_SUPPORT_PROMPT}
${ACTION_COMMANDS_PROMPT}

NEXUS for Manager ${context.profile?.full_name || ""} | ${context.profile?.department || ""}

`;

  // Pending leave requests - this is the priority
  if (context.teamLeaveRequests && context.teamLeaveRequests.length > 0) {
    const pending = context.teamLeaveRequests.filter(l => l.status === "pending");
    
    prompt += `⚠️ PENDING LEAVE APPROVALS: ${pending.length}\n`;
    prompt += pending.map(l => {
      const name = l.employee_name || `User ${l.user_id.substring(0, 6)}`;
      return `• ID:${l.id.substring(0, 8)} | ${name} | ${l.leave_type} | ${l.start_date} to ${l.end_date}${l.reason ? ` | "${l.reason}"` : ""}`;
    }).join("\n");

    // Check for conflicts between pending and approved
    const approved = context.teamLeaveRequests.filter(l => l.status === "approved");
    if (approved.length > 0) {
      prompt += `\n\nAPPROVED LEAVES (for conflict check):\n`;
      prompt += approved.slice(0, 5).map(l => `• ${l.employee_name || l.user_id.substring(0, 6)}: ${l.start_date} to ${l.end_date}`).join("\n");
    }
  }

  // Team task summary
  if (context.teamTasks && context.teamTasks.length > 0) {
    const stats = {
      total: context.teamTasks.length,
      pending: context.teamTasks.filter(t => t.status === "pending").length,
      inProgress: context.teamTasks.filter(t => t.status === "in_progress").length,
      high: context.teamTasks.filter(t => t.priority === "high").length,
    };
    prompt += `\n\nTEAM TASKS: ${stats.total} total, ${stats.pending} pending, ${stats.inProgress} in-progress, ${stats.high} high-priority`;
  }

  // Policies reference
  if (context.policies && context.policies.length > 0) {
    prompt += `\n\nPOLICY REFERENCE:\n`;
    prompt += context.policies.slice(0, 5).map(p => `• ${p.title}`).join("\n");
  }

  return prompt;
}

function buildHRSystemPrompt(context: UserContext): string {
  let prompt = `${STRICT_BOUNDARY_PROMPT}
${DECISION_SUPPORT_PROMPT}
${ACTION_COMMANDS_PROMPT}

NEXUS for HR Admin ${context.profile?.full_name || ""}

`;

  // Employee overview
  if (context.allEmployees && context.allEmployees.length > 0) {
    const deptCounts = context.allEmployees.reduce((acc, emp) => {
      const dept = emp.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    prompt += `HEADCOUNT: ${context.allEmployees.length}\n`;
    prompt += Object.entries(deptCounts).map(([d, c]) => `• ${d}: ${c}`).join("\n");
  }

  // Leave requests
  if (context.teamLeaveRequests && context.teamLeaveRequests.length > 0) {
    const pending = context.teamLeaveRequests.filter(l => l.status === "pending");
    prompt += `\n\n⚠️ PENDING LEAVES: ${pending.length}\n`;
    prompt += pending.slice(0, 10).map(l => {
      const name = l.employee_name || `User ${l.user_id.substring(0, 6)}`;
      return `• ID:${l.id.substring(0, 8)} | ${name} | ${l.leave_type} | ${l.start_date} to ${l.end_date}`;
    }).join("\n");
  }

  // Task metrics
  if (context.teamTasks && context.teamTasks.length > 0) {
    prompt += `\n\nORG TASKS: ${context.teamTasks.length} total, ${context.teamTasks.filter(t => t.priority === "high").length} high-priority`;
  }

  // Policies
  if (context.policies && context.policies.length > 0) {
    prompt += `\n\nPOLICIES: ${context.policies.length} active\n`;
    prompt += context.policies.slice(0, 5).map(p => `• ${p.title}`).join("\n");
  }

  return prompt;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const { messages, userRole, userId, context }: RequestBody = await req.json();

    // Build role-specific system prompt
    let systemPrompt = "";
    
    if (userRole === "employee") {
      systemPrompt = buildEmployeeSystemPrompt(context);
    } else if (userRole === "manager") {
      systemPrompt = buildManagerSystemPrompt(context);
    } else if (userRole === "hr") {
      systemPrompt = buildHRSystemPrompt(context);
    }

    console.log(`[NEXUS] ${userRole} query from ${userId}`);

    const allMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        max_tokens: 500, // Shorter for concise responses
        temperature: 0.3, // Lower for consistent, factual responses
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    
    const choices = data?.choices;
    const assistantMessage = (choices && choices.length > 0 && choices[0]?.message?.content) 
      ? choices[0].message.content 
      : "Error generating response. Try again.";

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in nexus-chat:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
