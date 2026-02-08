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
  announcements?: Array<{
    id: string;
    title: string;
    content: string;
    priority: string | null;
  }>;
}

interface RequestBody {
  messages: ChatMessage[];
  userRole: "employee" | "manager" | "hr";
  userId: string;
  context: UserContext;
}

// ============================================================
// FUNCTION CALLING SCHEMA - This is what the AI must output
// ============================================================
const FUNCTION_SCHEMA = `
## AVAILABLE FUNCTIONS (you MUST use these for actions):

When the user asks you to DO something (not just query data), you MUST respond with:
1. A natural language confirmation message for the user
2. A JSON block wrapped in \`\`\`json ... \`\`\` tags containing the actions

### Function Definitions:

1. **approve_leave** - Approve a leave request
   { "function": "approve_leave", "params": { "leave_id": "<uuid>" } }

2. **reject_leave** - Reject a leave request  
   { "function": "reject_leave", "params": { "leave_id": "<uuid>" } }

3. **update_task** - Update a task's status
   { "function": "update_task", "params": { "task_id": "<uuid>", "status": "pending|in_progress|completed" } }

4. **create_task** - Create a new task
   { "function": "create_task", "params": { "title": "<string>", "description": "<string>", "priority": "low|medium|high", "assigned_to": "<uuid|null>" } }

5. **create_announcement** - Create an announcement (manager/hr only)
   { "function": "create_announcement", "params": { "title": "<string>", "content": "<string>", "priority": "low|normal|high" } }

6. **navigate** - Navigate to a page
   { "function": "navigate", "params": { "route": "dashboard|tasks|leave|analytics|announcements|team|employees|settings|policies|salary|wellness|payroll" } }

7. **submit_leave** - Submit a leave request (employee only)
   { "function": "submit_leave", "params": { "leave_type": "annual|sick|personal|other", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "reason": "<string>" } }

### RESPONSE FORMAT:

Your response MUST follow this exact structure:
\`\`\`
<Natural language message to user - concise, friendly>

\`\`\`json
{
  "actions": [
    { "function": "function_name", "params": { ... } }
  ]
}
\`\`\`
\`\`\`

### EXAMPLES:

User: "Approve John's leave request"
Response:
Done! Approved John's sick leave for Feb 5-6.

\`\`\`json
{
  "actions": [
    { "function": "approve_leave", "params": { "leave_id": "abc12345-1234-1234-1234-123456789012" } }
  ]
}
\`\`\`

User: "Reject all pending leaves"
Response:
Rejected 3 pending leave requests.

\`\`\`json
{
  "actions": [
    { "function": "reject_leave", "params": { "leave_id": "id1" } },
    { "function": "reject_leave", "params": { "leave_id": "id2" } },
    { "function": "reject_leave", "params": { "leave_id": "id3" } }
  ]
}
\`\`\`

User: "Show me analytics"
Response:
Opening Analytics...

\`\`\`json
{
  "actions": [
    { "function": "navigate", "params": { "route": "analytics" } }
  ]
}
\`\`\`

User: "Create a high priority task for reviewing Q1 reports"
Response:
Created a new high-priority task for reviewing Q1 reports.

\`\`\`json
{
  "actions": [
    { "function": "create_task", "params": { "title": "Review Q1 Reports", "description": "Review and summarize Q1 financial reports", "priority": "high", "assigned_to": null } }
  ]
}
\`\`\`

User: "Mark my task as completed" (when they have 1 pending task)
Response:
Marked "Prepare presentation" as completed.

\`\`\`json
{
  "actions": [
    { "function": "update_task", "params": { "task_id": "task-uuid-here", "status": "completed" } }
  ]
}
\`\`\`

### IMPORTANT RULES:
- ALWAYS include the JSON block when taking an action
- Use EXACT UUIDs from the context data
- If multiple actions needed, include ALL in the actions array
- For queries (no action needed), just respond naturally WITHOUT the JSON block
- Keep natural language responses ULTRA SHORT (1-2 sentences max)
`;

const CORE_RULES = `
NEXUS AI - STRICT OPERATING RULES:

1. ONLY handle company/work matters. Off-topic = "I only handle company matters."
2. Use EXACT data from context - never make up IDs or names
3. Be ULTRA-CONCISE: 1-2 sentences max
4. For actions, ALWAYS include the JSON function block
5. For queries, respond naturally without JSON
6. Reference specific data when answering questions
7. Be proactive - suggest next actions after completing requests
`;

function buildEmployeeSystemPrompt(context: UserContext): string {
  let prompt = `${CORE_RULES}\n\n${FUNCTION_SCHEMA}\n\n`;
  prompt += `EMPLOYEE: ${context.profile?.full_name || "User"} | ${context.profile?.department || "No Dept"}\n\n`;

  prompt += `AVAILABLE FUNCTIONS FOR EMPLOYEE:\n- navigate (all pages except payroll/admin)\n- update_task (own tasks only)\n- submit_leave\n\n`;

  if (context.tasks && context.tasks.length > 0) {
    prompt += `YOUR TASKS (${context.tasks.length}):\n`;
    context.tasks.forEach(t => {
      prompt += `• ID:${t.id} | "${t.title}" | ${t.status} | ${t.priority} priority${t.due_date ? ` | Due: ${t.due_date}` : ""}\n`;
    });
  } else {
    prompt += "YOUR TASKS: None assigned\n";
  }

  if (context.leaveRequests && context.leaveRequests.length > 0) {
    prompt += `\nYOUR LEAVE REQUESTS:\n`;
    context.leaveRequests.forEach(l => {
      prompt += `• ID:${l.id} | ${l.leave_type} | ${l.start_date} to ${l.end_date} | ${l.status}\n`;
    });
  }

  if (context.announcements && context.announcements.length > 0) {
    prompt += `\nANNOUNCEMENTS:\n`;
    context.announcements.slice(0, 5).forEach(a => {
      prompt += `• "${a.title}": ${a.content.substring(0, 100)}...\n`;
    });
  }

  if (context.policies && context.policies.length > 0) {
    prompt += `\nCOMPANY POLICIES:\n`;
    context.policies.forEach(p => {
      prompt += `• ${p.title} (${p.category || "General"})\n`;
    });
  }

  return prompt;
}

function buildManagerSystemPrompt(context: UserContext): string {
  let prompt = `${CORE_RULES}\n\n${FUNCTION_SCHEMA}\n\n`;
  prompt += `MANAGER: ${context.profile?.full_name || "Manager"} | ${context.profile?.department || ""}\n\n`;

  prompt += `AVAILABLE FUNCTIONS FOR MANAGER:\n- approve_leave, reject_leave\n- update_task, create_task\n- create_announcement\n- navigate (all pages)\n\n`;

  // Pending leaves are the priority for managers
  if (context.teamLeaveRequests) {
    const pending = context.teamLeaveRequests.filter(l => l.status === "pending");
    if (pending.length > 0) {
      prompt += `⚠️ PENDING LEAVE APPROVALS (${pending.length}):\n`;
      pending.forEach(l => {
        prompt += `• ID:${l.id} | ${l.employee_name || "Employee"} | ${l.leave_type} | ${l.start_date} to ${l.end_date}${l.reason ? ` | Reason: "${l.reason}"` : ""}\n`;
      });
      prompt += "\n";
    }

    const approved = context.teamLeaveRequests.filter(l => l.status === "approved");
    if (approved.length > 0) {
      prompt += `APPROVED LEAVES (${approved.length}):\n`;
      approved.slice(0, 5).forEach(l => {
        prompt += `• ${l.employee_name || "Employee"}: ${l.start_date} to ${l.end_date}\n`;
      });
      prompt += "\n";
    }
  }

  if (context.teamTasks && context.teamTasks.length > 0) {
    const pending = context.teamTasks.filter(t => t.status === "pending").length;
    const inProgress = context.teamTasks.filter(t => t.status === "in_progress").length;
    const highPriority = context.teamTasks.filter(t => t.priority === "high").length;
    
    prompt += `TEAM TASKS: ${context.teamTasks.length} total | ${pending} pending | ${inProgress} in-progress | ${highPriority} high-priority\n`;
    prompt += "Recent tasks:\n";
    context.teamTasks.slice(0, 8).forEach(t => {
      prompt += `• ID:${t.id} | "${t.title}" | ${t.status} | ${t.priority}\n`;
    });
    prompt += "\n";
  }

  if (context.announcements && context.announcements.length > 0) {
    prompt += `RECENT ANNOUNCEMENTS:\n`;
    context.announcements.slice(0, 3).forEach(a => {
      prompt += `• "${a.title}"\n`;
    });
    prompt += "\n";
  }

  if (context.policies && context.policies.length > 0) {
    prompt += `POLICIES: ${context.policies.map(p => p.title).join(", ")}\n`;
  }

  return prompt;
}

function buildHRSystemPrompt(context: UserContext): string {
  let prompt = `${CORE_RULES}\n\n${FUNCTION_SCHEMA}\n\n`;
  prompt += `HR ADMIN: ${context.profile?.full_name || "HR"}\n\n`;

  prompt += `AVAILABLE FUNCTIONS FOR HR (FULL ACCESS):\n- approve_leave, reject_leave\n- update_task, create_task\n- create_announcement\n- navigate (all pages including payroll)\n\n`;

  // Org overview
  if (context.allEmployees && context.allEmployees.length > 0) {
    const deptCounts = context.allEmployees.reduce((acc, emp) => {
      const dept = emp.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    prompt += `ORGANIZATION (${context.allEmployees.length} employees):\n`;
    Object.entries(deptCounts).forEach(([dept, count]) => {
      prompt += `• ${dept}: ${count}\n`;
    });
    prompt += "\n";

    prompt += `EMPLOYEE DIRECTORY:\n`;
    context.allEmployees.slice(0, 15).forEach(e => {
      prompt += `• ID:${e.id} | ${e.full_name || "Unnamed"} | ${e.department || "No Dept"}\n`;
    });
    prompt += "\n";
  }

  // All pending leaves
  if (context.teamLeaveRequests) {
    const pending = context.teamLeaveRequests.filter(l => l.status === "pending");
    if (pending.length > 0) {
      prompt += `⚠️ PENDING LEAVE APPROVALS (${pending.length}):\n`;
      pending.forEach(l => {
        prompt += `• ID:${l.id} | ${l.employee_name || "Employee"} | ${l.leave_type} | ${l.start_date} to ${l.end_date}\n`;
      });
      prompt += "\n";
    }
  }

  // All tasks
  if (context.teamTasks && context.teamTasks.length > 0) {
    prompt += `ORG TASKS: ${context.teamTasks.length} total\n`;
    context.teamTasks.slice(0, 10).forEach(t => {
      prompt += `• ID:${t.id} | "${t.title}" | ${t.status} | ${t.priority}\n`;
    });
    prompt += "\n";
  }

  // Announcements
  if (context.announcements && context.announcements.length > 0) {
    prompt += `ANNOUNCEMENTS:\n`;
    context.announcements.slice(0, 5).forEach(a => {
      prompt += `• ID:${a.id} | "${a.title}" | ${a.priority || "normal"} priority\n`;
    });
    prompt += "\n";
  }

  // Policies
  if (context.policies && context.policies.length > 0) {
    prompt += `POLICIES (${context.policies.length}):\n`;
    context.policies.forEach(p => {
      prompt += `• ID:${p.id} | ${p.title} | ${p.category || "General"}\n`;
    });
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
        max_tokens: 800,
        temperature: 0.2, // Lower for more consistent structured output
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
