import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the calling user
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user: callingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !callingUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, displayName, projectId } = await req.json();

    if (!email || !password || !projectId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the calling user is the project owner
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("owner_id")
      .eq("id", projectId)
      .single();

    if (!project || project.owner_id !== callingUser.id) {
      return new Response(JSON.stringify({ error: "Only project owners can add members" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create the user using admin API (doesn't affect current session)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { display_name: displayName || email.split("@")[0] }
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add user to project members
    const { error: memberError } = await supabaseAdmin.from("project_members").insert({
      project_id: projectId,
      user_id: newUser.user.id,
      role: "member",
    });

    if (memberError) {
      return new Response(JSON.stringify({ error: memberError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
