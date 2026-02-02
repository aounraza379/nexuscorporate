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
  // Manager/HR specific context
  teamLeaveRequests?: Array<{
    id: string;
    user_id: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: string;
    reason: string | null;
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

const STRICT_BOUNDARY_PROMPT = `
CRITICAL RESTRICTIONS - YOU MUST FOLLOW THESE RULES:
1. You are NEXUS, an AI HR Assistant for this company ONLY.
2. You can ONLY answer questions related to:
   - Company policies provided in the context
   - The user's own tasks, leave requests, and work details
   - For Managers/HR: team management, leave approvals, employee data provided
3. You MUST REFUSE to answer:
   - General knowledge questions unrelated to work
   - Questions about other companies
   - Personal advice unrelated to work
   - Any topic not covered by company data
4. If asked something outside your scope, respond: "I can only help with company-related matters. Please ask about your tasks, leave policies, company rules, or work-related topics."
5. Always reference SPECIFIC data from the context when answering.
6. Be professional, helpful, and treat each user based on their role and personal data.
`;

function buildEmployeeSystemPrompt(context: UserContext): string {
  let prompt = `${STRICT_BOUNDARY_PROMPT}

You are NEXUS, the personal HR Assistant for ${context.profile?.full_name || "this employee"}.
Department: ${context.profile?.department || "Not specified"}

YOUR ROLE: Act as a friendly, knowledgeable HR representative who knows this specific employee's work situation intimately.

=== THIS EMPLOYEE'S CURRENT WORK STATUS ===
`;

  // Add tasks context
  if (context.tasks && context.tasks.length > 0) {
    const pendingTasks = context.tasks.filter(t => t.status === "pending");
    const inProgressTasks = context.tasks.filter(t => t.status === "in_progress");
    const completedTasks = context.tasks.filter(t => t.status === "completed");
    
    prompt += `
TASKS OVERVIEW:
- Total assigned tasks: ${context.tasks.length}
- Pending: ${pendingTasks.length}
- In Progress: ${inProgressTasks.length}
- Completed: ${completedTasks.length}

DETAILED TASK LIST:
${context.tasks.map(t => `• [${t.status?.toUpperCase()}] ${t.title} (Priority: ${t.priority}${t.due_date ? `, Due: ${t.due_date}` : ""})${t.description ? ` - ${t.description}` : ""}`).join("\n")}
`;
  } else {
    prompt += "\nTASKS: No tasks currently assigned to this employee.\n";
  }

  // Add leave requests context
  if (context.leaveRequests && context.leaveRequests.length > 0) {
    prompt += `
LEAVE REQUEST HISTORY:
${context.leaveRequests.map(l => `• ${l.leave_type.toUpperCase()} (${l.start_date} to ${l.end_date}) - Status: ${l.status}${l.reason ? ` | Reason: ${l.reason}` : ""}`).join("\n")}
`;
  } else {
    prompt += "\nLEAVE REQUESTS: No leave requests on file.\n";
  }

  // Add policies context
  if (context.policies && context.policies.length > 0) {
    prompt += `
=== COMPANY POLICIES (Your Knowledge Base) ===
${context.policies.map(p => `
### ${p.title} (${p.category || "General"})
${p.content}
`).join("\n---\n")}
`;
  }

  prompt += `
=== HOW TO RESPOND ===
- When asked about tasks: Reference the SPECIFIC tasks listed above
- When asked about leave: Check their leave history and explain relevant policies
- When asked policy questions: Quote from the company policies above
- Always personalize responses using their name and department
- If they ask something not covered by this data, politely redirect to HR or say you don't have that information
`;

  return prompt;
}

function buildManagerSystemPrompt(context: UserContext): string {
  let prompt = `${STRICT_BOUNDARY_PROMPT}

You are NEXUS, the Management Assistant for ${context.profile?.full_name || "this manager"}.
Department: ${context.profile?.department || "Not specified"}

YOUR ROLE: Assist managers with team oversight, leave approvals, task management, and identifying potential issues like burnout.

=== YOUR PERSONAL WORK STATUS ===
`;

  // Manager's own tasks
  if (context.tasks && context.tasks.length > 0) {
    prompt += `
YOUR TASKS:
${context.tasks.map(t => `• [${t.status?.toUpperCase()}] ${t.title} (Priority: ${t.priority})`).join("\n")}
`;
  }

  // Team leave requests pending approval
  if (context.teamLeaveRequests && context.teamLeaveRequests.length > 0) {
    const pendingLeaves = context.teamLeaveRequests.filter(l => l.status === "pending");
    prompt += `
=== TEAM LEAVE REQUESTS REQUIRING ACTION ===
Pending Approvals: ${pendingLeaves.length}
${context.teamLeaveRequests.map(l => `• User ${l.user_id.substring(0, 8)}... - ${l.leave_type} (${l.start_date} to ${l.end_date}) - STATUS: ${l.status.toUpperCase()}${l.reason ? ` | Reason: ${l.reason}` : ""}`).join("\n")}
`;
  }

  // Team tasks overview
  if (context.teamTasks && context.teamTasks.length > 0) {
    const tasksByStatus = {
      pending: context.teamTasks.filter(t => t.status === "pending").length,
      in_progress: context.teamTasks.filter(t => t.status === "in_progress").length,
      completed: context.teamTasks.filter(t => t.status === "completed").length,
    };
    
    prompt += `
=== TEAM TASKS OVERVIEW ===
Total: ${context.teamTasks.length} | Pending: ${tasksByStatus.pending} | In Progress: ${tasksByStatus.in_progress} | Completed: ${tasksByStatus.completed}

Task Details:
${context.teamTasks.slice(0, 20).map(t => `• [${t.status?.toUpperCase()}] ${t.title} (Priority: ${t.priority})`).join("\n")}
`;
  }

  // Policies
  if (context.policies && context.policies.length > 0) {
    prompt += `
=== COMPANY POLICIES REFERENCE ===
${context.policies.map(p => `### ${p.title}\n${p.content.substring(0, 500)}...`).join("\n\n")}
`;
  }

  prompt += `
=== HOW TO HELP MANAGERS ===
- Summarize pending leave requests and recommend actions
- Identify employees with high workloads (many pending/in-progress tasks)
- Answer policy questions to help make decisions
- Flag potential burnout risks (employees with many overdue tasks)
- Provide team productivity insights based on task data
`;

  return prompt;
}

function buildHRSystemPrompt(context: UserContext): string {
  let prompt = `${STRICT_BOUNDARY_PROMPT}

You are NEXUS, the HR Analytics & Policy Assistant for ${context.profile?.full_name || "HR Admin"}.

YOUR ROLE: Provide comprehensive HR support including policy management, employee data analysis, leave oversight, and organizational insights.

=== ORGANIZATION OVERVIEW ===
`;

  // All employees overview
  if (context.allEmployees && context.allEmployees.length > 0) {
    const deptCounts = context.allEmployees.reduce((acc, emp) => {
      const dept = emp.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    prompt += `
EMPLOYEE HEADCOUNT: ${context.allEmployees.length}
BY DEPARTMENT:
${Object.entries(deptCounts).map(([dept, count]) => `• ${dept}: ${count}`).join("\n")}
`;
  }

  // All leave requests
  if (context.teamLeaveRequests && context.teamLeaveRequests.length > 0) {
    const leaveStats = {
      pending: context.teamLeaveRequests.filter(l => l.status === "pending").length,
      approved: context.teamLeaveRequests.filter(l => l.status === "approved").length,
      rejected: context.teamLeaveRequests.filter(l => l.status === "rejected").length,
    };

    prompt += `
=== LEAVE REQUESTS OVERVIEW ===
Total: ${context.teamLeaveRequests.length} | Pending: ${leaveStats.pending} | Approved: ${leaveStats.approved} | Rejected: ${leaveStats.rejected}

Recent Requests:
${context.teamLeaveRequests.slice(0, 15).map(l => `• User ${l.user_id.substring(0, 8)}... - ${l.leave_type} (${l.start_date} to ${l.end_date}) - ${l.status.toUpperCase()}`).join("\n")}
`;
  }

  // All tasks for workload analysis
  if (context.teamTasks && context.teamTasks.length > 0) {
    prompt += `
=== ORGANIZATION TASK METRICS ===
Total Tasks: ${context.teamTasks.length}
- Pending: ${context.teamTasks.filter(t => t.status === "pending").length}
- In Progress: ${context.teamTasks.filter(t => t.status === "in_progress").length}
- Completed: ${context.teamTasks.filter(t => t.status === "completed").length}
- High Priority: ${context.teamTasks.filter(t => t.priority === "high").length}
`;
  }

  // Full policies for HR
  if (context.policies && context.policies.length > 0) {
    prompt += `
=== COMPLETE COMPANY POLICIES ===
${context.policies.map(p => `
### ${p.title} [${p.category || "General"}]
${p.content}
`).join("\n---\n")}
`;
  }

  prompt += `
=== HR ASSISTANT CAPABILITIES ===
- Provide detailed policy information and help draft new policies
- Analyze leave patterns and recommend policy changes
- Identify workload imbalances across the organization
- Answer employee queries about policies (as if you were HR)
- Generate insights about organizational health
- Help with compliance questions based on existing policies
`;

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { messages, userRole, userId, context }: RequestBody = await req.json();

    // Build role-specific system prompt with full context
    let systemPrompt = "";
    
    if (userRole === "employee") {
      systemPrompt = buildEmployeeSystemPrompt(context);
    } else if (userRole === "manager") {
      systemPrompt = buildManagerSystemPrompt(context);
    } else if (userRole === "hr") {
      systemPrompt = buildHRSystemPrompt(context);
    }

    console.log(`Processing ${userRole} query for user ${userId}`);
    console.log(`Context: ${context.tasks?.length || 0} tasks, ${context.leaveRequests?.length || 0} leaves, ${context.policies?.length || 0} policies`);

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
        max_tokens: 1500,
        temperature: 0.5, // Lower temperature for more consistent, factual responses
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Response received:", JSON.stringify(data).substring(0, 200));
    
    // Safe access with proper null checks
    const choices = data?.choices;
    const assistantMessage = (choices && choices.length > 0 && choices[0]?.message?.content) 
      ? choices[0].message.content 
      : "I apologize, but I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error in nexus-chat:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
