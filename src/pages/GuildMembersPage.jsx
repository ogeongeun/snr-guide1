// src/pages/GuildMembersPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const FN_URL =
  "https://kbgwomgulrsizkicmbro.supabase.co/functions/v1/admin-delete-user";


export default function GuildMembersPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [myRole, setMyRole] = useState(null);
  const [guild, setGuild] = useState(null);

  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState([]); // [{user_id, nickname, role, joined_at}]

  const [myUid, setMyUid] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const isLeader = myRole === "leader";

  const roleLabel = (role) => (role === "leader" ? "길드장" : "길드원");

  const badgeClass = (role) =>
    role === "leader"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-slate-50 text-slate-700 border border-slate-200";

  const reloadMembers = async () => {
    setMembersLoading(true);
    try {
      const { data: mRows, error: mErr } = await supabase.rpc(
        "get_my_guild_members"
      );
      if (mErr) throw mErr;
      setMembers(Array.isArray(mRows) ? mRows : []);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErrMsg("");

      try {
        const { data: userRes, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;

        const uid = userRes?.user?.id;
        if (!uid) {
          navigate("/login", { replace: true });
          return;
        }
        setMyUid(uid);

        // 내 멤버십
        const { data: memRows, error: memErr } = await supabase
          .from("guild_members")
          .select("guild_id, role, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1);

        if (memErr) throw memErr;

        const mem = (memRows ?? [])[0] ?? null;
        if (!mem?.guild_id) {
          setErrMsg("길드 소속 정보가 없습니다.");
          return;
        }
        setMyRole(mem.role ?? "member");

        // 길드 정보
        const { data: gRows, error: gErr } = await supabase
          .from("guilds")
          .select("id, name, leader_user_id")
          .eq("id", mem.guild_id)
          .limit(1);

        if (gErr) throw gErr;
        const g = (gRows ?? [])[0] ?? null;
        setGuild(g);

        await reloadMembers();
      } catch (e) {
        console.error("GuildMembersPage error:", e);
        setErrMsg(e?.message ? String(e.message) : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // =========================
  // ✅ 계정 삭제 (Edge Function)
  // =========================
 // =========================
// ✅ 계정 삭제 (Edge Function)
// =========================
const deleteAccount = async (targetUserId) => {
  if (!targetUserId) return;

  if (!isLeader) {
    alert("길드장만 가능합니다.");
    return;
  }

  if (myUid && targetUserId === myUid) {
    alert("본인 계정은 삭제할 수 없습니다.");
    return;
  }

  const ok = window.confirm(
    "정말 계정을 삭제할까요?\n\n- auth 사용자 삭제\n- profiles 삭제\n- guild_members 삭제\n\n(되돌릴 수 없음)"
  );
  if (!ok) return;

  try {
    setDeletingId(targetUserId);

    const { data: sess, error: sErr } = await supabase.auth.getSession();
    if (sErr) throw sErr;

    const token = sess?.session?.access_token;

    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login", { replace: true });
      return;
    }

    const res = await fetch(FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        // ✅ Vite/CRA 환경에 맞게 바꿔야 함 (아래 참고)
       apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,

      },
      body: JSON.stringify({ user_id: targetUserId }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      // ✅ 여기서 code/error/메시지를 알림창에 보여줌
      const code = json?.code;
      const errorMsg = json?.error;
      const message = json?.message;

      // 개발용으로 콘솔에도 남기기
      console.error("admin-delete-user failed:", {
        status: res.status,
        json,
      });

      if (code) {
        alert(`삭제 실패: ${code}${message ? `\n${message}` : ""}`);
      } else if (errorMsg) {
        alert(`삭제 실패: ${errorMsg}`);
      } else {
        alert(`삭제 실패 (HTTP ${res.status})`);
      }
      return;
    }

    // UI 반영
    setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
    alert("삭제 완료");
  } catch (e) {
    alert(e?.message || String(e));
  } finally {
    setDeletingId(null);
  }
};


  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="flex items-center gap-3">
          <h1 className="text-[20px] font-black text-slate-900">길드원 목록</h1>
          <div className="flex-1 h-px bg-slate-200 ml-2" />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          {loading ? (
            <div className="text-sm font-semibold text-slate-600">
              불러오는중...
            </div>
          ) : errMsg ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-[13px] font-extrabold text-rose-700">오류</div>
              <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">
                {errMsg}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-600">
                    길드명
                  </div>
                  <div className="mt-1 text-[18px] font-black text-slate-900">
                    {guild?.name || "(길드명 없음)"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-extrabold border ${badgeClass(
                      myRole
                    )}`}
                  >
                    {roleLabel(myRole)}
                  </div>

                  <button
                    onClick={reloadMembers}
                    className="rounded-xl px-3 py-2 text-xs font-black border border-slate-200 bg-white hover:bg-slate-50"
                    disabled={membersLoading}
                  >
                    새로고침
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="text-[14px] font-extrabold text-slate-900">
                    길드원
                  </div>
                  
                  <div className="text-[12px] font-bold text-slate-600">
                    {membersLoading ? "불러오는중..." : `${members.length}명`}
                  </div>
                </div>

                {membersLoading ? (
                  <div className="px-4 py-5 text-sm font-semibold text-slate-600">
                    불러오는중...
                  </div>
                ) : members.length === 0 ? (
                  <div className="px-4 py-5 text-sm font-semibold text-slate-600">
                    길드원이 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {members.map((m) => {
                      const isMe = myUid && m.user_id === myUid;
                      const busy = deletingId === m.user_id;

                      const disabled =
                        !isLeader || busy || isMe || m.role === "leader";

                      return (
                        <div
                          key={m.user_id}
                          className="px-4 py-3 flex items-center gap-3"
                        >
                          <span
                            className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-extrabold border ${badgeClass(
                              m.role
                            )}`}
                          >
                            {roleLabel(m.role)}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-extrabold text-slate-900 truncate">
                              {m.nickname || "(닉네임 없음)"}
                              {isMe && (
                                <span className="ml-2 rounded-lg bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-700">
                                  나
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-[11px] font-semibold text-slate-500">
                            {m.joined_at
                              ? new Date(m.joined_at).toLocaleDateString()
                              : ""}
                          </div>

                          {isLeader && (
                            <button
                              onClick={() => deleteAccount(m.user_id)}
                              disabled={disabled}
                              className={[
                                "ml-2 rounded-xl px-3 py-2 text-xs font-black border",
                                m.role === "leader"
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : isMe
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : busy
                                  ? "bg-red-100 text-red-400 border-red-200 cursor-wait"
                                  : "bg-red-600 text-white border-red-700 hover:bg-red-500",
                              ].join(" ")}
                              title={
                                m.role === "leader"
                                  ? "길드장은 삭제할 수 없습니다."
                                  : isMe
                                  ? "본인은 삭제할 수 없습니다."
                                  : "계정 삭제"
                              }
                            >
                              {busy ? "삭제중..." : "계정삭제"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
