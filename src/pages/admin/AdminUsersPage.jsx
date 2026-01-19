import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../../components/PageShell";
import { supabase } from "../../lib/supabaseClient";

export default function AdminUsersPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (!uid) {
        navigate("/login", { replace: true });
        return;
      }

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

  /** 닉네임별 카운트 */
  const nicknameCounts = useMemo(() => {
    const map = {};
    for (const u of users) {
      const nick = u.nickname?.trim();
      if (!nick) continue;
      map[nick] = (map[nick] || 0) + 1;
    }
    return map;
  }, [users]);

  /** ✅ 중복 닉네임 유저만 */
  const duplicateUsers = useMemo(() => {
    return users.filter((u) => {
      const nick = u.nickname?.trim();
      return nick && nicknameCounts[nick] > 1;
    });
  }, [users, nicknameCounts]);

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
          {/* 🔴 중복 닉네임 섹션 */}
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
                {filtered.map((u) => (
                  <div key={u.user_id} className="px-4 py-3">
                    <div className="text-sm font-extrabold text-slate-900">
                      {formatDisplayName(u)}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {u.user_id}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      가입: {formatTime(u.created_at)}
                    </div>
                  </div>
                ))}
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
