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

    const { email, password, displayName, projectId, existingUserId } = await req.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Missing projectId" }), {
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

    let targetUserId: string;

    if (existingUserId) {
      // Adding an existing user to a new project
      targetUserId = existingUserId;

      // Check if already a member
      const { data: existing } = await supabaseAdmin
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "User is already a member of this project" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Creating a new user
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Missing email or password for new user" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user with this email already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
      );

      if (existingUser) {
        // User exists - just add to project
        targetUserId = existingUser.id;

        const { data: alreadyMember } = await supabaseAdmin
          .from("project_members")
          .select("id")
          .eq("project_id", projectId)
          .eq("user_id", targetUserId)
          .maybeSingle();

        if (alreadyMember) {
          return new Response(JSON.stringify({ error: "User is already a member of this project" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email.trim().toLowerCase(),
          password,
          email_confirm: true,
          user_metadata: { display_name: displayName || email.split("@")[0] }
        });

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        targetUserId = newUser.user.id;
      }
    }

    // Add user to project members
    const { error: memberError } = await supabaseAdmin.from("project_members").insert({
      project_id: projectId,
      user_id: targetUserId,
      role: "member",
    });

    if (memberError) {
      return new Response(JSON.stringify({ error: memberError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark onboarding as complete so invited members go straight to dashboard
    await supabaseAdmin
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", targetUserId);

    return new Response(JSON.stringify({ success: true, userId: targetUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
