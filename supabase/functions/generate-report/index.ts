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

    const { project_id, type = "daily" } = await req.json();
    if (!project_id) throw new Error("project_id required");

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Fetch project data
    const now = new Date();
    const periodDays = type === "weekly" ? 7 : 1;
    const periodStart = new Date(now.getTime() - periodDays * 86400000).toISOString();

    const [tasksRes, ideasRes] = await Promise.all([
      adminClient.from("tasks").select("*").eq("project_id", project_id),
      adminClient.from("ideas").select("id, status, ai_summary").eq("project_id", project_id).gte("created_at", periodStart),
    ]);

    const tasks = tasksRes.data || [];
    const ideas = ideasRes.data || [];

    const tasksByStatus: Record<string, number> = {};
    const tasksByPriority: Record<string, number> = {};
    let overdueCount = 0;

    for (const t of tasks) {
      tasksByStatus[t.status || "backlog"] = (tasksByStatus[t.status || "backlog"] || 0) + 1;
      tasksByPriority[t.priority || "medium"] = (tasksByPriority[t.priority || "medium"] || 0) + 1;
      if (t.due_date && new Date(t.due_date) < now && t.status !== "done") overdueCount++;
    }

    const contextText = `
Project stats for the last ${periodDays} day(s):
- Total tasks: ${tasks.length}
- By status: ${JSON.stringify(tasksByStatus)}
- By priority: ${JSON.stringify(tasksByPriority)}
- Overdue: ${overdueCount}
- New ideas this period: ${ideas.length}
`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a project analyst. Generate a concise project health report. Use the generate_report tool." },
          { role: "user", content: `Generate a ${type} report:\n${contextText}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_report",
            description: "Generate a structured project report.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                summary: { type: "string", description: "2-3 sentence executive summary" },
                highlights: { type: "array", items: { type: "string" }, description: "3-5 key highlights" },
                risks: { type: "array", items: { type: "string" }, description: "Potential risks or blockers" },
                recommendations: { type: "array", items: { type: "string" }, description: "Actionable recommendations" },
                health_score: { type: "number", description: "Project health 0-100" },
              },
              required: ["title", "summary", "highlights", "risks", "recommendations", "health_score"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_report" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResponse.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call");

    const report = JSON.parse(toolCall.function.arguments);

    // Store report
    await adminClient.from("reports").insert({
      project_id,
      title: report.title,
      type,
      content: { ...report, tasks_by_status: tasksByStatus, tasks_by_priority: tasksByPriority, overdue_count: overdueCount },
      period_start: periodStart,
      period_end: now.toISOString(),
      generated_by: "ai",
    });

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
