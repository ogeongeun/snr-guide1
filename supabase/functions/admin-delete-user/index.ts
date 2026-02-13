// supabase/functions/admin-delete-user/index.ts
import { createClient } from "@supabase/supabase-js";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-client-platform, x-supabase-client-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    const authHeader =
      req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("No auth header", { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId = body?.user_id;
    if (!targetUserId) {
      return new Response("user_id required", { status: 400, headers: corsHeaders });
    }

    // requester client (anon + user jwt)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user: requester },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !requester) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    if (requester.id === targetUserId) {
      return new Response("Cannot delete yourself", { status: 400, headers: corsHeaders });
    }

    // ✅ service role client를 여기서 먼저 만든다 (위로 올림)
    const serviceRole = Deno.env.get("SERVICE_ROLE_KEY")!;
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, serviceRole, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${serviceRole}` } },
    });

    // =========================
    // ✅ 권한 체크
    // 1) admins 테이블에 있으면 OK   (adminClient로 체크)
    // 2) 아니면 같은 길드 leader이면 OK
    // =========================
    let allowed = false;

    // ✅ 관리자 체크: adminClient로 (RLS 영향 제거)
    const { data: adminRow, error: adminErr } = await adminClient
      .from("admins")
      .select("user_id")
      .eq("user_id", requester.id)
      .maybeSingle();

    if (adminErr) {
      return new Response(JSON.stringify({ error: adminErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (adminRow) allowed = true;

    // 2) 관리자 아니면: leader인지 확인(본인 row라 supabase로 가능)
    let leaderGuildId: string | null = null;

    if (!allowed) {
      const { data: myLeaderRow, error: lgErr } = await supabase
        .from("guild_members")
        .select("guild_id, role, created_at")
        .eq("user_id", requester.id)
        .eq("role", "leader")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lgErr) {
        return new Response(JSON.stringify({ error: lgErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!myLeaderRow?.guild_id) {
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }

      leaderGuildId = myLeaderRow.guild_id;

      // ✅ 삭제 대상이 그 길드의 멤버인지 확인: adminClient로 (RLS 우회)
      const { data: targetMem, error: memErr } = await adminClient
        .from("guild_members")
        .select("user_id, guild_id")
        .eq("guild_id", leaderGuildId)
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (memErr) {
        return new Response(JSON.stringify({ error: memErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!targetMem) {
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }

      allowed = true;
    }

    if (!allowed) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    // =========================
    // ✅ 서비스 롤로 삭제
    // =========================
    const { error: delErr } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (delErr) throw delErr;

    const { error: profErr } = await adminClient
      .from("profiles")
      .delete()
      .eq("user_id", targetUserId);
    if (profErr) throw profErr;

    const { error: gmErr } = await adminClient
      .from("guild_members")
      .delete()
      .eq("user_id", targetUserId);
    if (gmErr) throw gmErr;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
