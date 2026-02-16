const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { content, title } = await req.json();
    if (!content) throw new Error("No content provided");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You summarize company announcements into exactly 3 bullet points:
• **The Situation:** What prompted this announcement
• **The Change:** What is changing
• **My Required Action:** What the employee must do

Be concise. Each bullet should be 1 sentence max. Output ONLY the 3 bullets, no intro.`,
          },
          {
            role: "user",
            content: `Title: ${title}\n\nFull announcement:\n${content}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI error:", err);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content || "Unable to summarize.";

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Summarize error:", error);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
