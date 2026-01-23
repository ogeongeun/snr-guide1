// src/pages/DefenseEditPage.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import heroesList from "../data/heroes.json";

// =========================
// 이미지 유틸
// =========================
const heroImgFallback = (src) =>
  src?.startsWith("/images/") ? src : `/images/heroes/${src || ""}.png`;

const ringImg = (key) => `/images/ring/${key}.png`;
// ✅ 너 말대로 "세공도 ring 폴더"로 유지
const engraveImg = (key) => `/images/ring/${key}.png`;

// =========================
// 영웅 리스트 정규화 + 맵
// =========================
function normalizeHeroes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => {
      if (!h) return null;
      if (typeof h === "string") return { key: h, name: h, img: heroImgFallback(h) };
      const key = h.key || h.id || h.slug || h.name;
      if (!key) return null;
      const name = h.name || h.label || String(key);
      const img = h.img || h.image || h.src || h.icon || heroImgFallback(String(key));
      return { key: String(key), name: String(name), img };
    })
    .filter(Boolean);
}

// =========================
// 반지/세공 옵션
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

// 세공 옵션도 동일 키 세트로 사용
const ENGRAVE_OPTIONS = [...RING_OPTIONS];

const ringLabel = (key) => RING_OPTIONS.find((x) => x.key === key)?.name || key;
const engraveLabel = (key) => ENGRAVE_OPTIONS.find((x) => x.key === key)?.name || key;

// =========================
// 공용 Picker
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
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-end lg:items-center justify-center p-3">
      <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-extrabold text-slate-500">영웅 선택</div>
            <div className="text-[16px] font-black text-slate-900">영웅을 선택하세요</div>
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
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
          />

          <div className="mt-3 max-h-[60vh] overflow-auto rounded-2xl border border-slate-200">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2">
              {filtered.map((h) => (
                <button
                  key={h.key}
                  onClick={() => onPick(h.key)}
                  className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:ring-2 hover:ring-slate-200 p-2 text-left transition"
                  title={h.name}
                >
                  <div className="aspect-square rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                    <img
                      src={h.img}
                      alt={h.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  {/* ✅ 칸 부족하면 여기 2줄 삭제하면 됨 */}
                  <div className="mt-1 text-[11px] font-extrabold text-slate-800 truncate">
                    {h.name}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 truncate">{h.key}</div>
                </button>
              ))}

              {filtered.length === 0 ? (
                <div className="col-span-full p-6 text-center text-[12px] font-semibold text-slate-600">
                  검색 결과가 없습니다.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemPickerModal({ open, title, options, imgFn, onClose, onPick }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const qq = (q || "").trim().toLowerCase();
    if (!qq) return options;
    return options.filter(
      (x) => x.key.toLowerCase().includes(qq) || x.name.toLowerCase().includes(qq)
    );
  }, [options, q]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-end lg:items-center justify-center p-3">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-extrabold text-slate-500">{title}</div>
            <div className="text-[16px] font-black text-slate-900">좋은 순서대로 정렬</div>
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
            placeholder="검색 (이름/키)"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
          />

          <div className="mt-3 max-h-[60vh] overflow-auto rounded-2xl border border-slate-200">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2">
              {filtered.map((x) => (
                <button
                  key={x.key}
                  onClick={() => onPick(x.key)}
                  className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:ring-2 hover:ring-slate-200 p-2 text-left transition"
                  title={x.name}
                >
                  <div className="aspect-square rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                    <img
                      src={imgFn(x.key)}
                      alt={x.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] font-extrabold text-slate-800 truncate">
                    {x.name}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 truncate">{x.key}</div>
                </button>
              ))}

              {filtered.length === 0 ? (
                <div className="col-span-full p-6 text-center text-[12px] font-semibold text-slate-600">
                  검색 결과가 없습니다.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================
// 데이터 구조 (영웅별 반지/세공)
// =========================
const emptyHeroSlot = () => ({ hero: null, ring_key: null, engrave_key: null });
const emptyTeam = () => ({ heroes: [emptyHeroSlot(), emptyHeroSlot(), emptyHeroSlot()] });

// =========================
// 메인 페이지
// =========================
export default function DefenseEditPage() {
  const navigate = useNavigate();

  const heroMap = useMemo(() => {
    const arr = normalizeHeroes(heroesList);
    const m = new Map();
    arr.forEach((h) => m.set(h.key, h));
    return m;
  }, []);

  const getHeroImg = (heroKey) => {
    if (!heroKey) return null;
    const row = heroMap.get(heroKey);
    return row?.img || heroImgFallback(heroKey);
  };

  const getHeroName = (heroKey) => {
    if (!heroKey) return "";
    return heroMap.get(heroKey)?.name || heroKey;
  };

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [guild, setGuild] = useState(null);
  const [me, setMe] = useState(null);

  const [teams, setTeams] = useState([
    emptyTeam(),
    emptyTeam(),
    emptyTeam(),
    emptyTeam(),
    emptyTeam(),
  ]);

  // Picker state
  const [heroPickOpen, setHeroPickOpen] = useState(false);
  const [ringPickOpen, setRingPickOpen] = useState(false);
  const [engravePickOpen, setEngravePickOpen] = useState(false);

  const [pickTeamIdx, setPickTeamIdx] = useState(0);
  const [pickHeroIdx, setPickHeroIdx] = useState(0);

  const [saving, setSaving] = useState(false);

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
        setMe({ id: uid });

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

        const { data: gRows, error: gErr } = await supabase
          .from("guilds")
          .select("id, name")
          .eq("id", mem.guild_id)
          .limit(1);

        if (gErr) throw gErr;
        setGuild((gRows ?? [])[0] ?? null);
      } catch (e) {
        console.error("DefenseEditPage error:", e);
        setErrMsg(e?.message ? String(e.message) : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [navigate]);

  // -------------------------
  // 1) 기존 제출 불러오기
  // -------------------------
  const loadMine = async () => {
    if (!guild?.id || !me?.id) return;

    try {
      const { data, error } = await supabase
        .from("guild_defense_submissions")
        .select("teams, heroes, ring_key, engrave_key")
        .eq("guild_id", guild.id)
        .eq("user_id", me.id)
        .limit(1);

      if (error) throw error;

      const mine = (data ?? [])[0] ?? null;
      if (!mine) return;

      // ✅ 신형 teams
      if (Array.isArray(mine.teams)) {
        const next = [emptyTeam(), emptyTeam(), emptyTeam(), emptyTeam(), emptyTeam()];

        mine.teams.slice(0, 5).forEach((t, idx) => {
          if (Array.isArray(t?.heroes) && t.heroes.length) {
            const slots = t.heroes.slice(0, 3).map((x) => {
              if (x && typeof x === "object" && !Array.isArray(x)) {
                const hero = x.hero || x.key || x.id || x.slug || x.name || null;
                const ring_key = x.ring_key || x.ring || null;
                const engrave_key = x.engrave_key || x.engrave || null;
                return {
                  hero: hero ? String(hero) : null,
                  ring_key: ring_key ? String(ring_key) : null,
                  engrave_key: engrave_key ? String(engrave_key) : null,
                };
              }
              if (typeof x === "string") return { hero: x, ring_key: null, engrave_key: null };
              return emptyHeroSlot();
            });

            while (slots.length < 3) slots.push(emptyHeroSlot());
            next[idx] = { heroes: slots };
          }
        });

        setTeams(next);
        return;
      }

      // ✅ 구버전(teams 없음): heroes만 1팀으로 변환
      if (Array.isArray(mine.heroes)) {
        const h = mine.heroes.slice(0, 3).map((x) => ({
          hero: x || null,
          ring_key: null,
          engrave_key: null,
        }));
        while (h.length < 3) h.push(emptyHeroSlot());

        setTeams((prev) => {
          const next = [...prev];
          next[0] = { heroes: h };
          return next;
        });
      }
    } catch (e) {
      console.warn("loadMine warn:", e);
    }
  };

  useEffect(() => {
    loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guild?.id, me?.id]);

  // -------------------------
  // 2) UI 조작
  // -------------------------
  const setHeroAt = (teamIdx, heroIdx, key) => {
    setTeams((prev) => {
      const next = [...prev];
      const t = { ...next[teamIdx] };
      const hs = [...t.heroes];
      const cur = { ...(hs[heroIdx] || emptyHeroSlot()) };
      cur.hero = key || null;
      if (!cur.hero) {
        cur.ring_key = null;
        cur.engrave_key = null;
      }
      hs[heroIdx] = cur;
      t.heroes = hs;
      next[teamIdx] = t;
      return next;
    });
  };

  const setRingAt = (teamIdx, heroIdx, ringKey) => {
    setTeams((prev) => {
      const next = [...prev];
      const t = { ...next[teamIdx] };
      const hs = [...t.heroes];
      const cur = { ...(hs[heroIdx] || emptyHeroSlot()) };
      if (!cur.hero) return prev;
      cur.ring_key = ringKey || null;
      hs[heroIdx] = cur;
      t.heroes = hs;
      next[teamIdx] = t;
      return next;
    });
  };

  const setEngraveAt = (teamIdx, heroIdx, engraveKey) => {
    setTeams((prev) => {
      const next = [...prev];
      const t = { ...next[teamIdx] };
      const hs = [...t.heroes];
      const cur = { ...(hs[heroIdx] || emptyHeroSlot()) };
      if (!cur.hero) return prev;
      cur.engrave_key = engraveKey || null;
      hs[heroIdx] = cur;
      t.heroes = hs;
      next[teamIdx] = t;
      return next;
    });
  };

  const clearHeroAt = (teamIdx, heroIdx) => setHeroAt(teamIdx, heroIdx, null);
  const clearRingAt = (teamIdx, heroIdx) => setRingAt(teamIdx, heroIdx, null);
  const clearEngraveAt = (teamIdx, heroIdx) => setEngraveAt(teamIdx, heroIdx, null);

  // -------------------------
  // 3) 유효성
  // -------------------------
  const teamHasAny = (t) =>
    t.heroes.some((x) => !!x?.hero || !!x?.ring_key || !!x?.engrave_key);
  const teamComplete = (t) => t.heroes.every((x) => !!x?.hero);

  const validationMsg = useMemo(() => {
    for (let i = 0; i < teams.length; i++) {
      const t = teams[i];
      if (!teamHasAny(t)) continue;
      if (!teamComplete(t)) return `${i + 1}팀: 영웅 3명 필수입니다.`;
    }

    for (let i = 0; i < teams.length; i++) {
      const t = teams[i];
      const picked = t.heroes.map((x) => x?.hero).filter(Boolean);
      if (picked.length && new Set(picked).size !== picked.length) {
        return `${i + 1}팀: 중복 영웅이 있습니다.`;
      }
    }

    return "";
  }, [teams]);

  const canSave = useMemo(() => {
    if (saving) return false;
    if (!guild?.id || !me?.id) return false;
    if (validationMsg) return false;
    const usedTeams = teams.filter((t) => teamHasAny(t));
    if (usedTeams.length === 0) return false;
    return true;
  }, [saving, guild?.id, me?.id, teams, validationMsg]);

  // -------------------------
  // 4) 저장 (✅ DB 제약 호환까지 같이 해결)
  // - teams 저장 + 구버전 필수 컬럼(heroes/ring_star/engrave_star)도 함께 넣어서 NOT NULL/CHECK 회피
  // -------------------------
  const save = async () => {
    if (!canSave) return;

    try {
      setSaving(true);

      const packedTeams = teams
        .map((t) => ({
          heroes: (t.heroes || []).slice(0, 3).map((x) => ({
            hero: x?.hero || null,
            ring_key: x?.ring_key || null,
            engrave_key: x?.engrave_key || null,
          })),
        }))
        .filter((t) => (t.heroes || []).some((x) => x.hero || x.ring_key || x.engrave_key));

      // ✅ 구버전 호환용 heroes = "첫 팀의 영웅 3명"
      const t0 = packedTeams?.[0] || null;
      const legacyHeroes = (t0?.heroes || [])
        .slice(0, 3)
        .map((x) => (x && typeof x === "object" ? x.hero : x))
        .map((x) => (x ? String(x) : null));
      while (legacyHeroes.length < 3) legacyHeroes.push(null);

      const { error } = await supabase
        .from("guild_defense_submissions")
        .upsert(
          {
            guild_id: guild.id,
            user_id: me.id,

            // ✅ 신형
            teams: packedTeams,

            // ✅ 구버전 제약 회피용(네 DB에서 NOT NULL/CHECK 걸려있던 것들)
            heroes: legacyHeroes,
            ring_key: null,
            engrave_key: null,
            ring_star: 4,
engrave_star: 4,


            updated_at: new Date().toISOString(),
          },
          { onConflict: "guild_id,user_id" }
        );

      if (error) throw error;

      navigate(-1);
    } catch (e) {
      console.error("save error:", e);
      alert(e?.message ? String(e.message) : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 lg:py-10">
        {/* 헤더 */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            className="h-24 lg:h-28 w-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(16,185,129,0.12), rgba(251,191,36,0.10))",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-5 lg:px-8">
            <div className="min-w-0">
              <h1 className="text-[20px] lg:text-[26px] font-black tracking-tight text-slate-900">
                내 방어팀 설정
              </h1>
              <p className="mt-1 text-xs lg:text-sm font-semibold text-slate-700/70">
                최대 5팀 · 팀당 3명 필수 · 영웅별 반지/세공(선택)
              </p>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                {loading ? "불러오는중" : guild?.name || "(길드명 없음)"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl px-4 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
              >
                ← 뒤로
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!canSave}
                className={`rounded-xl px-4 py-2 text-sm font-extrabold text-white ${
                  canSave ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                {saving ? "저장중..." : "저장"}
              </button>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 text-sm font-semibold text-slate-600">
              불러오는중...
            </div>
          ) : errMsg ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
              <div className="text-[13px] font-extrabold text-rose-700">오류</div>
              <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">
                {errMsg}
              </div>
            </div>
          ) : (
            <>
              {validationMsg ? (
                <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 p-4">
                  <div className="text-[12px] font-extrabold text-rose-700">확인 필요</div>
                  <div className="mt-1 text-[12px] font-semibold text-rose-700/90">
                    {validationMsg}
                  </div>
                </div>
              ) : null}

              {/* 5팀 한눈에: 모바일 가로스크롤 / PC 5열 */}
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4">
                <div className="overflow-x-auto">
                  <div className="min-w-[980px] grid grid-cols-5 gap-3">
                    {teams.map((t, teamIdx) => {
                      const used = teamHasAny(t);
                      const count = t.heroes.map((x) => x?.hero).filter(Boolean).length;

                      return (
                        <div
                          key={teamIdx}
                          className="rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-sm overflow-hidden"
                        >
                          <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
                            <div className="text-[14px] font-black">{teamIdx + 1}팀</div>
                            <div className="text-[12px] font-extrabold text-white/70">
                              {used ? `${count}/3` : "미사용"}
                            </div>
                          </div>

                          <div className="p-3 space-y-3">
                            {t.heroes.map((slot, heroIdx) => {
                              const heroKey = slot?.hero || null;
                              const ringKey = slot?.ring_key || null;
                              const engraveKey = slot?.engrave_key || null;
                              const img = getHeroImg(heroKey);

                              return (
                                <div
                                  key={heroIdx}
                                  className="rounded-2xl bg-white/5 border border-white/10 p-2"
                                >
                                  <div className="flex items-center gap-2">
                                    {/* 영웅 */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPickTeamIdx(teamIdx);
                                        setPickHeroIdx(heroIdx);
                                        setHeroPickOpen(true);
                                      }}
                                      className="flex-1 flex items-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-2 transition"
                                      title={heroKey ? getHeroName(heroKey) : "영웅 선택"}
                                    >
                                      <div className="h-12 w-12 rounded-2xl bg-black/20 border border-white/10 overflow-hidden flex items-center justify-center">
                                        {heroKey ? (
                                          <img
                                            src={img}
                                            alt=""
                                            className="h-full w-full object-contain"
                                            onError={(e) => {
                                              e.currentTarget.style.display = "none";
                                            }}
                                          />
                                        ) : (
                                          <div className="text-[18px] font-black text-white/40">+</div>
                                        )}
                                      </div>

                                    
                                    </button>

                                    {/* 오른쪽: 반지 + 세공 */}
                                    <div className="flex flex-col gap-2">
                                      {/* 반지 */}
                                      <button
                                        type="button"
                                        disabled={!heroKey}
                                        onClick={() => {
                                          setPickTeamIdx(teamIdx);
                                          setPickHeroIdx(heroIdx);
                                          setRingPickOpen(true);
                                        }}
                                        className={`h-8 w-16 rounded-2xl border transition flex items-center justify-center overflow-hidden ${
                                          heroKey
                                            ? "bg-white/5 hover:bg-white/10 border-white/10"
                                            : "bg-white/5 border-white/10 opacity-40 cursor-not-allowed"
                                        }`}
                                        title={heroKey ? "반지 선택" : "영웅 먼저 선택"}
                                      >
                                        {ringKey ? (
                                          <div className="relative h-full w-full flex items-center justify-center">
                                            <img
                                              src={ringImg(ringKey)}
                                              alt=""
                                              className="h-full w-full object-contain"
                                              onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                              }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-white/70">
                                              반지
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-[11px] font-extrabold text-white/70">
                                            반지
                                          </div>
                                        )}
                                      </button>

                                      {/* ✅ 세공: 이미지 실패해도 '세공' 글자가 보이게 */}
                                      <button
                                        type="button"
                                        disabled={!heroKey}
                                        onClick={() => {
                                          setPickTeamIdx(teamIdx);
                                          setPickHeroIdx(heroIdx);
                                          setEngravePickOpen(true);
                                        }}
                                        className={`h-8 w-16 rounded-2xl border transition flex items-center justify-center overflow-hidden ${
                                          heroKey
                                            ? "bg-white/5 hover:bg-white/10 border-white/10"
                                            : "bg-white/5 border-white/10 opacity-40 cursor-not-allowed"
                                        }`}
                                        title={heroKey ? "세공 선택" : "영웅 먼저 선택"}
                                      >
                                        {engraveKey ? (
                                          <div className="relative h-full w-full flex items-center justify-center">
                                            <img
                                              src={engraveImg(engraveKey)}
                                              alt=""
                                              className="h-full w-full object-contain"
                                              onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                              }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-white/70">
                                              세공
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-[11px] font-extrabold text-white/70">
                                            세공
                                          </div>
                                        )}
                                      </button>
                                    </div>
                                  </div>

                                  {/* 하단 */}
                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="text-[10px] font-semibold text-white/60 truncate">
                                        {ringKey ? `반지: ${ringLabel(ringKey)}` : "반지 없음"}
                                      </div>
                                      <div className="text-[10px] font-semibold text-white/60 truncate">
                                        {engraveKey ? `세공: ${engraveLabel(engraveKey)}` : "세공 없음"}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {ringKey ? (
                                        <button
                                          type="button"
                                          onClick={() => clearRingAt(teamIdx, heroIdx)}
                                          className="text-[11px] font-extrabold text-white/70 hover:text-white"
                                        >
                                          반지해제
                                        </button>
                                      ) : null}
                                      {engraveKey ? (
                                        <button
                                          type="button"
                                          onClick={() => clearEngraveAt(teamIdx, heroIdx)}
                                          className="text-[11px] font-extrabold text-white/70 hover:text-white"
                                        >
                                          세공해제
                                        </button>
                                      ) : null}
                                      {heroKey ? (
                                        <button
                                          type="button"
                                          onClick={() => clearHeroAt(teamIdx, heroIdx)}
                                          className="text-[11px] font-extrabold text-white/70 hover:text-rose-200"
                                        >
                                          영웅제거
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3 px-1 text-[11px] font-semibold text-slate-500">
                  * 모바일은 좌우로 스크롤하면 5팀이 한눈에 보입니다.
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pickers */}
      <HeroPickerModal
        open={heroPickOpen}
        onClose={() => setHeroPickOpen(false)}
        onPick={(key) => {
          setHeroAt(pickTeamIdx, pickHeroIdx, key);
          setHeroPickOpen(false);
        }}
      />

      <ItemPickerModal
        open={ringPickOpen}
        title="반지 선택"
        options={RING_OPTIONS}
        imgFn={ringImg}
        onClose={() => setRingPickOpen(false)}
        onPick={(key) => {
          setRingAt(pickTeamIdx, pickHeroIdx, key);
          setRingPickOpen(false);
        }}
      />

      <ItemPickerModal
        open={engravePickOpen}
        title="세공 선택"
        options={ENGRAVE_OPTIONS}
        imgFn={engraveImg}
        onClose={() => setEngravePickOpen(false)}
        onPick={(key) => {
          setEngraveAt(pickTeamIdx, pickHeroIdx, key);
          setEngravePickOpen(false);
        }}
      />
    </div>
  );
}
