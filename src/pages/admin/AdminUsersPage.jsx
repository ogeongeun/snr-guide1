// src/pages/admin/AdminUsersPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../../components/PageShell";
import { supabase } from "../../lib/supabaseClient";

// ✅ fetch URL은 안 써도 됨 (invoke로 호출)
export default function AdminUsersPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");

  // ✅ 내 UID (본인 삭제 방지/표시용)
  const [myUid, setMyUid] = useState(null);

  // ✅ 삭제 중 상태
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (!uid) {
        navigate("/login", { replace: true });
        return;
      }
      setMyUid(uid);

      const { data: adminRow } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", uid)
        .maybeSingle();

      const ok = !!adminRow;
      setIsAdmin(ok);

      if (!ok) {
        alert("관리자만 접근 가능합니다.");
        navigate("/", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nickname, guild, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        alert(error.message);
        setUsers([]);
      } else {
        setUsers(data || []);
      }

      setLoading(false);
    };

    run();
  }, [navigate]);

  /** 닉네임별 카운트 (완전 동일 중복용) */
  const nicknameCounts = useMemo(() => {
    const map = {};
    for (const u of users) {
      const nick = u.nickname?.trim();
      if (!nick) continue;
      map[nick] = (map[nick] || 0) + 1;
    }
    return map;
  }, [users]);

  /** ✅ 완전 동일 중복 닉네임 유저만 */
  const duplicateUsers = useMemo(() => {
    return users.filter((u) => {
      const nick = u.nickname?.trim();
      return nick && nicknameCounts[nick] > 1;
    });
  }, [users, nicknameCounts]);

  /** ✅ 포함 닉네임 그룹 (예: '천우회'가 '천우회1'에 포함) */
  const includeNickGroups = useMemo(() => {
    const nicks = Array.from(
      new Set(users.map((u) => (u.nickname || "").trim()).filter(Boolean))
    ).sort((a, b) => a.length - b.length || a.localeCompare(b, "ko"));

    const byNick = new Map();
    users.forEach((u) => {
      const nick = (u.nickname || "").trim();
      if (!nick) return;
      if (!byNick.has(nick)) byNick.set(nick, []);
      byNick.get(nick).push(u);
    });

    const groups = [];

    for (let i = 0; i < nicks.length; i++) {
      const base = nicks[i];
      const matches = [];

      for (let j = 0; j < nicks.length; j++) {
        if (i === j) continue;
        const other = nicks[j];
        if (other.includes(base)) matches.push(other);
      }

      if (matches.length > 0) {
        groups.push({
          base,
          matches: matches.sort(
            (a, b) => a.length - b.length || a.localeCompare(b, "ko")
          ),
          usersBase: byNick.get(base) || [],
          usersMatches: matches.flatMap((m) => byNick.get(m) || []),
        });
      }
    }

    groups.sort(
      (a, b) =>
        b.matches.length - a.matches.length ||
        a.base.localeCompare(b.base, "ko")
    );

    return groups;
  }, [users]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;

    return users.filter((u) => {
      const nick = (u.nickname || "").toLowerCase();
      const guild = (u.guild || "").toLowerCase();
      const id = (u.user_id || "").toLowerCase();
      return nick.includes(s) || guild.includes(s) || id.includes(s);
    });
  }, [users, q]);

  // =========================
  // ✅ 삭제 함수 (Edge Function 호출) - supabase.functions.invoke 사용
  // =========================
  const deleteUser = async (targetUserId) => {
    if (!targetUserId) return;

    // 본인 삭제 방지
    if (myUid && targetUserId === myUid) {
      alert("본인 계정은 삭제할 수 없습니다.");
      return;
    }

    const ok = window.confirm(
      `정말 삭제할까요?\n\n- auth 사용자 삭제\n- profiles 행 삭제\n\n(되돌릴 수 없음)`
    );
    if (!ok) return;

    try {
      setDeletingId(targetUserId);

      // ✅ 토큰/만료 확인 로그
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;

      console.log("DELETE USER DEBUG");
      console.log("token exists =", !!token);
      console.log("token preview =", token?.slice(0, 20));
      console.log(
        "apikey preview =",
        process.env.REACT_APP_SUPABASE_ANON_KEY?.slice(0, 20)
      );

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          console.log("JWT iss =", payload.iss);
          console.log("JWT aud =", payload.aud);
          console.log("JWT sub =", payload.sub);
          console.log("JWT role =", payload.role);
          console.log("JWT exp =", payload.exp, "now =", Math.floor(Date.now() / 1000));
        } catch (e) {
          console.log("JWT decode failed", e);
        }
      }

      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login", { replace: true });
        return;
      }

      // ✅ 가장 안전한 방식: invoke (apikey/Authorization 자동 구성)
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: targetUserId },
      });

      if (error) {
        throw new Error(error.message || "삭제 실패");
      }

      // (선택) 함수가 반환한 값 찍기
      console.log("delete result =", data);

      // UI 반영: 목록에서 제거
      setUsers((prev) => prev.filter((u) => u.user_id !== targetUserId));
      alert("삭제 완료");
    } catch (e) {
      alert(e?.message || String(e));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageShell
      title="로그인 계정들(관리자)"
      right={
        <Link
          to="/"
          className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
        >
          홈
        </Link>
      }
    >
      {loading ? (
        <Card>불러오는중...</Card>
      ) : !isAdmin ? (
        <Card>관리자만 접근 가능합니다.</Card>
      ) : (
        <div className="grid gap-4">
          {/* 🟠 포함 닉네임 섹션 */}
          {includeNickGroups.length > 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-200 text-sm font-black text-amber-800">
                포함 닉네임 ({includeNickGroups.length})
              </div>

              <div className="divide-y divide-amber-100">
                {includeNickGroups.map((g) => (
                  <div key={g.base} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-extrabold text-slate-900">
                        기준: {g.base}
                      </div>
                      <span className="rounded-lg bg-amber-200 px-2 py-0.5 text-[11px] font-black text-amber-800">
                        포함
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        ({g.matches.length}개)
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {g.matches.map((m) => (
                        <span
                          key={m}
                          className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[12px] font-extrabold text-slate-800"
                        >
                          {m}
                        </span>
                      ))}
                    </div>

                    <div className="mt-2 text-xs font-semibold text-slate-600">
                      기준 계정: {g.usersBase.length} / 포함 계정: {g.usersMatches.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🔴 완전 중복 닉네임 섹션 */}
          {duplicateUsers.length > 0 && (
            <div className="rounded-2xl bg-red-50 border border-red-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-red-200 text-sm font-black text-red-700">
                중복 닉네임 계정 ({duplicateUsers.length})
              </div>

              <div className="divide-y divide-red-100">
                {duplicateUsers.map((u) => (
                  <div key={u.user_id} className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-extrabold text-slate-900">
                        {formatDisplayName(u)}
                      </div>
                      <span className="rounded-lg bg-red-200 px-2 py-0.5 text-[11px] font-black text-red-700">
                        중복
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-600">
                      {u.user_id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 검색 */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="text-sm font-black text-slate-900">검색</div>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="닉네임 / 길드 / UUID"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200"
              />
              <span className="shrink-0 text-xs font-extrabold text-slate-600">
                {filtered.length}명
              </span>
            </div>
          </div>

          {/* 전체 목록 */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-sm font-black text-slate-900">
              전체 목록
            </div>

            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-sm font-semibold text-slate-600">
                결과 없음
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map((u) => {
                  const isMe = myUid && u.user_id === myUid;
                  const busy = deletingId === u.user_id;

                  return (
                    <div
                      key={u.user_id}
                      className="px-4 py-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-slate-900">
                          {formatDisplayName(u)}
                          {isMe && (
                            <span className="ml-2 rounded-lg bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-700">
                              나
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-500 break-all">
                          {u.user_id}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-slate-500">
                          가입: {formatTime(u.created_at)}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => deleteUser(u.user_id)}
                          disabled={busy || isMe}
                          className={[
                            "rounded-xl px-3 py-2 text-xs font-black border",
                            isMe
                              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                              : busy
                              ? "bg-red-100 text-red-400 border-red-200 cursor-wait"
                              : "bg-red-600 text-white border-red-700 hover:bg-red-500",
                          ].join(" ")}
                        >
                          {busy ? "삭제중..." : "삭제"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 text-sm font-semibold text-slate-600">
      {children}
    </div>
  );
}

function formatDisplayName(profile) {
  const nick = profile?.nickname?.trim();
  const guild = profile?.guild?.trim();
  if (nick && guild) return `${nick}(${guild})`;
  if (nick) return nick;
  return "익명";
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return "";
  }
}
