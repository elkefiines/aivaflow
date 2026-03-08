import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tasks, members, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an AI project management assistant for AIVA Flow. Analyze the provided tasks and team data to give actionable suggestions. Be concise and practical. Respond in the same language as the task titles.`;

    let userPrompt = "";
    if (type === "distribution") {
      userPrompt = `Analyze these tasks and team members. Suggest a better task distribution to balance workload:\n\nTasks: ${JSON.stringify(tasks)}\nMembers: ${JSON.stringify(members)}\n\nProvide 3-5 specific reassignment suggestions.`;
    } else if (type === "risks") {
      userPrompt = `Analyze these tasks for risks and blockers:\n\nTasks: ${JSON.stringify(tasks)}\n\nIdentify overdue tasks, bottlenecks, and suggest mitigation strategies.`;
    } else {
      userPrompt = `Analyze these project tasks and provide smart suggestions:\n\nTasks: ${JSON.stringify(tasks)}\nMembers: ${JSON.stringify(members)}\n\nProvide: 1) Priority recommendations 2) Risk assessment 3) Estimated completion insights`;
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "provide_suggestions",
            description: "Return AI suggestions for the project",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high"] },
                      category: { type: "string", enum: ["distribution", "risk", "priority", "timeline"] },
                    },
                    required: ["title", "description", "priority", "category"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string" },
              },
              required: ["suggestions", "summary"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "provide_suggestions" } },
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to content
    const content = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ suggestions: [], summary: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-suggest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
