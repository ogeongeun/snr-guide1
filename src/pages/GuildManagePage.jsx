// src/pages/GuildManagePage.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import DefenseSubmitPage from "./DefenseSubmitPage";
import DefenseKingPage from "./DefenseKingPage";

export default function GuildManagePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [guildLoading, setGuildLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const [guild, setGuild] = useState(null);
  const [myRole, setMyRole] = useState(null); // "leader" | "member" | null
  const [members, setMembers] = useState([]); // [{user_id, nickname, role, joined_at}]
  const [errMsg, setErrMsg] = useState("");

  // ✅ PC에서만 쓰는 선택 상태(PC는 우측 패널 전환)
  const [active, setActive] = useState("members"); // "members" | "defense"

  const pageTitle = useMemo(
    () => (myRole === "leader" ? "길드관리" : "내 길드"),
    [myRole]
  );

  const roleLabel = (role) => (role === "leader" ? "길드장" : "길드원");
  const badgeClass = (role) =>
    role === "leader"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-slate-50 text-slate-700 border border-slate-200";

  const menu = useMemo(
    () => [
      {
        key: "members",
        label: "길드원",
        desc: "닉네임/역할",
        emoji: "👥",
        to: "/guild-manage/members",
      },
      {
  key: "defense_king",
  label: "방어왕",
  desc: "랭킹/세팅",
  emoji: "👑",
  to: "/guild-manage/defense-king", // ✅ 모바일 전용 페이지
},
      {
        key: "defense",
        label: "방어팀 제출",
        desc: "세팅 등록",
        emoji: "🛡️",
        to: "/guild-manage/defense", // ✅ 모바일 전용 페이지
      },
    ],
    []
  );

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

        // 1) 내 멤버십 1개
        const { data: memRows, error: memErr } = await supabase
          .from("guild_members")
          .select("guild_id, role, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1);

        if (memErr) throw memErr;

        const mem = (memRows ?? [])[0] ?? null;
        if (!mem?.guild_id) {
          setErrMsg("길드 소속 정보가 없습니다. (guild_members에 내 계정이 없음)");
          return;
        }

        setMyRole(mem.role ?? "member");

        // 2) 길드 정보
        setGuildLoading(true);
        const { data: gRows, error: gErr } = await supabase
          .from("guilds")
          .select("id, name, leader_user_id")
          .eq("id", mem.guild_id)
          .limit(1);

        if (gErr) throw gErr;

        const g = (gRows ?? [])[0] ?? null;
        if (!g) {
          setErrMsg("길드 정보를 찾을 수 없습니다. (guilds RLS / 데이터 확인)");
          return;
        }
        setGuild(g);

        // 3) 길드원 로드
        setMembersLoading(true);
        const { data: mRows, error: mErr } = await supabase.rpc(
          "get_my_guild_members"
        );
        if (mErr) throw mErr;
        setMembers(Array.isArray(mRows) ? mRows : []);
      } catch (e) {
        console.error("GuildManagePage error:", e);
        setErrMsg(e?.message ? String(e.message) : "알 수 없는 오류");
      } finally {
        setGuildLoading(false);
        setMembersLoading(false);
        setLoading(false);
      }
    };

    run();
  }, [navigate]);

  // ✅ PC: 우측 패널 전환 유지 (defense도 navigate 금지)
  const handleSelectPc = async (key) => {
    setActive(key);

    // members 탭을 눌렀는데 아직 멤버가 없고 로딩도 아니라면 로드
    if (key === "members" && members.length === 0 && !membersLoading && !loading) {
      try {
        setMembersLoading(true);
        const { data: mRows, error: mErr } = await supabase.rpc(
          "get_my_guild_members"
        );
        if (mErr) throw mErr;
        setMembers(Array.isArray(mRows) ? mRows : []);
      } catch (e) {
        setErrMsg(e?.message ? String(e.message) : "알 수 없는 오류");
      } finally {
        setMembersLoading(false);
      }
    }
  };

  const activeMeta = menu.find((m) => m.key === active);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        {/* 상단 바 */}
        <div className="flex items-center gap-3">
          {/* ✅ PC: 홈 */}
          <Link
            to="/"
            className="hidden lg:inline-flex rounded-xl px-3 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
          >
            ← 홈
          </Link>

          <div className="min-w-0">
            <div className="text-[12px] font-extrabold text-slate-500">
              {pageTitle}
            </div>
            <div className="text-[18px] lg:text-[20px] font-black text-slate-900 truncate">
              {loading ? "불러오는중..." : guild?.name || "(길드명 없음)"}
            </div>
          </div>

          <div className="flex-1 h-px bg-slate-200 ml-2" />

          {!loading && !errMsg && (
            <div
              className={`hidden lg:inline-flex shrink-0 rounded-full px-3 py-1 text-[12px] font-extrabold border ${badgeClass(
                myRole
              )}`}
            >
              {roleLabel(myRole)}
            </div>
          )}
        </div>

        {/* 에러/로딩 */}
        {loading ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-5 text-sm font-semibold text-slate-600">
            불러오는중...
          </div>
        ) : errMsg ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <div className="text-[13px] font-extrabold text-rose-700">오류</div>
            <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">
              {errMsg}
            </div>
          </div>
        ) : (
          <>
            {/* ✅ 모바일: 메뉴 리스트만 + 클릭하면 페이지 이동 */}
            <div className="lg:hidden mt-4 space-y-3">
              {/* 요약 */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-[12px] font-extrabold text-slate-500">
                    길드
                  </div>
                  <div className="mt-1 text-[16px] font-black text-slate-900 truncate">
                    {guild?.name || "(길드명 없음)"}
                  </div>
                </div>

                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-slate-700">
                    내 역할
                  </div>
                  <div
                    className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold border ${badgeClass(
                      myRole
                    )}`}
                  >
                    {roleLabel(myRole)}
                  </div>
                </div>
              </div>

              <MobileSettingsSection
                title="메뉴"
                items={menu}
                rightHint={
                  membersLoading ? "불러오는중..." : `길드원 ${members.length}명`
                }
                onNavigate={(to) => navigate(to)}
              />
            </div>

            {/* ✅ PC: 좌측 메뉴 + 우측 패널 */}
            <div className="hidden lg:grid mt-6 lg:grid-cols-12 lg:gap-6">
              {/* Left sidebar */}
              <aside className="lg:col-span-3">
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-[12px] font-extrabold text-slate-500">
                      메뉴
                    </div>
                    <div className="mt-1 text-[15px] font-black text-slate-900">
                      길드 기능
                    </div>
                  </div>

                  <div className="p-2">
                    {menu.map((m) => {
                      const on = active === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => handleSelectPc(m.key)}
                          className={`w-full text-left rounded-2xl px-3 py-3 border transition flex items-center gap-3 ${
                            on
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-900 border-transparent hover:bg-slate-50"
                          }`}
                        >
                          <div className="text-2xl">{m.emoji}</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-extrabold truncate">
                              {m.label}
                            </div>
                            <div
                              className={`mt-0.5 text-[12px] font-semibold truncate ${
                                on ? "text-white/75" : "text-slate-500"
                              }`}
                            >
                              {m.desc}
                            </div>
                          </div>
                          <div
                            className={`${
                              on ? "text-white/70" : "text-slate-300"
                            } font-black`}
                          >
                            →
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 상태 카드 */}
                <div className="mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
                  <div className="text-[12px] font-extrabold text-slate-500">
                    상태
                  </div>
                  <div className="mt-1 text-[14px] font-black text-slate-900">
                    {guildLoading ? "길드 확인중..." : guild?.name || "-"}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold border ${badgeClass(
                        myRole
                      )}`}
                    >
                      {roleLabel(myRole)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {membersLoading
                        ? "길드원 불러오는중..."
                        : `길드원 ${members.length}명`}
                    </span>
                  </div>
                </div>
              </aside>

              {/* Right content */}
              <main className="lg:col-span-9">
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-extrabold text-slate-500">
  {active === "members"
    ? "Members"
    : active === "defense_king"
    ? "Defense King"
    : "Defense Submit"}
</div>

                      <div className="mt-1 text-[18px] font-black text-slate-900">
                        {activeMeta?.label}
                      </div>
                    </div>

                    <div className="text-[12px] font-semibold text-slate-500">
                      {active === "members"
                        ? membersLoading
                          ? "불러오는중..."
                          : `${members.length}명`
                        : ""}
                    </div>
                  </div>

                 <div className="p-5">
  {active === "members" ? (
    <MembersPanel members={members} loading={membersLoading} />
  ) : active === "defense_king" ? (
    <DefenseKingPage embedded />
  ) : (
    <DefenseSubmitPage embedded />
  )}
</div>

                </div>
              </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** ✅ 모바일: iOS 설정 리스트(클릭하면 페이지 이동) */
function MobileSettingsSection({ title, items, rightHint, onNavigate }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="text-[12px] font-extrabold text-slate-500">{title}</div>
        {rightHint ? (
          <div className="text-[12px] font-semibold text-slate-500">
            {rightHint}
          </div>
        ) : null}
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((m) => (
          <button
            key={m.key}
            onClick={() => onNavigate(m.to)}
            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
          >
            <div className="shrink-0 text-[20px] leading-none">{m.emoji}</div>

            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-extrabold text-slate-900 truncate">
                {m.label}
              </div>
              <div className="mt-0.5 text-[12px] font-semibold text-slate-500 truncate">
                {m.desc}
              </div>
            </div>

            <div className="shrink-0 text-slate-300 text-[18px] font-black">
              ›
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MembersPanel({ members, loading }) {
  const roleLabel = (role) => (role === "leader" ? "길드장" : "길드원");
  const badgeClass = (role) =>
    role === "leader"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-slate-50 text-slate-700 border border-slate-200";

  if (loading) {
    return (
      <div className="text-sm font-semibold text-slate-600">불러오는중...</div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-sm font-semibold text-slate-600">
        길드원이 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {members.map((m) => (
          <div
            key={m.user_id}
            className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
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
              {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
