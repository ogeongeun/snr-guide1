// src/pages/Home.jsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const Home = () => {
  const navigate = useNavigate();
  const [logoutLoading, setLogoutLoading] = useState(false);

  // ✅ 관리자 여부
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ 길드(길마/길드원)
  const [isGuildMaster, setIsGuildMaster] = useState(false); // 길드장(leader)
  const [isGuildMember, setIsGuildMember] = useState(false); // 길드원(멤버십)

  const [todayVisitors, setTodayVisitors] = useState(null);
  const [totalVisitors, setTotalVisitors] = useState(null);

  // ✅ 커뮤니티 최신글
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityItems, setCommunityItems] = useState([]);

  // ✅ 새글 표시
  const [hasNewCommunity, setHasNewCommunity] = useState(false);
  const [latestCommunityAt, setLatestCommunityAt] = useState(null);

  const markCommunitySeen = () => {
    if (latestCommunityAt) {
      localStorage.setItem("community_last_seen_at", latestCommunityAt);
    }
    setHasNewCommunity(false);
  };

  const handleLogout = async () => {
    if (logoutLoading) return;
    try {
      setLogoutLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert(`로그아웃 실패: ${error.message}`);
        return;
      }
      navigate("/login", { replace: true });
    } finally {
      setLogoutLoading(false);
    }
  };

  const features = [
    { title: "공성전", path: "/siege", description: "요일별 공성전 영웅, 스킬순서", emoji: "🏰" },
    { title: "길드전", path: "/guild-defense", description: "길드전 방어팀 공격팀 추천", emoji: "🛡️" },
    { title: "강림원정대", path: "/expedition", description: "보스별 공략 및 추천 영웅 세팅", emoji: "🔥" },
    { title: "총력전", path: "/grand-battle", description: "총력전 전용 팀 구성 및 공략 정보", emoji: "⚔️" },
    { title: "레이드", path: "/raid", description: "레이드 영웅장비 및 추천 스킬순서", emoji: "🐉" },
    { title: "장비 강화 가이드", path: "/enhance-guide", description: "무기/방어구 선택 후 강화 우선순위 안내", emoji: "⚙️" },
    { title: "장비 추천", path: "/equipment", description: "영웅들의 장비 추천", emoji: "🛠" },
    { title: "무한의 탑", path: "/infinity-tower", description: "층별 조건에 맞춘 공략 덱 정보", emoji: "🏯" },
    { title: "시련의 탑", path: "/trial-tower", description: "층별 조건에 맞춘 공략 덱 정보", emoji: "💀" },
    { title: "모험", path: "/adventure", description: "모험 콘텐츠용 클리어 덱", emoji: "🗺️" },
    { title: "장신구 세공법", path: "/accessory-custom", description: "무탑/결장/보스/쫄작용 추천 조합", emoji: "💍" },
    
    { title: "성장던전", path: "/essential-heroes", description: "요일별 성장던전 클리어덱", emoji: "⭐" },
    { title: "스킬 강화 순서", path: "/skill-order", description: "영웅별 스킬 강화 우선순위 추천", emoji: "💡" },
    { title: "쫄작 효율 비교", path: "/farming", description: "경험치/루비 손익 기준 효율 계산", emoji: "🔍" },
  ];

  // 방문자 카운트
  useEffect(() => {
    const run = async () => {
      const todayKey = new Date().toISOString().slice(0, 10);
      const storageKey = `visit_logged_${todayKey}`;
      try {
        if (!localStorage.getItem(storageKey)) {
          const { data } = await supabase.rpc("log_visit");
          const row = Array.isArray(data) ? data[0] : data;
          setTodayVisitors(Number(row?.today_count ?? 0));
          setTotalVisitors(Number(row?.total_count ?? 0));
          localStorage.setItem(storageKey, "1");
          return;
        }
        const { data: d1 } = await supabase.from("visit_daily").select("count").eq("day", todayKey).maybeSingle();
        const { data: d2 } = await supabase.from("visit_total").select("count").eq("id", 1).single();
        setTodayVisitors(Number(d1?.count ?? 0));
        setTotalVisitors(Number(d2?.count ?? 0));
      } catch {
        setTodayVisitors(0);
        setTotalVisitors(0);
      }
    };
    run();
  }, []);

  // 커뮤니티 미리보기
  useEffect(() => {
    const run = async () => {
      setCommunityLoading(true);
      try {
        const { data } = await supabase
          .from("community_posts")
          .select("id, title, category, pinned, created_at, hot_until")
          .order("pinned", { ascending: false })
          .order("hot_until", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(3);

        const rows = (data || []).map((p) => ({
          id: p.id,
          tag: p.pinned ? "공지" : "새",
          type: p.pinned ? "공지" : p.category || "자유",
          title: p.title || "(제목 없음)",
        }));
        setCommunityItems(rows);

        const latest = data?.[0]?.created_at ?? null;
        setLatestCommunityAt(latest);
        const lastSeen = localStorage.getItem("community_last_seen_at");
        setHasNewCommunity(!lastSeen || (latest && new Date(latest) > new Date(lastSeen)));
      } finally {
        setCommunityLoading(false);
      }
    };
    run();
  }, []);

  // 관리자 체크
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data?.user?.id;
      if (!uid) return setIsAdmin(false);
      const { data: adminRow } = await supabase.from("admins").select("user_id").eq("user_id", uid).maybeSingle();
      setIsAdmin(!!adminRow);
    };
    run();
  }, []);

  // ✅ 길드장/길드원 체크 (길드원도 "내 길드" 버튼 뜨게)
 // ✅ 길드장/길드원 체크 (길드원도 "내 길드" 버튼 뜨게)
useEffect(() => {
  const run = async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;

    // 🔽 여기 딱 추가
    const { data: s } = await supabase.auth.getSession();
    console.log("[session]", !!s?.session, s?.session?.user?.id);

    setIsGuildMaster(false);
    setIsGuildMember(false);

    if (!uid) return;

    // 1) 길드장인지
    try {
      const { data: rows } = await supabase
        .from("guilds")
        .select("id")
        .eq("leader_user_id", uid)
        .limit(1);

      setIsGuildMaster((rows?.length ?? 0) > 0);
    } catch {
      setIsGuildMaster(false);
    }

    // 2) 길드원인지
    try {
      const { data: mem, error } = await supabase
        .from("guild_members")
        .select("guild_id")
        .eq("user_id", uid)
        .limit(1);

      console.log("[guild_members]", mem, error);
      setIsGuildMember((mem?.length ?? 0) > 0);
    } catch (e) {
      console.log("[guild_members exception]", e);
      setIsGuildMember(false);
    }
  };
  run();
}, []);


  const showMyGuildButton = isGuildMaster || isGuildMember;
  const myGuildButtonText = isGuildMaster ? "길드관리" : "내 길드";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        {/* 헤더 */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            className="h-44 lg:h-56 w-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(168,85,247,0.22), rgba(251,191,36,0.20))",
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-[26px] lg:text-[38px] font-black tracking-tight text-slate-900">
              세븐나이츠 리버스 공략 도우미
            </h1>

            <p className="mt-2 rounded-full bg-white/85 px-3 py-1 text-[11px] lg:text-[13px] font-semibold text-rose-600 shadow-sm">
              본 콘텐츠는 천우회,백우회,매드데이,조림 길드 전용이며, 무단 사용 및 복제를 금합니다.
            </p>
            <p className="mt-2 text-xs lg:text-sm font-semibold text-slate-700/70 italic">made by 건근본</p>
          </div>
        </div>

        {/* 모바일 */}
        <div className="lg:hidden">
          <div className="mx-auto w-full max-w-[430px] relative pb-10">
            <div className="mt-4 flex justify-end gap-2 overflow-x-auto whitespace-nowrap">
              {isAdmin && (
                <Link to="/admin/users" className="shrink-0 rounded-xl px-3 py-2 text-sm font-extrabold bg-emerald-600 text-white">
                  로그인계정들
                </Link>
              )}

              {showMyGuildButton && (
                <Link to="/guild-manage" className="shrink-0 rounded-xl px-3 py-2 text-sm font-extrabold bg-amber-600 text-white">
                  {myGuildButtonText}
                </Link>
              )}

              <Link to="/me" className="shrink-0 rounded-xl px-3 py-2 text-sm font-extrabold bg-indigo-600 text-white">
                내 프로필
              </Link>

              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="shrink-0 rounded-xl px-3 py-2 text-sm font-extrabold bg-slate-900 text-white"
              >
                {logoutLoading ? "로그아웃중..." : "로그아웃"}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <StatCard icon="👀" label="오늘 방문자" value={todayVisitors === null ? "불러오는중..." : `${todayVisitors}명`} />
              <StatCard icon="📈" label="누적 방문자" value={totalVisitors === null ? "불러오는중..." : `${totalVisitors}명`} />
            </div>
{/* 📊 길드 공략 통계 */}
<Link
  to="/stats/guild-guides"
  className="mt-6 block rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-4 hover:bg-slate-50"
>
  <div className="flex items-center gap-3">
    <span className="text-2xl">📊</span>
    <div>
      <div className="text-[15px] font-black text-slate-900">길드별 공략 통계</div>
      <div className="text-[12px] font-semibold text-slate-600">
        길드 공략 추가 랭킹 확인
      </div>
    </div>
  </div>
</Link>

            {/* 커뮤니티 */}
            <div className="mt-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">📣</span>
                <span className="text-[16px] font-black text-slate-900">커뮤니티</span>
                <div className="flex-1 h-px bg-slate-200 ml-2" />
                {hasNewCommunity && (
                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[11px] font-black grid place-items-center">!</span>
                )}
              </div>

              <div className="mt-2 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {communityLoading ? (
                    <div className="px-4 py-6 text-sm font-semibold text-slate-600">불러오는중...</div>
                  ) : communityItems.length === 0 ? (
                    <div className="px-4 py-6 text-sm font-semibold text-slate-600">아직 게시글이 없습니다.</div>
                  ) : (
                    communityItems.map((item) => (
                      <Link
                        key={item.id}
                        to={`/community/post/${item.id}`}
                        onClick={markCommunitySeen}
                        className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
                      >
                        <span
                          className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-extrabold ${
                            item.tag === "공지" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {item.tag}
                        </span>
                        <span
                          className={`shrink-0 text-[12px] font-extrabold ${
                            item.type === "공지" ? "text-rose-600" : "text-slate-700"
                          }`}
                        >
                          [{item.type}]
                        </span>
                        <span className="text-[13px] font-semibold text-slate-800 line-clamp-1">{item.title}</span>
                      </Link>
                    ))
                  )}
                </div>
                <Link
                  to="/community"
                  onClick={markCommunitySeen}
                  className="block px-4 py-3 text-center text-[13px] font-extrabold text-indigo-600 bg-slate-50"
                >
                  [ 전체 커뮤니티 보기 → ]
                </Link>
              </div>
            </div>

            <div className="mt-7">
              <SectionTitle icon="🎮" title="콘텐츠 공략" />
              <div className="mt-3 grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <FeatureCard key={index} feature={feature} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PC */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 lg:mt-6">
          <div className="lg:col-span-4 space-y-4">
            {/* PC 버튼 영역: 로그인계정들만 위로 */}
            <div className="mt-4 space-y-2">
              {isAdmin && (
                <div className="flex justify-end">
                  <Link
                    to="/admin/users"
                    className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-extrabold bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    로그인계정들
                  </Link>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {showMyGuildButton && (
                  <Link
                    to="/guild-manage"
                    className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-extrabold bg-amber-600 text-white hover:bg-amber-500"
                  >
                    {myGuildButtonText}
                  </Link>
                )}

                <Link
                  to="/me"
                  className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-extrabold bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  내 프로필
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
                >
                  {logoutLoading ? "로그아웃중..." : "로그아웃"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon="👀" label="오늘 방문자" value={todayVisitors === null ? "불러오는중..." : `${todayVisitors}명`} />
              <StatCard icon="📈" label="누적 방문자" value={totalVisitors === null ? "불러오는중..." : `${totalVisitors}명`} />
            </div>
<Link
  to="/stats/guild-guides"
  className="block rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-4 hover:bg-slate-50"
>
  <div className="flex items-center gap-3">
    <span className="text-2xl">📊</span>
    <div>
      <div className="text-[15px] font-black text-slate-900">길드별 공략 통계</div>
      <div className="text-[12px] font-semibold text-slate-600">
        길드 공략 추가 랭킹 확인
      </div>
    </div>
  </div>
</Link>

            {/* 커뮤니티 */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
                <span className="text-lg">📣</span>
                <span className="text-[15px] font-black text-slate-900">커뮤니티</span>
                {hasNewCommunity && (
                  <span className="ml-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[11px] font-black grid place-items-center">!</span>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                {communityLoading ? (
                  <div className="px-4 py-6 text-sm font-semibold text-slate-600">불러오는중...</div>
                ) : communityItems.length === 0 ? (
                  <div className="px-4 py-6 text-sm font-semibold text-slate-600">아직 게시글이 없습니다.</div>
                ) : (
                  communityItems.map((item) => (
                    <Link
                      key={item.id}
                      to={`/community/post/${item.id}`}
                      onClick={markCommunitySeen}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
                    >
                      <span
                        className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-extrabold ${
                          item.tag === "공지" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {item.tag}
                      </span>
                      <span
                        className={`shrink-0 text-[12px] font-extrabold ${
                          item.type === "공지" ? "text-rose-600" : "text-slate-700"
                        }`}
                      >
                        [{item.type}]
                      </span>
                      <span className="text-[13px] font-semibold text-slate-800 line-clamp-1">{item.title}</span>
                    </Link>
                  ))
                )}
              </div>
              <Link
                to="/community"
                onClick={markCommunitySeen}
                className="block px-4 py-3 text-center text-[13px] font-extrabold text-indigo-600 bg-slate-50"
              >
                전체 커뮤니티 보기 →
              </Link>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🎮</span>
              <h2 className="text-[18px] font-black text-slate-900">콘텐츠 공략</h2>
              <div className="flex-1 h-px bg-slate-200 ml-2" />
              <div className="text-xs text-slate-400 font-semibold">sj</div>
            </div>

            <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
              {features.map((feature, index) => (
                <Link
                  key={index}
                  to={feature.path}
                  className="rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md p-5"
                >
                  <div className="text-4xl">{feature.emoji}</div>
                  <h3 className="mt-2 text-[16px] font-extrabold text-slate-900">{feature.title}</h3>
                  <p className="mt-1 text-[13px] font-semibold text-slate-600">{feature.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

function SectionTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{icon}</span>
      <span className="text-[16px] font-black text-slate-900">{title}</span>
      <div className="flex-1 h-px bg-slate-200 ml-2" />
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
      <div className="text-2xl">{icon}</div>
      <div className="leading-tight">
        <p className="text-[12px] text-slate-500 font-semibold">{label}</p>
        <p className="text-[18px] font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function FeatureCard({ feature }) {
  return (
    <Link to={feature.path} className="rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md p-4">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{feature.emoji}</div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold text-slate-900">{feature.title}</h2>
          <p className="mt-1 text-[12px] font-semibold text-slate-600 line-clamp-2">{feature.description}</p>
        </div>
      </div>
    </Link>
  );
}
