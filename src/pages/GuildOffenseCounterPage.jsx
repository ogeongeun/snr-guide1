// src/pages/GuildOffenseListPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, createSearchParams } from "react-router-dom";
import { Search, Swords, ChevronDown, ChevronRight } from "lucide-react";

import data from "../data/guildCounter.json";
import equipmentData from "../data/equipmentRecommend.json";
import EquipmentModal from "../components/EquipmentModal";
import { supabase } from "../lib/supabaseClient";

// =========================
// ✅ util (컴포넌트 밖)
// =========================
const heroImg = (src) =>
  src?.startsWith("/images/") ? src : `/images/heroes/${src || ""}`;

// =========================
// ✅ memo components (컴포넌트 밖)
// =========================
const SkillStrip = React.memo(function SkillStrip({ skills, size = "w-9 h-9" }) {
  if (!Array.isArray(skills) || skills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((img, i) => (
        <img
          key={`${img}-${i}`}
          src={`/images/skills/${img}`}
          alt={`Skill ${i + 1}`}
          className={`${size} border border-slate-200 rounded-lg bg-white shadow-sm`}
          loading="lazy"
        />
      ))}
    </div>
  );
});

const HeroCard = React.memo(function HeroCard({ hero, onClick }) {
  const hasPreset =
    !!hero?.preset || (hero?.note && String(hero.note).includes("프리셋"));

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm hover:bg-slate-50 transition"
    >
      <img
        src={heroImg(hero?.image)}
        alt={hero?.name}
        className="w-14 h-14 object-contain"
        loading="lazy"
      />

      {hero?.note ? (
        <p className="mt-1 text-[10px] font-semibold text-rose-600 text-center leading-tight">
          {hero.note}
        </p>
      ) : (
        <div className="h-[14px]" />
      )}

      <p className="mt-1 text-[11px] font-semibold text-slate-700 text-center">
        {hero?.name || "-"}
      </p>

      {hasPreset ? (
        <span className="mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          {hero?.preset || hero?.note}
        </span>
      ) : null}
    </button>
  );
});

export default function GuildOffenseListPage() {
  const navigate = useNavigate();

  // =========================
  // ✅ DB 방어팀 목록(사용자 등록)
  // =========================
  const [dbLoading, setDbLoading] = useState(true);
  const [dbErr, setDbErr] = useState("");
  const [dbDefenseEntries, setDbDefenseEntries] = useState([]);

  useEffect(() => {
    const run = async () => {
      setDbLoading(true);
      setDbErr("");

      try {
        const { data: posts, error: postErr } = await supabase
          .from("guild_defense_posts")
          .select("id,label,note,tags,skills,created_at")
          .order("created_at", { ascending: false })
          .limit(100);

        if (postErr) throw postErr;

        const ids = (posts || []).map((p) => p.id);
        if (ids.length === 0) {
          setDbDefenseEntries([]);
          setDbLoading(false);
          return;
        }

        const { data: members, error: memErr } = await supabase
          .from("guild_defense_members")
          .select("post_id,slot,hero_key,hero_name,hero_image")
          .in("post_id", ids);

        if (memErr) throw memErr;

        const memMap = new Map();
        (members || []).forEach((m) => {
          if (!memMap.has(m.post_id)) memMap.set(m.post_id, []);
          memMap.get(m.post_id).push(m);
        });

        const normalized = (posts || []).map((p) => {
          const list = (memMap.get(p.id) || [])
            .slice()
            .sort((a, b) => (a.slot || 0) - (b.slot || 0))
            .slice(0, 3);

          const defenseTeam = [1, 2, 3].map((slot) => {
            const found = list.find((x) => x.slot === slot);
            return {
              name: found?.hero_name || "",
              image: found?.hero_image || "",
              key: found?.hero_key || "",
              preset: null,
              note: "",
            };
          });

          return {
            source: "db",
            id: p.id,
            label: p.label || "라벨없음",
            note: p.note || "",
            tags: Array.isArray(p.tags) ? p.tags : [],
            skills: Array.isArray(p.skills) ? p.skills : [],
            created_at: p.created_at,
            defenseTeam,
            defenseVariants: [],
            pet: null,
          };
        });

        setDbDefenseEntries(normalized);
      } catch (e) {
        setDbErr(e?.message || "DB 불러오기 실패");
        setDbDefenseEntries([]);
      } finally {
        setDbLoading(false);
      }
    };

    run();
  }, []);

  const jsonCategories = useMemo(() => Object.keys(data.categories || {}), []);

  // 🔍 검색(최대 3명)
  const [heroFilter, setHeroFilter] = useState(["", "", ""]);

  // (모바일 접기/펼치기용)
  const [openLabel, setOpenLabel] = useState(null);

  // ✅ 장비 모달(왼쪽/목록 카드에서만 사용)
  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);

  // ✅ 영웅 클릭(카드에서만)
  const handleHeroClick = useCallback((hero) => {
    let heroKey = Object.keys(equipmentData).find(
      (key) => equipmentData[key]?.name === hero?.name
    );

    if (!heroKey && hero?.key && equipmentData[hero.key]) heroKey = hero.key;
    if (!heroKey) return;

    const detectedPreset =
      hero?.preset ||
      (hero?.note && String(hero.note).includes("프리셋") ? hero.note : null);

    setSelectedHeroKey(heroKey);
    setPresetTag(detectedPreset);
  }, []);

  // ✅ JSON + DB 합친 검색 대상
  const allEntries = useMemo(() => {
    const list = [];

    dbDefenseEntries.forEach((entry, idx) => {
      list.push({ category: "DB(사용자등록)", idx, entry });
    });

    jsonCategories.forEach((cat) => {
      const arr = data.categories?.[cat];
      if (!Array.isArray(arr)) return;
      arr.forEach((entry, idx) =>
        list.push({ category: cat, idx, entry: { ...entry, source: "json" } })
      );
    });

    return list;
  }, [dbDefenseEntries, jsonCategories]);

  const normalizedFilter = useMemo(
    () =>
      heroFilter
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 3),
    [heroFilter]
  );

  const filteredEntries = useMemo(() => {
    // ✅ 검색 전에는 아무것도 안 보여줌
    if (normalizedFilter.length === 0) return [];

    return allEntries.filter(({ entry }) => {
      if (!Array.isArray(entry?.defenseTeam)) return false;

      const defenseNames = entry.defenseTeam.map((h) =>
        String(h?.name || "").toLowerCase()
      );

      return normalizedFilter.every((input) =>
        defenseNames.some((dn) => dn.includes(input))
      );
    });
  }, [allEntries, normalizedFilter]);

  const hasAny = filteredEntries.length > 0;

  const groupedByLabel = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((item) => {
      const key = item.entry?.label || "라벨없음";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [filteredEntries]);

  const goToCreateDefensePage = () => navigate("/guild-defense/new");

  const reset = () => {
    setHeroFilter(["", "", ""]);
    setOpenLabel(null);
  };

  // ✅ 상세로 이동 (모바일/PC 공통)
  const goDetail = (category, idx, entry) => {
    if (category === "DB(사용자등록)") {
      navigate({
        pathname: `/guild-offense/${encodeURIComponent("DB(사용자등록)")}/${idx}`,
        search: `?${createSearchParams({
          variant: "0",
          postId: String(entry.id),
        })}`,
      });
      return;
    }

    // JSON은 variant를 0으로 기본 이동(상세에서 패턴 바꾸게)
    navigate(`/guild-offense/${encodeURIComponent(category)}/${idx}?variant=0`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        {/* 헤더 */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            className="h-28 lg:h-32 w-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(244,63,94,0.14), rgba(99,102,241,0.16), rgba(251,191,36,0.12))",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-5 lg:px-8">
            <div className="min-w-0">
              <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-slate-900">
                카운터덱 편성
              </h1>
              <p className="mt-1 text-xs lg:text-sm font-semibold text-slate-700/70">
                방어 영웅을 입력하면 추천 카운터를 빠르게 찾습니다.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                  <Swords size={14} strokeWidth={2.6} />
                  결과 {filteredEntries.length}개
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                  <Search size={14} strokeWidth={2.6} />
                  필터 {normalizedFilter.length}/3
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                  DB {dbLoading ? "로딩중" : dbDefenseEntries.length}개
                </span>
              </div>

              {dbErr ? (
                <div className="mt-2 text-[12px] font-semibold text-rose-600">
                  DB 오류: {dbErr}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/guild-defense"
                className="hidden sm:inline-flex rounded-xl px-4 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
              >
                ← 길드전
              </Link>
              <Link
                to="/"
                className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
              >
                홈
              </Link>
            </div>
          </div>
        </div>

        {/* =========================
            ✅ MOBILE (기존 구조 유지)
           ========================= */}
        <div className="lg:hidden mt-6 space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[16px] font-black text-slate-900">
                  방어 영웅 검색
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  부분 검색 / 순서 무관 / 최대 3명
                </div>
              </div>

              <button
                type="button"
                onClick={reset}
                className="shrink-0 rounded-xl px-3 py-2 text-xs font-extrabold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                초기화
              </button>
            </div>

            <div className="p-4 space-y-2">
              {heroFilter.map((v, i) => (
                <div key={i} className="relative">
                  <input
                    value={v}
                    onChange={(e) => {
                      const next = [...heroFilter];
                      next[i] = e.target.value;
                      setHeroFilter(next);
                    }}
                    placeholder={`영웅 ${i + 1}`}
                    className={[
                      "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3",
                      "text-sm font-semibold text-slate-800 placeholder:text-slate-400",
                      "focus:outline-none focus:ring-2 focus:ring-slate-200",
                    ].join(" ")}
                  />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                    <Search size={18} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={goToCreateDefensePage}
            className="w-full rounded-2xl px-4 py-3 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
          >
            상대 방어팀 새로 추가하기 →
          </button>

          {!hasAny ? (
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
              <div className="text-[14px] font-black text-slate-900">
                결과가 없습니다.
              </div>
              <div className="mt-1 text-[12px] font-semibold text-slate-600">
                영웅 이름 일부를 검색해야 결과가 뜹니다 다시 입력해보세요.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(groupedByLabel.entries()).map(([label, items]) => (
                <div
                  key={label}
                  className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenLabel(openLabel === label ? null : label)}
                    className="w-full text-left px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="text-[15px] font-black text-slate-900 truncate">
                        {label}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        {items.length}개 덱
                      </div>
                    </div>

                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition ${
                        openLabel === label ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openLabel === label ? (
                    <div className="p-5 space-y-4">
                      {items.map(({ category, idx, entry }, i) => {
                        const variants = Array.isArray(entry?.defenseVariants)
                          ? entry.defenseVariants
                          : [];
                        const isDb = category === "DB(사용자등록)";

                        return (
                          <div
                            key={`${category}-${idx}-${i}`}
                            className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                          >
                            <div className="px-5 py-4 border-b border-slate-100">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-[12px] font-extrabold text-slate-500">
                                  {category}
                                </div>
                                {isDb ? (
                                  <span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    DB
                                  </span>
                                ) : null}
                              </div>

                              <div className="mt-1 text-[16px] font-black text-slate-900 truncate">
                                #{idx + 1} {entry?.label || "라벨없음"}
                              </div>

                              {isDb && entry?.note ? (
                                <div className="mt-1 text-[12px] font-semibold text-slate-600">
                                  {entry.note}
                                </div>
                              ) : null}
                            </div>

                            <div className="p-5">
                              <div className="grid grid-cols-3 gap-2">
                                {Array.isArray(entry?.defenseTeam)
                                  ? entry.defenseTeam.map((h, hi) => (
                                      <HeroCard
                                        key={`${h?.name}-${h?.image}-${hi}`}
                                        hero={h}
                                        onClick={() => handleHeroClick(h)}
                                      />
                                    ))
                                  : null}
                              </div>

                              {/* ✅ 모바일: 기존처럼 상세 라우트 이동 */}
                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={() => goDetail(category, idx, entry)}
                                  className="w-full rounded-2xl px-4 py-3 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
                                >
                                  상세 보기 →
                                </button>
                              </div>

                              {/* (선택) JSON 패턴별 버튼은 유지하고 싶으면 여기서 variants로 추가해도 됨 */}
                              {!isDb && variants.length > 0 ? (
                                <div className="mt-4 space-y-3">
                                  {variants.map((v, vIdx) => (
                                    <div
                                      key={vIdx}
                                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="text-[13px] font-black text-slate-900">
                                          패턴 #{vIdx + 1}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            navigate(
                                              `/guild-offense/${encodeURIComponent(
                                                category
                                              )}/${idx}?variant=${vIdx}`
                                            )
                                          }
                                          className="rounded-xl px-3 py-2 text-xs font-extrabold bg-slate-900 text-white hover:bg-slate-800"
                                        >
                                          카운터 보기 →
                                        </button>
                                      </div>

                                      <div className="mt-3">
                                        <SkillStrip
                                          skills={v?.defenseSkills}
                                          size="w-9 h-9"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================
            ✅ PC: 왼쪽 검색 / 오른쪽 방어팀 목록 (embedded 제거)
           ========================= */}
        <div className="hidden lg:block mt-6">
          <div className="grid grid-cols-12 gap-6">
            {/* LEFT: 검색 */}
            <aside className="col-span-4 space-y-4">
              <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[16px] lg:text-[18px] font-black text-slate-900">
                      방어 영웅 검색
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      부분 검색 / 순서 무관 / 최대 3명
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl px-3 py-2 text-xs font-extrabold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    초기화
                  </button>
                </div>

                <div className="p-5">
                  <div className="space-y-3">
                    {heroFilter.map((v, i) => (
                      <div key={i} className="relative">
                        <input
                          value={v}
                          onChange={(e) => {
                            const next = [...heroFilter];
                            next[i] = e.target.value;
                            setHeroFilter(next);
                          }}
                          placeholder={`영웅 ${i + 1}`}
                          className={[
                            "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3",
                            "text-sm font-semibold text-slate-800 placeholder:text-slate-400",
                            "focus:outline-none focus:ring-2 focus:ring-slate-200",
                          ].join(" ")}
                        />
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                          <Search size={18} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={goToCreateDefensePage}
                    className="mt-4 w-full rounded-2xl px-4 py-3 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
                  >
                    상대 방어팀 추가하기 →
                  </button>
                </div>
              </div>
            </aside>

            {/* RIGHT: 목록 */}
            <main className="col-span-8">
              <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <div className="text-[12px] font-extrabold text-slate-500">
                    방어팀 목록 (JSON + DB)
                  </div>
                  <div className="mt-1 text-[16px] font-black text-slate-900">
                    {normalizedFilter.length === 0
                      ? "왼쪽에 영웅을 입력하세요."
                      : hasAny
                      ? "방어팀을 선택하세요."
                      : "결과가 없습니다."}
                  </div>
                </div>

                <div className="p-5 space-y-4 max-h-[calc(100vh-210px)] overflow-auto">
                  {normalizedFilter.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="text-[13px] font-black text-slate-900">
                        검색 대기
                      </div>
                      <div className="mt-1 text-[12px] font-semibold text-slate-600">
                        영웅 이름 일부라도 입력해야 결과가 표시됩니다.
                      </div>
                    </div>
                  ) : !hasAny ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="text-[13px] font-black text-slate-900">
                        결과 없음
                      </div>
                      <div className="mt-1 text-[12px] font-semibold text-slate-600">
                        입력을 바꿔보세요.
                      </div>
                    </div>
                  ) : (
                    filteredEntries.map(({ category, idx, entry }) => {
                      const isDb = category === "DB(사용자등록)";
                      const variants = Array.isArray(entry?.defenseVariants)
                        ? entry.defenseVariants
                        : [];

                      return (
                        <div
                          key={`${category}-${idx}`}
                          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                        >
                          <div className="px-5 py-4 border-b border-slate-100">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-[12px] font-extrabold text-slate-500">
                                {category}
                              </div>
                              {isDb ? (
                                <span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  DB
                                </span>
                              ) : (
                                <span className="text-[11px] font-extrabold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  JSON
                                </span>
                              )}
                            </div>

                            <div className="mt-1 text-[15px] font-black text-slate-900 truncate">
                              #{idx + 1} {entry?.label || "라벨없음"}
                            </div>

                            {entry?.note ? (
                              <div className="mt-1 text-[12px] font-semibold text-slate-600 line-clamp-2">
                                {entry.note}
                              </div>
                            ) : null}
                          </div>

                          <div className="p-5">
                            <div className="grid grid-cols-3 gap-2">
                              {Array.isArray(entry?.defenseTeam)
                                ? entry.defenseTeam.map((h, hi) => (
                                    <HeroCard
                                      key={`${h?.name}-${h?.image}-${hi}`}
                                      hero={h}
                                      onClick={() => handleHeroClick(h)}
                                    />
                                  ))
                                : null}
                            </div>

                            {/* (옵션) JSON의 방어 스킬 표시 */}
                            {!isDb &&
                            Array.isArray(variants?.[0]?.defenseSkills) &&
                            variants[0].defenseSkills.length > 0 ? (
                              <div className="mt-3">
                                <div className="text-[12px] font-extrabold text-slate-500 mb-2">
                                  방어 스킬(패턴)
                                </div>
                                <SkillStrip
                                  skills={variants[0].defenseSkills}
                                  size="w-8 h-8"
                                />
                              </div>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => goDetail(category, idx, entry)}
                              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
                            >
                              카운터 보기 <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>

        {/* 장비 모달 */}
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
      </div>
    </div>
  );
}
