// src/pages/GuildMembersPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function GuildMembersPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [myRole, setMyRole] = useState(null);
  const [guild, setGuild] = useState(null);

  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState([]); // [{user_id, nickname, role, joined_at}]

  const roleLabel = (role) => (role === "leader" ? "길드장" : "길드원");

  const badgeClass = (role) =>
    role === "leader"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-slate-50 text-slate-700 border border-slate-200";

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

        // 길드원 목록 (RPC)
        setMembersLoading(true);
        const { data: mRows, error: mErr } = await supabase.rpc(
          "get_my_guild_members"
        );
        if (mErr) throw mErr;
        setMembers(Array.isArray(mRows) ? mRows : []);
      } catch (e) {
        console.error("GuildMembersPage error:", e);
        setErrMsg(e?.message ? String(e.message) : "알 수 없는 오류");
      } finally {
        setMembersLoading(false);
        setLoading(false);
      }
    };

    run();
  }, [navigate]);

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

                <div
                  className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-extrabold border ${badgeClass(
                    myRole
                  )}`}
                >
                  {roleLabel(myRole)}
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
                    {members.map((m) => (
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
                          </div>
                        </div>

                        <div className="text-[11px] font-semibold text-slate-500">
                          {m.joined_at
                            ? new Date(m.joined_at).toLocaleDateString()
                            : ""}
                        </div>
                      </div>
                    ))}
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
