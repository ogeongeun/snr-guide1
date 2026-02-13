// supabase/functions/admin-delete-user/index.ts
import { createClient } from "@supabase/supabase-js";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-client-platform, x-supabase-client-version",
};

Deno.serve(async (req: Request) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // POST만 허용
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Authorization 헤더 (소문자/대문자 모두 대응)
    const authHeader =
      req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("No auth header", {
        status: 401,
        headers: corsHeaders,
      });
    }

    // body
    const body = await req.json().catch(() => ({}));
    const targetUserId = body?.user_id;
    if (!targetUserId) {
      return new Response("user_id required", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ✅ 요청자 확인용: anon key + bearer token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader }, // "Bearer <access_token>"
        },
      }
    );

    const {
      data: { user: requester },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !requester) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    // (선택) 자기 자신 삭제 방지
    if (requester.id === targetUserId) {
      return new Response("Cannot delete yourself", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // =========================
    // ✅ service role client (RLS 우회) - 위로 올림!
    // =========================
    const serviceRole = Deno.env.get("SERVICE_ROLE_KEY")!;
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, serviceRole, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${serviceRole}` } },
    });

    // =========================
    // ✅ 권한 체크
    // 1) admins 테이블에 있으면 OK
    // 2) 아니면 "같은 길드의 leader"이면 OK (guild_members.role='leader' 기준)
    // =========================
    let allowed = false;

    // 1) 관리자 체크
    const { data: adminRow, error: adminErr } = await supabase
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

    if (adminRow) {
      allowed = true;
    }

    // 2) 관리자 아니면: guild_members에서 leader인지 확인
    let leaderGuildId: string | null = null;

    if (!allowed) {
      // 요청자가 leader로 등록된 길드 찾기 (본인 row라 RLS 통과)
      const { data: myLeaderRow, error: lgErr } = await supabase
        .from("guild_members")
        .select("guild_id, role")
        .eq("user_id", requester.id)
        .eq("role", "leader")
        .maybeSingle();

      if (lgErr) {
        return new Response(JSON.stringify({ error: lgErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!myLeaderRow?.guild_id) {
        return new Response("Forbidden", {
          status: 403,
          headers: corsHeaders,
        });
      }

      leaderGuildId = myLeaderRow.guild_id;

      // ✅ 삭제 대상이 그 길드의 멤버인지 확인
      // ⚠️ 여기만 adminClient로 바꿔서 RLS 우회!
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
        return new Response("Forbidden", {
          status: 403,
          headers: corsHeaders,
        });
      }

      allowed = true;
    }

    if (!allowed) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    // =========================
    // ✅ 서비스 롤로 삭제 (Auth 사용자 삭제 + 관련 row 정리)
    // =========================

    // ✅ Auth 유저 삭제
    const { error: delErr } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (delErr) throw delErr;

    // ✅ 프로필 삭제
    const { error: profErr } = await adminClient
      .from("profiles")
      .delete()
      .eq("user_id", targetUserId);
    if (profErr) throw profErr;

    // ✅ 길드 멤버십 정리
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
