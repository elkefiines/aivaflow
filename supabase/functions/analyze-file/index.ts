import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { file_path, project_id } = await req.json();
    if (!file_path || !project_id) throw new Error("file_path and project_id required");

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Download file from storage
    const { data: fileData, error: dlError } = await adminClient.storage
      .from("project-files")
      .download(file_path);

    if (dlError || !fileData) throw new Error("Failed to download file");

    const text = await fileData.text();
    if (!text.trim()) throw new Error("File is empty");

    // Create idea record
    const { data: idea, error: ideaError } = await adminClient.from("ideas").insert({
      raw_text: text.slice(0, 10000),
      project_id,
      user_id: user.id,
      status: "processing",
      source_file_url: file_path,
    }).select().single();

    if (ideaError || !idea) throw new Error("Failed to create idea");

    // Call AI to extract tasks
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a project management AI. Extract structured tasks from file content. Return tasks using the suggest_tasks tool." },
          { role: "user", content: `Extract actionable tasks from this document:\n\n${text.slice(0, 8000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_tasks",
            description: "Return structured task suggestions.",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string" },
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    },
                    required: ["title", "priority"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["summary", "tasks"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_tasks" } },
      }),
    });

    if (!aiResponse.ok) {
      await adminClient.from("ideas").update({ status: "raw" }).eq("id", idea.id);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const parsed = JSON.parse(toolCall.function.arguments);

    await adminClient.from("ideas").update({
      ai_summary: parsed.summary,
      ai_tasks: parsed.tasks,
      status: "converted",
    }).eq("id", idea.id);

    return new Response(JSON.stringify({ idea_id: idea.id, ...parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-file error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
