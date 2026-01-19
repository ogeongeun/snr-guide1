// src/pages/SiegeDayPage.jsx
import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";

import siegeTeamsData from "../data/siege-teams.json";
import equipmentData from "../data/equipmentRecommend.json";
import EquipmentModal from "../components/EquipmentModal";

import { supabase } from "../lib/supabaseClient";

const dayOrder = [
  "수호자의 성 (월요일)",
  "포디나의 성 (화요일)",
  "불멸의 성 (수요일)",
  "죽음의 성 (목요일)",
  "고대용의 성 (금요일)",
  "흑한의 성 (토요일)",
  "지옥의 성 (일요일)",
];

// ✅ 모바일 상세 페이지: /siege/:day
export default function SiegeDayPage() {
  const navigate = useNavigate();
  const { day } = useParams();

  const selectedDay = useMemo(() => {
    if (!day) return "";
    try {
      return decodeURIComponent(day);
    } catch {
      return "";
    }
  }, [day]);

  const isValid = selectedDay && dayOrder.includes(selectedDay);

  return (
    <PageShell
      title="공성전"
      right={
        <button
          onClick={() => navigate("/siege")}
          className="rounded-xl px-3 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
        >
          ← 요일 목록
        </button>
      }
    >
      {isValid ? (
        <SiegeDayPanel selectedDay={selectedDay} />
      ) : (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div className="text-[13px] font-extrabold text-rose-700">
            요일 정보를 찾을 수 없음
          </div>
          <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">
            현재 경로: /siege/{day || "(empty)"}
          </div>
          <button
            onClick={() => navigate("/siege")}
            className="mt-3 rounded-xl px-3 py-2 text-sm font-extrabold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            요일 목록으로
          </button>
        </div>
      )}
    </PageShell>
  );
}

// ✅ PC 우측 패널에서 재사용할 컴포넌트 (named export)
export function SiegeDayPanel({ selectedDay }) {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);

  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);

  // ✅ DB build 모달
  const [openDbBuild, setOpenDbBuild] = useState(null);
  // { heroName, heroKey, build }

  // ✅ 기존 JSON 팀은 그대로
  const jsonTeams = useMemo(
    () => siegeTeamsData?.siegeTeams?.[selectedDay] ?? [],
    [selectedDay]
  );

  // ✅ DB팀(유저 추가 팀)
  const [dbLoading, setDbLoading] = useState(true);
  const [dbTeams, setDbTeams] = useState([]);
  const [dbError, setDbError] = useState("");

  const [openTextBuild, setOpenTextBuild] = useState(null);
  const [openSkillKey, setOpenSkillKey] = useState(null); // 어떤 팀의 스킬 순서를 펼쳤는지
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      setMe(data?.user ?? null);
    };
    run();
  }, []);

  const openCreatePage = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/siege/new?day=${encodeURIComponent(selectedDay)}`);
  };

  const openEditPage = async (postId) => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/siege/edit/${postId}`);
  };

  const deletePost = async (postId) => {
    if (!me?.id) {
      navigate("/login");
      return;
    }

    const ok = window.confirm("이 팀을 삭제할까요? (되돌릴 수 없음)");
    if (!ok) return;

    setDeletingId(postId);
    try {
      // ✅ members 먼저 삭제
      const { error: memDelErr } = await supabase
        .from("siege_team_members")
        .delete()
        .eq("post_id", postId);
      if (memDelErr) throw memDelErr;

      // ✅ ratings 테이블이 존재한다면 같이 삭제 (없으면 에러날 수 있어서 try/catch)
      try {
        await supabase.from("siege_team_ratings").delete().eq("post_id", postId);
      } catch {
        // ignore
      }

      // ✅ posts 삭제
      const { error: postDelErr } = await supabase
        .from("siege_team_posts")
        .delete()
        .eq("id", postId);
      if (postDelErr) throw postDelErr;

      await refreshDbTeams();
    } catch (e) {
      alert(e?.message || "삭제 실패");
    } finally {
      setDeletingId(null);
    }
  };

  const findHeroKeyByName = (name) => {
    const key = Object.keys(equipmentData).find(
      (k) => equipmentData[k]?.name === name
    );
    return key || null;
  };

  const openEquipmentByHero = (hero) => {
    if (!hero) return;

    // DB팀은 hero_key가 있으니 우선 사용
    if (hero.hero_key && equipmentData?.[hero.hero_key]) {
      setSelectedHeroKey(hero.hero_key);
      setPresetTag(null);
      return;
    }

    // JSON팀은 이름으로 매칭
    const hk = findHeroKeyByName(hero.name);
    if (hk) {
      setSelectedHeroKey(hk);
      setPresetTag(hero.preset || null);
    }
  };

  const refreshDbTeams = async () => {
    setDbLoading(true);
    setDbError("");

    try {
      // ✅ posts: profiles 조인 제거(스키마 캐시 관계 이슈 회피) + anonymous 포함
      const { data: posts, error: postErr } = await supabase
        .from("siege_team_posts")
        .select("id, day, tags, note, skill_orders, created_by, created_at, anonymous")
        .eq("day", selectedDay);

      if (postErr) throw postErr;

      // ✅ 작성자 profiles를 별도 로드해서 created_by로 매핑
      const userIds = Array.from(
        new Set((posts || []).map((p) => p.created_by).filter(Boolean))
      );

      let profileMap = new Map(); // user_id -> {user_id,nickname,guild}
      if (userIds.length) {
        const { data: profs, error: profErr } = await supabase
          .from("profiles")
          .select("user_id, nickname, guild")
          .in("user_id", userIds);

        if (profErr) throw profErr;

        profileMap = new Map((profs || []).map((x) => [x.user_id, x]));
      }

      const postIds = (posts || []).map((p) => p.id);

      if (!postIds.length) {
        setDbTeams([]);
        setDbLoading(false);
        return;
      }

      const { data: members, error: memErr } = await supabase
        .from("siege_team_members")
        .select("post_id, slot, hero_key, hero_name, hero_image, build")
        .in("post_id", postIds)
        .order("slot", { ascending: true });

      if (memErr) throw memErr;

      // ✅ 별점 로드 (테이블 없으면 스킵)
      let ratings = [];
      try {
        const { data: r, error: ratErr } = await supabase
          .from("siege_team_ratings")
          .select("post_id, user_id, rating")
          .in("post_id", postIds);
        if (ratErr) throw ratErr;
        ratings = r || [];
      } catch {
        ratings = [];
      }

      const statMap = new Map(); // post_id -> {sum, count}
      const myMap = new Map(); // post_id -> myRating

      for (const r of ratings || []) {
        const cur = statMap.get(r.post_id) || { sum: 0, count: 0 };
        cur.sum += Number(r.rating || 0);
        cur.count += 1;
        statMap.set(r.post_id, cur);

        if (me?.id && r.user_id === me.id) {
          myMap.set(r.post_id, Number(r.rating || 0));
        }
      }

      const byPost = new Map();
      for (const m of members || []) {
        if (!byPost.has(m.post_id)) byPost.set(m.post_id, []);
        byPost.get(m.post_id).push(m);
      }

      const mapped = (posts || []).map((p) => {
        const ms = (byPost.get(p.id) || []).sort(
          (a, b) => (a.slot ?? 0) - (b.slot ?? 0)
        );

        const team = ms.map((m) => ({
          name: m.hero_name,
          image: m.hero_image,
          hero_key: m.hero_key,
          build: m.build || null,
        }));

        const textBuild =
          p.note && p.note.trim().length
            ? { title: "팀 메모", content: p.note.split("\n") }
            : null;

        const stat = statMap.get(p.id) || { sum: 0, count: 0 };
        const ratingAvg = stat.count ? stat.sum / stat.count : 0;
        const ratingCount = stat.count;
        const myRating = myMap.get(p.id) || 0;

        return {
          source: "db",
          id: p.id,
          created_at: p.created_at,
          created_by: p.created_by,

          // ✅ 익명/작성자 프로필
          anonymous: !!p.anonymous,
          profiles: profileMap.get(p.created_by) || null,

          tags: p.tags || [],
          team,
          textBuild,
          skillOrders: Array.isArray(p.skill_orders) ? p.skill_orders : [],
          ratingAvg,
          ratingCount,
          myRating,
        };
      });

      setDbTeams(mapped);
    } catch (e) {
      setDbError(e?.message || "DB 로드 실패");
      setDbTeams([]);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    refreshDbTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, me?.id]);

  // ✅ 5점제 + 내 투표 저장(업서트)
  const ratePost = async (postId, rating) => {
    if (!me?.id) {
      navigate("/login");
      return;
    }

    const v = Number(rating);
    if (![1, 2, 3, 4, 5].includes(v)) return;

    const { error } = await supabase
      .from("siege_team_ratings")
      .upsert(
        {
          post_id: postId,
          user_id: me.id,
          rating: v,
        },
        { onConflict: "post_id,user_id" }
      );

    if (error) {
      alert(error.message);
      return;
    }

    refreshDbTeams();
  };

  // ✅ 표 수 보정 점수(베이지안 평균)로 정렬
  const bayesScore = (avg, count) => {
    const C = 3.0;
    const m = 5;
    const v = Number(count || 0);
    const R = Number(avg || 0);
    return (v / (v + m)) * R + (m / (v + m)) * C;
  };

  // ✅ DB 먼저 + (보정점수) 높은순 + 참여자수 + 최신순, JSON은 항상 아래
  const mergedTeams = useMemo(() => {
    const json = (jsonTeams || []).map((t, idx) => ({
      source: "json",
      idx,
      ...t,
    }));

    const dbSorted = [...(dbTeams || [])].sort((a, b) => {
      const as = bayesScore(a.ratingAvg, a.ratingCount);
      const bs = bayesScore(b.ratingAvg, b.ratingCount);
      if (bs !== as) return bs - as;

      const ac = Number(a.ratingCount || 0);
      const bc = Number(b.ratingCount || 0);
      if (bc !== ac) return bc - ac;

      const at = new Date(a.created_at || 0).getTime();
      const bt = new Date(b.created_at || 0).getTime();
      return bt - at;
    });

    return [...dbSorted, ...json];
  }, [jsonTeams, dbTeams]);

  const renderSkillOrdersInline = (skillOrders) => {
    const list = Array.isArray(skillOrders) ? skillOrders : [];
    if (!list.length) {
      return (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-[12px] font-extrabold text-slate-600">
            스킬 순서
          </div>
          <div className="mt-1 text-[12px] font-semibold text-slate-500">
            (등록된 스킬 순서가 없습니다)
          </div>
        </div>
      );
    }

    return (
      <div className="mt-3 space-y-3">
        {list.map((order, oi) => (
          <div
            key={oi}
            className="rounded-2xl border border-slate-200 bg-white p-3"
          >
            <div className="text-[13px] font-black text-slate-900">
              {order?.orderTitle || `스킬 순서 ${oi + 1}`}
            </div>

            <div className="mt-2 space-y-3">
              {(order?.skills || []).map((st, si) => (
                <div
                  key={si}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="text-[12px] font-extrabold text-slate-700">
                    {st?.stageTitle || `스테이지 ${si + 1}`}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {(st?.images || []).map((img, idx) => (
                      <div
                        key={`${img}-${idx}`}
                        className="relative w-10 h-10 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center"
                        title={`${idx + 1}번 · ${img}`}
                      >
                        <img
                          src={`/images/skills/${img}`}
                          alt={img}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                        <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold flex items-center justify-center">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                    {!((st?.images || []).length) ? (
                      <div className="text-[12px] font-semibold text-slate-400">
                        (비어있음)
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ✅ JSON 팀 렌더
  const renderHeroesJson = (heroes = []) => (
    <div className="mt-3 flex gap-1.5 flex-nowrap overflow-x-auto">
      {heroes.map((hero, idx) => (
        <button
          key={`${hero.name}-${idx}`}
          onClick={() => openEquipmentByHero(hero)}
          className="flex flex-col items-center bg-white border border-slate-200 rounded-xl px-1.5 py-2 shadow-sm hover:bg-slate-50 hover:shadow transition w-[56px] shrink-0"
        >
          <img
            src={
              hero.image?.startsWith("/images/")
                ? hero.image
                : `/images/heroes/${hero.image}`
            }
            alt={hero.name}
            className="w-12 h-12 object-contain"
            loading="lazy"
          />
          <div className="h-[6px]" />
          <p className="text-[10px] mt-1 text-center text-slate-900 truncate w-full">
            {hero.name}
          </p>
          {hero.preset ? (
            <span className="mt-1 w-2 h-2 rounded-full bg-indigo-500" />
          ) : (
            <div className="h-2" />
          )}
        </button>
      ))}
    </div>
  );

  // ✅ DB 팀 렌더 (build 있으면 DB 모달 우선)
  const renderHeroesDb = (heroes = [], teamRow = null) => (
    <div className="mt-3 flex gap-1.5 flex-nowrap overflow-x-auto">
      {heroes.map((hero, idx) => {
        const b = hero.build || {};
        const hasBuild =
          b.set ||
          b.weapon?.main1 ||
          b.weapon?.main2 ||
          b.armor?.main1 ||
          b.armor?.main2 ||
          b.subOption ||
          Number.isFinite(b.speed) ||
          b.note;

        return (
          <button
            key={`${hero.hero_key || hero.name}-${idx}`}
            onClick={() => {
              if (hasBuild) {
                setOpenDbBuild({
                  heroName: hero.name,
                  heroKey: hero.hero_key || "",
                  build: hero.build || {},
                });
                return;
              }
              openEquipmentByHero(hero);
            }}
            className="flex flex-col items-center bg-white border border-slate-200 rounded-xl px-1.5 py-2 shadow-sm w-[56px] shrink-0 hover:bg-slate-50 hover:shadow transition"
            title={hasBuild ? "DB 세팅 있음" : "기본 추천 열기"}
          >
            <img
              src={
                hero.image?.startsWith("/images/")
                  ? hero.image
                  : `/images/heroes/${hero.image}`
              }
              alt={hero.name}
              className="w-12 h-12 object-contain"
              loading="lazy"
            />
            <div className="h-[6px]" />
            <p className="text-[10px] mt-1 text-center text-slate-900 truncate w-full">
              {hero.name}
            </p>
            {hasBuild ? (
              <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
            ) : (
              <div className="h-2" />
            )}
          </button>
        );
      })}
    </div>
  );

  // ✅ 팀 카드에서 보여줄 "평균 추천도" (5점제)
  const RatingSummary = ({ avg = 0, count = 0 }) => {
    const a = Number(avg || 0);
    const c = Number(count || 0);
    const filled = Math.round(a);
    const f = Math.max(0, Math.min(5, filled));
    return (
      <div className="mt-2 flex items-center gap-2">
        <div className="text-[12px] font-black text-amber-500">
          {"★".repeat(f)}
          <span className="text-slate-300">{"☆".repeat(Math.max(0, 5 - f))}</span>
        </div>
        <div className="text-[11px] font-extrabold text-slate-500">
          {a ? a.toFixed(1) : "0.0"} · {c}명
        </div>
      </div>
    );
  };

  // ✅ 팀 카드에서 "내가 찍는 별" (5점제)
  const RatingInput = ({ postId, myRating = 0 }) => {
    if (!me?.id) return null;

    const cur = Number(myRating || 0);

    return (
      <div className="mt-1 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((v) => {
          const on = cur >= v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => ratePost(postId, v)}
              className={[
                "text-[14px] leading-none transition hover:scale-110",
                on ? "text-amber-500" : "text-slate-300",
              ].join(" ")}
              title={`${v}점`}
            >
              ★
            </button>
          );
        })}
        <span className="ml-2 text-[11px] font-extrabold text-slate-500">
          내 평가
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
  {/* 왼쪽: 2줄로 쌓기 */}
  <div className="flex flex-col">
    <div className="text-[12px] font-extrabold text-slate-500">
      팀 {mergedTeams.length}개{" "}
      {dbLoading ? (
        <span className="ml-2 text-slate-400">(DB 로딩중)</span>
      ) : null}
    </div>

    {/* ✅ 원하는 “밑 로우” */}
    <div className="mt-1 text-[11px] font-semibold text-slate-400">
      영웅을 클릭하면 장비 추천이 표시됩니다
    </div>
  </div>

  <button
    onClick={openCreatePage}
    className="rounded-2xl px-3 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800 transition"
  >
    + 팀 추가
  </button>
</div>


        <div className="p-5">
          {dbError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
              <div className="text-[12px] font-extrabold">DB 불러오기 실패</div>
              <div className="mt-1 text-[12px] font-semibold break-all">
                {dbError}
              </div>
            </div>
          ) : null}

          <div className="mt-4 space-y-4">
            {mergedTeams.map((team) => {
              const isDb = team.source === "db";
              const title = isDb ? "유저 팀" : `팀 ${team.idx + 1}`;
              const teamKey = isDb ? `db-${team.id}` : `json-${team.idx}`;
              const isMine = isDb && me?.id && team.created_by === me.id;

              return (
                <div
                  key={teamKey}
                  className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-black text-slate-900">
                      {title}
                    </div>

                    <div className="flex items-center gap-2">
                      {isDb ? (
                        <span className="text-[11px] px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-extrabold">
                          DB
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-1 rounded-full border border-slate-200 bg-white text-slate-600 font-extrabold">
                          JSON
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ✅ 작성자 표시 (DB 팀만) */}
                  {isDb ? (
                    <div className="mt-1 text-[12px] font-extrabold text-slate-500">
                      작성자: {team.anonymous ? "익명" : formatDisplayName(team.profiles)}
                    </div>
                  ) : null}

                  {/* ✅ 공성전 추천도(평균) + 별점 찍기(내 평가) : DB 팀만 */}
                  {isDb ? (
                    <>
                      <RatingSummary avg={team.ratingAvg} count={team.ratingCount} />
                      <RatingInput postId={team.id} myRating={team.myRating} />
                    </>
                  ) : null}

                  {isDb
                    ? renderHeroesDb(team.team, team)
                    : renderHeroesJson(team.team)}

                  {/* ✅ 팀 설명(tags) */}
                  {Array.isArray(team.tags) && team.tags.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {team.tags.map((t, i) => (
                        <span
                          key={`${teamKey}-tag-${i}`}
                          className="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {/* ✅ 내 글이면 수정/삭제 */}
                  {isMine ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditPage(team.id)}
                        className="px-3 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-extrabold text-slate-700 hover:bg-slate-50"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deletePost(team.id)}
                        disabled={deletingId === team.id}
                        className="px-3 py-2 rounded-2xl border border-rose-200 bg-rose-50 text-sm font-extrabold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                      >
                        {deletingId === team.id ? "삭제중..." : "삭제"}
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {!isDb ? (
                      <Link
                        to={`/siege-skill/${encodeURIComponent(selectedDay)}/${team.idx}`}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-2xl bg-slate-900 text-white text-sm font-extrabold hover:bg-slate-800 transition"
                      >
                        스킬 순서
                      </Link>
                    ) : (
                      <button
                        onClick={() =>
                          setOpenSkillKey((prev) => (prev === teamKey ? null : teamKey))
                        }
                        className="inline-flex items-center justify-center px-3 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-extrabold text-slate-700 hover:bg-slate-50 transition"
                      >
                        {openSkillKey === teamKey ? "스킬 순서 닫기" : "스킬 순서 보기"}
                      </button>
                    )}
                  </div>

                  {isDb && openSkillKey === teamKey
                    ? renderSkillOrdersInline(team.skillOrders)
                    : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedHeroKey ? (
        <EquipmentModal
          heroKey={selectedHeroKey}
          presetTag={presetTag}
          onClose={() => {
            setSelectedHeroKey(null);
            setPresetTag(null);
          }}
        />
      ) : null}

      {openTextBuild ? (
        <TextModal
          title={openTextBuild.title}
          content={openTextBuild.content}
          onClose={() => setOpenTextBuild(null)}
        />
      ) : null}

      {openDbBuild ? (
        <DbBuildModal
          heroName={openDbBuild.heroName}
          build={openDbBuild.build}
          onClose={() => setOpenDbBuild(null)}
        />
      ) : null}
    </>
  );
}

function TextModal({ title, content, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200">
          <div className="font-black text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <div className="whitespace-pre-line text-sm text-slate-800 leading-relaxed space-y-1">
            {(content || []).map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-extrabold hover:bg-slate-800 transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ 컴팩트 DB 세팅 모달 (라벨 왼쪽 / 값 오른쪽)
function DbBuildModal({ heroName, build, onClose }) {
  const b = build || {};
  const weapon = b.weapon || {};
  const armor = b.armor || {};

  const setName = (b.set && String(b.set).trim()) || "-";
  const speedText = Number.isFinite(b.speed) ? `${b.speed}` : "-";

  const vWeapon1 = (weapon.main1 && String(weapon.main1).trim()) || "-";
  const vWeapon2 = (weapon.main2 && String(weapon.main2).trim()) || "-";
  const vArmor1 = (armor.main1 && String(armor.main1).trim()) || "-";
  const vArmor2 = (armor.main2 && String(armor.main2).trim()) || "-";

  const subOpt = (b.subOption && String(b.subOption).trim()) || "-";
  const note = (b.note && String(b.note).trim()) || "-";

  const Row = ({ label, value, mono = false }) => (
    <div className="grid grid-cols-[70px_1fr] gap-2 py-1.5">
      <div className="text-[11px] font-extrabold text-slate-500">{label}</div>
      <div
        className={[
          "text-[12px] font-extrabold text-slate-900 leading-snug break-words",
          mono ? "font-mono font-bold" : "",
        ].join(" ")}
        title={value !== "-" ? value : undefined}
      >
        {value}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-3">
      <div className="w-[92vw] max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
          <div className="text-[12px] font-black text-slate-900 truncate">
            {heroName} · DB 세팅
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition"
            aria-label="닫기"
            title="닫기"
          >
            ✕
          </button>
        </div>

        <div className="p-3 bg-slate-50">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <Row label="세트" value={setName} />
            <Row label="속공" value={speedText} />

            <div className="my-2 h-px bg-slate-200" />

            <Row label="무기1" value={vWeapon1} />
            <Row label="무기2" value={vWeapon2} />
            <Row label="방어1" value={vArmor1} />
            <Row label="방어2" value={vArmor2} />

            <div className="my-2 h-px bg-slate-200" />

            <Row label="부옵" value={subOpt} mono />
            <Row label="메모" value={note} />
          </div>
        </div>

        <div className="px-3 py-2 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[12px] font-extrabold hover:bg-slate-800 transition"
          >
            닫기
          </button>
        </div>
      </div>
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
