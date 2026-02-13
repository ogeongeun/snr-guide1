// supabase/functions/admin-delete-user/index.ts
import { createClient } from "@supabase/supabase-js";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-client-platform, x-supabase-client-version",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type DeleteUserRequestBody = {
  user_id?: string;
};

type CleanupResult =
  | { ok: true }
  | { ok: false; step: "profiles" | "guild_members"; error: string };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

    const authHeader =
      req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No auth header" }, 401);

    const body: DeleteUserRequestBody = await req.json().catch(() => ({}));
    const targetUserId = body.user_id;
    if (!targetUserId) return json({ error: "user_id required" }, 400);

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

    if (userErr || !requester) return json({ error: "Unauthorized" }, 401);
    if (requester.id === targetUserId)
      return json({ error: "Cannot delete yourself" }, 400);

    // service role client (RLS bypass)
    const serviceRole = Deno.env.get("SERVICE_ROLE_KEY")!;
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, serviceRole, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${serviceRole}` } },
    });

    // ✅ 권한 체크: admins는 adminClient로
    const { data: adminRow, error: adminErr } = await adminClient
      .from("admins")
      .select("user_id")
      .eq("user_id", requester.id)
      .maybeSingle();

    if (adminErr) return json({ error: adminErr.message }, 500);

    let allowed = !!adminRow;

    if (!allowed) {
      // leader 체크(본인 row만 읽음)
      const { data: myLeaderRow, error: lgErr } = await supabase
        .from("guild_members")
        .select("guild_id, role, created_at")
        .eq("user_id", requester.id)
        .eq("role", "leader")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lgErr) return json({ error: lgErr.message }, 500);
      if (!myLeaderRow?.guild_id) return json({ error: "Forbidden" }, 403);

      const leaderGuildId: string = myLeaderRow.guild_id;

      // target 멤버 확인은 adminClient로 (RLS 우회)
      const { data: targetMem, error: memErr } = await adminClient
        .from("guild_members")
        .select("user_id, guild_id")
        .eq("guild_id", leaderGuildId)
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (memErr) return json({ error: memErr.message }, 500);
      if (!targetMem) return json({ error: "Forbidden" }, 403);

      allowed = true;
    }

    if (!allowed) return json({ error: "Forbidden" }, 403);

    // =========================
    // ✅ 1) Auth에 유저가 존재하는지 먼저 확인
    // =========================
    let authExists = false;
    const { data: gotUser, error: getErr } = await adminClient.auth.admin.getUserById(
      targetUserId
    );
    if (!getErr && gotUser?.user?.id) authExists = true;

    // =========================
    // ✅ 2) 정리 작업: profiles / guild_members는 항상 시도
    // =========================
    const cleanup = async (): Promise<CleanupResult> => {
      const { error: profErr } = await adminClient
        .from("profiles")
        .delete()
        .eq("user_id", targetUserId);
      if (profErr) return { ok: false, step: "profiles", error: profErr.message };

      const { error: gmErr } = await adminClient
        .from("guild_members")
        .delete()
        .eq("user_id", targetUserId);
      if (gmErr) return { ok: false, step: "guild_members", error: gmErr.message };

      return { ok: true };
    };

    // =========================
    // ✅ 3) Auth 삭제
    // - auth가 없으면: cleanup만 하고 OK
    // - auth가 있는데 삭제 실패하면: 에러 상세 반환
    // =========================
    if (authExists) {
      const { error: delErr } = await adminClient.auth.admin.deleteUser(targetUserId);
      if (delErr) {
        return json(
          {
            error: delErr.message || "Database error deleting user",
            step: "auth.deleteUser",
            targetUserId,
          },
          500
        );
      }
    }

    const cleaned = await cleanup();
    if (!cleaned.ok) {
      return json(
        {
          error: cleaned.error,
          step: cleaned.step,
          targetUserId,
          authExists,
        },
        500
      );
    }

    return json({ ok: true, targetUserId, authExists });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});
