// ============================================================
// Nexus AI Chat Edge Function
// Handles role-aware AI conversations with structured actions
// Uses Lovable AI Gateway (Gemini Flash) for responses
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Type definitions ---

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ClaimRecord {
  id: string;
  claim_date: string;
  category: string;
  description: string;
  amount: number;
  status: string;
  provider: string | null;
}

interface UserContext {
  profile?: {
    id: string;
    full_name: string | null;
    department: string | null;
    bio: string | null;
  };
  salary?: {
    basic: number;
    hra: number;
    special_allowance: number;
    pf_deduction: number;
    tax: number;
    insurance: number;
    gross: number;
    net: number;
    currency: string;
  };
  benefits?: {
    insurance_tier: string;
    total_limit: number;
    amount_spent: number;
    coverage_details: Record<string, any>;
    dependents: Array<Record<string, any>>;
    plan_start_date: string;
    plan_end_date: string | null;
  };
  claims?: ClaimRecord[];
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
// FUNCTION CALLING SCHEMA - Structured action format for AI
// ============================================================
const FUNCTION_SCHEMA = `
## AVAILABLE FUNCTIONS (use these for actions):

When the user asks you to DO something (not just query), respond with:
1. A natural language confirmation
2. A JSON block wrapped in \`\`\`json ... \`\`\` with the actions

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
\`\`\`
<Natural language message - concise, friendly>

\`\`\`json
{
  "actions": [
    { "function": "function_name", "params": { ... } }
  ]
}
\`\`\`
\`\`\`

### IMPORTANT RULES:
- ALWAYS include JSON block when taking an action
- Use EXACT UUIDs from the context data
- For queries (no action needed), respond naturally WITHOUT JSON
- Keep responses ULTRA SHORT (1-2 sentences max)
`;

// ============================================================
// CORE RULES - Applies to ALL roles
// ============================================================
const CORE_RULES = `
NEXUS AI - STRICT OPERATING RULES:

1. ONLY handle company/work matters. Off-topic = "I only handle company matters."
2. Use EXACT data from context - never fabricate IDs, names, or numbers
3. Be ULTRA-CONCISE: 1-2 sentences max
4. For actions, ALWAYS include the JSON function block
5. For queries, respond naturally without JSON
6. Reference specific data when answering
7. Be proactive - suggest next actions after completing requests
8. TODAY'S DATE: Use for relative date calculations

## AUTHORIZATION & PRIVACY RULES:
- NEVER reveal another employee's salary, compensation, or personal financial data
- If a user asks for someone else's salary/compensation: respond "I am not authorized to share private compensation data."
- Each user can ONLY see their own salary, benefits, and claims
- Managers can see team tasks and leaves, but NOT team salaries
- HR can see org-wide operational data but salary queries must go through the Payroll page

## BENEFITS & INSURANCE RULES:
- Answer benefits questions ONLY from the employee's actual data in context
- If specific coverage info is missing: "Please contact HR for specific policy documents."
- Never make up coverage amounts, limits, or policy details
- Interpret coverage_details JSON and dependents list for the user

## CLAIMS RULES:
- Answer "where did I spend my insurance?" using the claims data in context
- Summarize claims by category, provider, and amount
- If no claims data available, say "No claims records found. Contact HR for historical data."
`;

// ============================================================
// PERSONAL DATA BLOCK - Included for ALL roles
// ============================================================
function buildPersonalDataBlock(context: UserContext): string {
  let block = "";

  // Salary info - personal, available to all roles for their own data
  if (context.salary) {
    const s = context.salary;
    block += `\nYOUR SALARY (${s.currency}):\n`;
    block += `• Basic: ₹${s.basic.toLocaleString()}\n`;
    block += `• HRA: ₹${s.hra.toLocaleString()}\n`;
    block += `• Special Allowance: ₹${s.special_allowance.toLocaleString()}\n`;
    block += `• PF Deduction: ₹${s.pf_deduction.toLocaleString()}\n`;
    block += `• Tax: ₹${s.tax.toLocaleString()}\n`;
    block += `• Insurance: ₹${s.insurance.toLocaleString()}\n`;
    block += `• Gross: ₹${s.gross.toLocaleString()} | Net: ₹${s.net.toLocaleString()}\n`;
  } else {
    block += "\nYOUR SALARY: Not available. Contact HR.\n";
  }

  // Benefits & insurance
  if (context.benefits) {
    const b = context.benefits;
    block += `\nYOUR BENEFITS & INSURANCE:\n`;
    block += `• Tier: ${b.insurance_tier}\n`;
    block += `• Total Limit: ₹${b.total_limit.toLocaleString()}\n`;
    block += `• Amount Spent: ₹${b.amount_spent.toLocaleString()}\n`;
    block += `• Remaining: ₹${(b.total_limit - b.amount_spent).toLocaleString()}\n`;
    block += `• Plan Period: ${b.plan_start_date}${b.plan_end_date ? ` to ${b.plan_end_date}` : " (ongoing)"}\n`;
    if (b.coverage_details && Object.keys(b.coverage_details).length > 0) {
      block += `• Coverage: ${JSON.stringify(b.coverage_details)}\n`;
    }
    if (b.dependents && b.dependents.length > 0) {
      block += `• Dependents (${b.dependents.length}): ${JSON.stringify(b.dependents)}\n`;
    } else {
      block += `• Dependents: None registered\n`;
    }
  } else {
    block += "\nYOUR BENEFITS: No plan assigned. Contact HR for enrollment.\n";
  }

  // Claims history
  if (context.claims && context.claims.length > 0) {
    const totalClaimed = context.claims.reduce((sum, c) => sum + c.amount, 0);
    block += `\nYOUR CLAIMS HISTORY (${context.claims.length} claims, total: ₹${totalClaimed.toLocaleString()}):\n`;
    context.claims.forEach((c) => {
      block += `• ${c.claim_date} | ${c.category} | ₹${c.amount.toLocaleString()} | ${c.status} | ${c.provider || "N/A"} | "${c.description}"\n`;
    });
  } else {
    block += "\nYOUR CLAIMS: No claims on record.\n";
  }

  // Personal tasks
  if (context.tasks && context.tasks.length > 0) {
    block += `\nYOUR TASKS (${context.tasks.length}):\n`;
    context.tasks.forEach((t) => {
      block += `• ID:${t.id} | "${t.title}" | ${t.status} | ${t.priority} priority${t.due_date ? ` | Due: ${t.due_date}` : ""}\n`;
    });
  } else {
    block += "\nYOUR TASKS: None assigned\n";
  }

  // Personal leave requests
  if (context.leaveRequests && context.leaveRequests.length > 0) {
    block += `\nYOUR LEAVE REQUESTS:\n`;
    context.leaveRequests.forEach((l) => {
      block += `• ID:${l.id} | ${l.leave_type} | ${l.start_date} to ${l.end_date} | ${l.status}\n`;
    });
  }

  return block;
}

// ============================================================
// ROLE-SPECIFIC PROMPT BUILDERS
// ============================================================

function buildEmployeeSystemPrompt(context: UserContext): string {
  let prompt = `${CORE_RULES}\n\n${FUNCTION_SCHEMA}\n\n`;
  prompt += `EMPLOYEE: ${context.profile?.full_name || "User"} | ${context.profile?.department || "No Dept"}\n`;
  prompt += `AVAILABLE FUNCTIONS: navigate, update_task (own), submit_leave\n`;
  prompt += buildPersonalDataBlock(context);

  // Announcements
  if (context.announcements && context.announcements.length > 0) {
    prompt += `\nANNOUNCEMENTS:\n`;
    context.announcements.slice(0, 5).forEach((a) => {
      prompt += `• "${a.title}": ${a.content.substring(0, 100)}...\n`;
    });
  }

  // Policies
  if (context.policies && context.policies.length > 0) {
    prompt += `\nCOMPANY POLICIES:\n`;
    context.policies.forEach((p) => {
      prompt += `• ${p.title} (${p.category || "General"})\n`;
    });
  }

  return prompt;
}

function buildManagerSystemPrompt(context: UserContext): string {
  let prompt = `${CORE_RULES}\n\n${FUNCTION_SCHEMA}\n\n`;
  prompt += `MANAGER: ${context.profile?.full_name || "Manager"} | ${context.profile?.department || ""}\n`;
  prompt += `AVAILABLE FUNCTIONS: approve_leave, reject_leave, update_task, create_task, create_announcement, navigate\n`;

  // Personal profile data first (salary, benefits, claims, tasks)
  prompt += buildPersonalDataBlock(context);

  // Team leave requests (manager-specific)
  if (context.teamLeaveRequests) {
    const pending = context.teamLeaveRequests.filter((l) => l.status === "pending");
    if (pending.length > 0) {
      prompt += `\n⚠️ TEAM PENDING LEAVE APPROVALS (${pending.length}):\n`;
      pending.forEach((l) => {
        prompt += `• ID:${l.id} | ${l.employee_name || "Employee"} | ${l.leave_type} | ${l.start_date} to ${l.end_date}${l.reason ? ` | "${l.reason}"` : ""}\n`;
      });
    }
    const approved = context.teamLeaveRequests.filter((l) => l.status === "approved");
    if (approved.length > 0) {
      prompt += `\nTEAM APPROVED LEAVES (${approved.length}):\n`;
      approved.slice(0, 5).forEach((l) => {
        prompt += `• ${l.employee_name || "Employee"}: ${l.start_date} to ${l.end_date}\n`;
      });
    }
  }

  // Team tasks
  if (context.teamTasks && context.teamTasks.length > 0) {
    const pending = context.teamTasks.filter((t) => t.status === "pending").length;
    const inProgress = context.teamTasks.filter((t) => t.status === "in_progress").length;
    const highPriority = context.teamTasks.filter((t) => t.priority === "high").length;
    prompt += `\nTEAM TASKS: ${context.teamTasks.length} total | ${pending} pending | ${inProgress} in-progress | ${highPriority} high-priority\n`;
    context.teamTasks.slice(0, 8).forEach((t) => {
      prompt += `• ID:${t.id} | "${t.title}" | ${t.status} | ${t.priority}\n`;
    });
  }

  // Announcements & policies
  if (context.announcements && context.announcements.length > 0) {
    prompt += `\nANNOUNCEMENTS:\n`;
    context.announcements.slice(0, 3).forEach((a) => {
      prompt += `• "${a.title}"\n`;
    });
  }
  if (context.policies && context.policies.length > 0) {
    prompt += `\nPOLICIES: ${context.policies.map((p) => p.title).join(", ")}\n`;
  }

  return prompt;
}

function buildHRSystemPrompt(context: UserContext): string {
  let prompt = `${CORE_RULES}\n\n${FUNCTION_SCHEMA}\n\n`;
  prompt += `HR ADMIN: ${context.profile?.full_name || "HR"}\n`;
  prompt += `AVAILABLE FUNCTIONS (FULL ACCESS): approve_leave, reject_leave, update_task, create_task, create_announcement, navigate (all pages)\n`;

  // Personal profile data first (salary, benefits, claims, tasks)
  prompt += buildPersonalDataBlock(context);

  // Organization overview (HR-specific)
  if (context.allEmployees && context.allEmployees.length > 0) {
    const deptCounts = context.allEmployees.reduce((acc, emp) => {
      const dept = emp.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    prompt += `\nORGANIZATION (${context.allEmployees.length} employees):\n`;
    Object.entries(deptCounts).forEach(([dept, count]) => {
      prompt += `• ${dept}: ${count}\n`;
    });
    prompt += `\nEMPLOYEE DIRECTORY:\n`;
    context.allEmployees.slice(0, 15).forEach((e) => {
      prompt += `• ID:${e.id} | ${e.full_name || "Unnamed"} | ${e.department || "No Dept"}\n`;
    });
  }

  // All pending leaves
  if (context.teamLeaveRequests) {
    const pending = context.teamLeaveRequests.filter((l) => l.status === "pending");
    if (pending.length > 0) {
      prompt += `\n⚠️ PENDING LEAVE APPROVALS (${pending.length}):\n`;
      pending.forEach((l) => {
        prompt += `• ID:${l.id} | ${l.employee_name || "Employee"} | ${l.leave_type} | ${l.start_date} to ${l.end_date}\n`;
      });
    }
  }

  // All tasks
  if (context.teamTasks && context.teamTasks.length > 0) {
    prompt += `\nORG TASKS: ${context.teamTasks.length} total\n`;
    context.teamTasks.slice(0, 10).forEach((t) => {
      prompt += `• ID:${t.id} | "${t.title}" | ${t.status} | ${t.priority}\n`;
    });
  }

  // Announcements & policies
  if (context.announcements && context.announcements.length > 0) {
    prompt += `\nANNOUNCEMENTS:\n`;
    context.announcements.slice(0, 5).forEach((a) => {
      prompt += `• ID:${a.id} | "${a.title}" | ${a.priority || "normal"}\n`;
    });
  }
  if (context.policies && context.policies.length > 0) {
    prompt += `\nPOLICIES (${context.policies.length}):\n`;
    context.policies.forEach((p) => {
      prompt += `• ID:${p.id} | ${p.title} | ${p.category || "General"}\n`;
    });
  }

  return prompt;
}

// ============================================================
// MAIN HANDLER
// ============================================================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { messages, userRole, userId, context }: RequestBody = await req.json();

    // Build role-specific system prompt with today's date
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    let systemPrompt = "";
    if (userRole === "employee") {
      systemPrompt = buildEmployeeSystemPrompt(context);
    } else if (userRole === "manager") {
      systemPrompt = buildManagerSystemPrompt(context);
    } else if (userRole === "hr") {
      systemPrompt = buildHRSystemPrompt(context);
    }
    systemPrompt = `TODAY'S DATE: ${todayStr}\n\n` + systemPrompt;

    console.log(`[NEXUS] ${userRole} query from ${userId}`);

    const allMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Call Lovable AI Gateway
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: allMessages,
          max_tokens: 800,
          temperature: 0.2,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const choices = data?.choices;
    const assistantMessage =
      choices && choices.length > 0 && choices[0]?.message?.content
        ? choices[0].message.content
        : "Error generating response. Try again.";

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in nexus-chat:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
