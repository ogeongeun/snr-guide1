// src/pages/DefenseSubmitPage.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import heroesList from "../data/heroes.json";

// =========================
// 이미지 유틸
// =========================
const heroImg = (src) =>
  src?.startsWith("/images/") ? src : `/images/heroes/${src || ""}.png`;
const ringImg = (key) => `/images/ring/${key}.png`;
// ✅ 세공 폴더/파일명이 다르면 여기만 바꾸면 됨
const engraveImg = (key) => `/images/ring/${key}.png`;

// =========================
// 영웅 리스트 정규화
// =========================
function normalizeHeroes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => {
      if (!h) return null;
      if (typeof h === "string") return { key: h, name: h, img: heroImg(h) };
      const key = h.key || h.id || h.slug || h.name;
      const name = h.name || h.label || key;
      const img = h.img || h.image || h.src || h.icon || heroImg(key);
      if (!key) return null;
      return { key: String(key), name: String(name), img };
    })
    .filter(Boolean);
}

// =========================
// 반지/세공 옵션 (요구한 순서)
// =========================
const RING_OPTIONS = [
  { key: "6bul", name: "6불사", tier: 1 },
  { key: "6geon", name: "6권능", tier: 1 },
  { key: "6bu", name: "6부활", tier: 1 },

  { key: "5bul", name: "5불사", tier: 2 },
  { key: "5geon", name: "5권능", tier: 2 },
  { key: "5bu", name: "5부활", tier: 2 },

  { key: "4bul", name: "4불사", tier: 3 },
  { key: "4geon", name: "4권능", tier: 3 },
  { key: "4bu", name: "4부활", tier: 3 },

  { key: "6gihap", name: "6기합", tier: 4 },
  { key: "6geongang", name: "6건강", tier: 4 },
  { key: "6cheol", name: "6철벽", tier: 4 },
];

const ENGRAVE_OPTIONS = [
  { key: "6bul", name: "6불사", tier: 1 },
  { key: "6geon", name: "6권능", tier: 1 },
  { key: "6bu", name: "6부활", tier: 1 },

  { key: "5bul", name: "5불사", tier: 2 },
  { key: "5geon", name: "5권능", tier: 2 },
  { key: "5bu", name: "5부활", tier: 2 },

  { key: "4bul", name: "4불사", tier: 3 },
  { key: "4geon", name: "4권능", tier: 3 },
  { key: "4bu", name: "4부활", tier: 3 },

  { key: "6gihap", name: "6기합", tier: 4 },
  { key: "6geongang", name: "6건강", tier: 4 },
  { key: "6cheol", name: "6철벽", tier: 4 },
];

const tierRankFromKey = (key) => {
  const found = RING_OPTIONS.find((x) => x.key === key);
  return found?.tier ?? 999;
};

const ringName = (key) => RING_OPTIONS.find((x) => x.key === key)?.name || key;
const engraveName = (key) =>
  ENGRAVE_OPTIONS.find((x) => x.key === key)?.name || key;

// =========================
// 영웅 선택 모달(필터용)
// =========================
function HeroPickerModal({ open, onClose, onPick }) {
  const allHeroes = useMemo(() => normalizeHeroes(heroesList), []);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const qq = (q || "").trim().toLowerCase();
    if (!qq) return allHeroes;
    return allHeroes.filter(
      (h) => h.key.toLowerCase().includes(qq) || h.name.toLowerCase().includes(qq)
    );
  }, [allHeroes, q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-end lg:items-center justify-center p-3">
      <div className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-extrabold text-slate-500">영웅 선택</div>
            <div className="text-[16px] font-black text-slate-900">
              필터 영웅을 선택하세요
            </div>
          </div>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-[12px] font-extrabold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            닫기
          </button>
        </div>

        <div className="p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색 (영웅명/키)"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
          />

          <div className="mt-3 max-h-[55vh] lg:max-h-[60vh] overflow-auto rounded-xl border border-slate-200">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2">
              {filtered.map((h) => (
                <button
                  key={h.key}
                  onClick={() => onPick(h.key)}
                  className="group rounded-xl border p-2 text-left transition border-slate-200 bg-white hover:shadow-sm hover:ring-2 hover:ring-slate-200"
                  title={h.name}
                >
                  <div className="aspect-square rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
                    <img
                      src={h.img}
                      alt={h.name}
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] font-extrabold text-slate-800 truncate">
                    {h.name}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 truncate">
                    {h.key}
                  </div>
                </button>
              ))}
              {filtered.length === 0 ? (
                <div className="col-span-full p-6 text-center text-[12px] font-semibold text-slate-600">
                  검색 결과가 없습니다.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-3 text-[11px] font-semibold text-slate-500">
            * 영웅 이미지는 <span className="font-extrabold">/images/heroes</span> 기준으로
            표시됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DefenseSubmitPage({ embedded = false }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [guild, setGuild] = useState(null);
  const [myRole, setMyRole] = useState(null);

  // ✅ 랭킹
  const [rankLoading, setRankLoading] = useState(false);
  const [rankErr, setRankErr] = useState("");
  const [rows, setRows] = useState([]);

  // ✅ 필터
  const [filterHero, setFilterHero] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // ✅ 영웅 키 -> 한글명 맵
  const heroNameMap = useMemo(() => {
    const arr = normalizeHeroes(heroesList);
    const m = new Map();
    arr.forEach((h) => m.set(h.key, h.name));
    return m;
  }, []);

  const heroName = (key) => {
    if (!key) return "-";
    return heroNameMap.get(key) || key;
  };

  // -------------------------
  // 0) 로그인/길드 로드
  // -------------------------
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

        // 1) 내 멤버십(최근 1개)
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

        // 2) 길드 정보
        const { data: gRows, error: gErr } = await supabase
          .from("guilds")
          .select("id, name, leader_user_id")
          .eq("id", mem.guild_id)
          .limit(1);

        if (gErr) throw gErr;

        const g = (gRows ?? [])[0] ?? null;
        setGuild(g);
      } catch (e) {
        console.error("DefenseSubmitPage error:", e);
        setErrMsg(e?.message ? String(e.message) : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate]);

  // -------------------------
  // ✅ 팀 n개를 지원: teamIdx 받아서 슬롯 꺼내기
  // -------------------------
  const getTeamSlots = (r, teamIdx = 0) => {
    const teamsArr = Array.isArray(r?.teams) ? r.teams : [];
    const team = teamsArr[teamIdx] || null;
    const slotsRaw = Array.isArray(team?.heroes) ? team.heroes : [];

    const norm = slotsRaw.slice(0, 3).map((x) => {
      if (x && typeof x === "object" && !Array.isArray(x)) {
        return {
          hero: x.hero ?? x.key ?? x.id ?? x.slug ?? x.name ?? null,
          ring_key: x.ring_key ?? x.ring ?? null,
          engrave_key: x.engrave_key ?? x.engrave ?? null,
        };
      }
      if (typeof x === "string") return { hero: x, ring_key: null, engrave_key: null };
      return { hero: null, ring_key: null, engrave_key: null };
    });

    while (norm.length < 3) norm.push({ hero: null, ring_key: null, engrave_key: null });
    return norm;
  };

  const bestTierOfKeys = (keys) => {
    if (!Array.isArray(keys) || keys.length === 0) return 999;
    const nums = keys.map((k) => tierRankFromKey(k)).filter((n) => Number.isFinite(n));
    if (!nums.length) return 999;
    return Math.min(...nums);
  };

  // -------------------------
  // 1) 랭킹 로드
  // -------------------------
  const loadRanking = async (guildId) => {
    setRankLoading(true);
    setRankErr("");

    const selectWithKeys =
      "id, user_id, heroes, ring_key, engrave_key, ring_star, engrave_star, teams, updated_at, created_at";
    const selectFallback =
      "id, user_id, heroes, ring_star, engrave_star, teams, updated_at, created_at";

    try {
      let data = null;

      {
        const { data: d1, error: e1 } = await supabase
          .from("guild_defense_submissions")
          .select(selectWithKeys)
          .eq("guild_id", guildId)
          .limit(500);

        if (e1 && e1.code === "42703") {
          const { data: d2, error: e2 } = await supabase
            .from("guild_defense_submissions")
            .select(selectFallback)
            .eq("guild_id", guildId)
            .limit(500);
          if (e2) throw e2;
          data = d2 ?? [];
        } else if (e1) {
          throw e1;
        } else {
          data = d1 ?? [];
        }
      }

      // profiles nick
      const ids = Array.from(new Set((data ?? []).map((r) => r.user_id).filter(Boolean)));
      let nickMap = new Map();
      if (ids.length) {
        const { data: pRows, error: pErr } = await supabase
          .from("profiles")
          .select("user_id, nickname")
          .in("user_id", ids)
          .limit(2000);

        if (!pErr) {
          nickMap = new Map((pRows ?? []).map((p) => [p.user_id, p.nickname]));
        }
      }

      const normalized = (data ?? []).map((r) => ({
        ...r,
        nickname: nickMap.get(r.user_id) || "(닉네임 없음)",
      }));

      setRows(normalized);
    } catch (e) {
      console.error("rank load error:", e);
      setRankErr(e?.message ? String(e.message) : "랭킹 불러오기 실패");
    } finally {
      setRankLoading(false);
    }
  };

  useEffect(() => {
    if (!guild?.id) return;
    loadRanking(guild.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guild?.id]);

  // -------------------------
  // ✅ 팀 하나당 한줄 펼치기
  // -------------------------
  const expandedRows = useMemo(() => {
    const out = [];

    for (const r of rows) {
      const teamsArr = Array.isArray(r?.teams) ? r.teams : [];
      if (teamsArr.length) {
        for (let teamIdx = 0; teamIdx < teamsArr.length; teamIdx++) {
          const slots = getTeamSlots(r, teamIdx);
          const heroes = slots.map((s) => s.hero).filter(Boolean);

          if (filterHero && !heroes.includes(filterHero)) continue;

          const ringKeys = slots.map((s) => s.ring_key).filter(Boolean);
          const engraveKeys = slots.map((s) => s.engrave_key).filter(Boolean);

          out.push({
            ...r,
            _teamIdx: teamIdx,
            _slots: slots,
            ringTier: bestTierOfKeys(ringKeys),
            engraveTier: bestTierOfKeys(engraveKeys),
          });
        }
      } else {
        const heroes = Array.isArray(r?.heroes) ? r.heroes.slice(0, 3).filter(Boolean) : [];
        if (filterHero && !heroes.includes(filterHero)) continue;

        const slots = heroes
          .slice(0, 3)
          .map((h) => ({ hero: h, ring_key: null, engrave_key: null }));
        while (slots.length < 3) slots.push({ hero: null, ring_key: null, engrave_key: null });

        out.push({
          ...r,
          _teamIdx: 0,
          _slots: slots,
          ringTier: 999,
          engraveTier: 999,
        });
      }
    }

    // 정렬: 반지 좋은 순 → 세공 좋은 순 → 업데이트 빠른 순
    out.sort((a, b) => {
      if (a.ringTier !== b.ringTier) return a.ringTier - b.ringTier;
      if (a.engraveTier !== b.engraveTier) return a.engraveTier - b.engraveTier;
      const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return ta - tb;
    });

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filterHero]);

  // -------------------------
  // UI helpers
  // -------------------------
  const roleLabel = myRole === "leader" ? "길드장" : myRole === "member" ? "길드원" : "-";

  const badgeClass =
    myRole === "leader"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-slate-50 text-slate-700 border border-slate-200";

  const Outer = embedded ? "div" : "div";
  const outerClass = embedded ? "" : "min-h-screen bg-slate-50";
  const innerMax = embedded ? "max-w-full" : "max-w-6xl";

  const goEditPage = () => {
    navigate("/guild-manage/defense/edit");
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <Outer className={outerClass}>
      <div className={`mx-auto w-full ${innerMax} px-4 ${embedded ? "py-0" : "py-8 lg:py-10"}`}>
        {/* 상단 바 */}
        <div className="flex items-center gap-3">
          {!embedded ? (
            <button
              onClick={() => navigate(-1)}
              className="hidden lg:inline-flex rounded-xl px-3 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
            >
              ← 뒤로
            </button>
          ) : null}

          <div className="min-w-0">
            <div className="text-[12px] font-extrabold text-slate-500">길드관리</div>
            <h1 className="text-[18px] lg:text-[20px] font-black text-slate-900">
              방어팀 리스트
            </h1>
          </div>

          <div className="flex-1 h-px bg-slate-200 ml-2" />

          {!loading && !errMsg ? (
            <div className="flex items-center gap-2">
              <div
                className={`hidden lg:inline-flex shrink-0 rounded-full px-3 py-1 text-[12px] font-extrabold border ${badgeClass}`}
              >
                {roleLabel}
              </div>

              <button
                onClick={goEditPage}
                className="inline-flex rounded-xl bg-slate-900 px-3 py-2 text-[12px] font-extrabold text-white hover:bg-slate-800"
              >
                내 방어팀 수정하기
              </button>
            </div>
          ) : null}
        </div>

        {/* 본문 */}
        <div
          className={`mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm ${
            embedded ? "p-4" : "p-5"
          }`}
        >
          {loading ? (
            <div className="text-sm font-semibold text-slate-600">불러오는중...</div>
          ) : errMsg ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-[13px] font-extrabold text-rose-700">오류</div>
              <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">
                {errMsg}
              </div>
            </div>
          ) : (
            <>
              {/* 길드 정보 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[12px] font-extrabold text-slate-600">길드</div>
                    <div className="mt-1 text-[16px] font-black text-slate-900">
                      {guild?.name || "(길드명 없음)"}
                    </div>
                  </div>

                  <div
                    className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold border ${badgeClass}`}
                  >
                    {roleLabel}
                  </div>
                </div>

                <div className="mt-2 text-[12px] font-semibold text-slate-600">
                  정렬: <b>반지 좋은 순</b> → <b>세공 좋은 순</b> → <b>업데이트 빠른 순</b>
                </div>
              </div>

              {/* 필터 */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[12px] font-extrabold text-slate-600">영웅 포함 필터</div>
                    <div className="mt-1 text-[12px] font-semibold text-slate-600">
                      영웅을 선택하면 <b>그 영웅이 포함된 팀만</b> 표시됩니다.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {filterHero ? (
                      <>
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-extrabold text-slate-800">
                          <img
                            src={heroImg(filterHero)}
                            className="h-5 w-5 rounded-md border border-slate-200 bg-white object-contain"
                            alt=""
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          {heroName(filterHero)}
                        </span>
                        <button
                          onClick={() => setFilterHero(null)}
                          className="rounded-xl px-3 py-2 text-[12px] font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50"
                        >
                          해제
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setPickerOpen(true)}
                        className="rounded-xl px-3 py-2 text-[12px] font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50"
                      >
                        영웅 선택
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 리스트 */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[15px] font-black text-slate-900">방어팀 리스트</div>
                    <div className="mt-1 text-[12px] font-semibold text-slate-600">
                      {filterHero ? (
                        <>
                          필터 적용: <b>{heroName(filterHero)}</b> 포함 팀만 표시
                        </>
                      ) : (
                        <>전체 표시</>
                      )}
                    </div>
                  </div>

                  <div className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                    {expandedRows.length}개
                  </div>
                </div>

                {rankLoading ? (
                  <div className="mt-3 text-[12px] font-semibold text-slate-600">불러오는중...</div>
                ) : rankErr ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div className="text-[13px] font-extrabold text-rose-700">오류</div>
                    <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">
                      {rankErr}
                    </div>
                  </div>
                ) : expandedRows.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[12px] font-semibold text-slate-600">
                    {filterHero ? "조건에 맞는 팀이 없습니다." : "아직 제출된 방어팀이 없습니다."}
                  </div>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                    {/* ✅ 헤더: PC는 기존 1/3/8, 모바일은 1/11 */}
                    <div className="grid grid-cols-12 bg-slate-50 px-3 py-2 text-[11px] font-extrabold text-slate-600">
                      <div className="col-span-1">순위</div>
                      <div className="hidden lg:block col-span-3">닉네임</div>
                      <div className="col-span-11 lg:col-span-8">방어팀(영웅 · 반지 · 세공)</div>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {expandedRows.map((r, i) => {
                        const slots = r._slots;

                        return (
                          <div
                            key={`${r.id}-team-${r._teamIdx}`}
                            className="grid grid-cols-12 items-start px-3 py-3"
                          >
                            {/* ✅ 모바일: 닉네임을 위로(작게), PC는 숨김 */}
                            <div className="col-span-12 mb-1 lg:hidden">
                              <span className="text-[11px] font-extrabold text-slate-600">
                                {r.nickname}
                              </span>
                            </div>

                            {/* 순위 */}
                            <div className="col-span-1 text-[12px] font-black text-slate-900">
                              #{i + 1}
                            </div>

                            {/* ✅ PC 전용 닉네임 칸(기존 그대로) */}
                            <div className="hidden lg:block col-span-3 min-w-0">
                              <div className="text-[12px] font-extrabold text-slate-800 truncate">
                                {r.nickname}
                              </div>
                            </div>

                            {/* ✅ 팀 영역: 모바일은 11칸 + grid 3칸(스크롤 없음), PC는 8칸 + flex(기존) */}
                            <div className="col-span-11 lg:col-span-8">
                              <div className="grid grid-cols-3 gap-2 lg:flex lg:gap-3">
                                {slots.slice(0, 3).map((s, idx) => {
                                  const heroKey = s.hero;
                                  const ringKey = s.ring_key;
                                  const engraveKey = s.engrave_key;

                                  return (
                                    <div
                                      key={`${r.id}-team-${r._teamIdx}-slot-${idx}`}
                                      className="rounded-xl lg:rounded-2xl border border-slate-200 bg-slate-50 p-2 lg:p-3 lg:flex-1"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="h-9 w-9 lg:h-12 lg:w-12 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                                          {heroKey ? (
                                            <img
                                              src={heroImg(heroKey)}
                                              alt=""
                                              className="h-full w-full object-contain"
                                              onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                              }}
                                            />
                                          ) : (
                                            <div className="text-[12px] font-extrabold text-slate-400">
                                              -
                                            </div>
                                          )}
                                        </div>

                                        <div className="min-w-0">
                                          <div className="text-[11px] lg:text-[12px] font-black text-slate-900 truncate">
                                            {heroName(heroKey)}
                                          </div>
                                          {/* ✅ 모바일은 키 줄 숨김 */}
                                          <div className="hidden lg:block text-[10px] font-semibold text-slate-500 truncate">
                                            {heroKey || ""}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="mt-2 grid grid-cols-1 gap-1">
                                        {/* 반지 */}
                                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1.5 py-1 lg:px-2 lg:py-1">
                                          <div className="text-[10px] font-extrabold text-slate-500 shrink-0">
                                            반지
                                          </div>
                                          {ringKey ? (
                                            <>
                                              <img
                                                src={ringImg(ringKey)}
                                                className="h-4 w-4 lg:h-5 lg:w-5 rounded-md border border-slate-200 bg-white object-contain"
                                                alt=""
                                                onError={(e) => {
                                                  e.currentTarget.style.display = "none";
                                                }}
                                              />
                                              <div className="min-w-0 text-[10px] lg:text-[11px] font-extrabold text-slate-800 truncate">
                                                {ringName(ringKey)}
                                              </div>
                                            </>
                                          ) : (
                                            <div className="text-[10px] lg:text-[11px] font-semibold text-slate-400">
                                              없음
                                            </div>
                                          )}
                                        </div>

                                        {/* 세공 */}
                                        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1.5 py-1 lg:px-2 lg:py-1">
                                          <div className="text-[10px] font-extrabold text-slate-500 shrink-0">
                                            세공
                                          </div>
                                          {engraveKey ? (
                                            <>
                                              <img
                                                src={engraveImg(engraveKey)}
                                                className="h-4 w-4 lg:h-5 lg:w-5 rounded-md border border-slate-200 bg-white object-contain"
                                                alt=""
                                                onError={(e) => {
                                                  e.currentTarget.style.display = "none";
                                                }}
                                              />
                                              <div className="min-w-0 text-[10px] lg:text-[11px] font-extrabold text-slate-800 truncate">
                                                {engraveName(engraveKey)}
                                              </div>
                                            </>
                                          ) : (
                                            <div className="text-[10px] lg:text-[11px] font-semibold text-slate-400">
                                              없음
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 필터 영웅 선택 모달 */}
      <HeroPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(key) => {
          setFilterHero(key);
          setPickerOpen(false);
        }}
      />
    </Outer>
  );
}
