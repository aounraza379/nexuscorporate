import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  userRole: "employee" | "manager" | "hr";
  userId: string;
  context?: {
    tasks?: any[];
    policies?: any[];
    profile?: any;
  };
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

    // Build role-specific system prompt
    let systemPrompt = "";
    
    if (userRole === "employee") {
      systemPrompt = `You are Nexus, an AI career coach and policy guide for employees at this company. 
You have access to company policies and can help employees understand their tasks, leave policies, and career development.
Be helpful, encouraging, and professional.`;
    } else if (userRole === "manager") {
      systemPrompt = `You are Nexus, an AI management assistant. 
You help managers with team analytics, task assignments, and identifying burnout risks.
Provide data-driven insights and actionable recommendations.`;
    } else if (userRole === "hr") {
      systemPrompt = `You are Nexus, an AI HR analytics and policy assistant.
You help HR professionals with policy management, payroll queries, and organizational insights.
Be precise, compliant-focused, and data-driven.`;
    }

    // Add context if available
    if (context) {
      if (context.tasks && context.tasks.length > 0) {
        systemPrompt += `\n\nUser's current tasks:\n${JSON.stringify(context.tasks, null, 2)}`;
      }
      if (context.policies && context.policies.length > 0) {
        systemPrompt += `\n\nCompany policies reference:\n${context.policies.map(p => `- ${p.title}: ${p.content?.substring(0, 200)}...`).join('\n')}`;
      }
      if (context.profile) {
        systemPrompt += `\n\nUser profile: ${context.profile.full_name}, Department: ${context.profile.department || 'Not specified'}`;
      }
    }

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
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

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
