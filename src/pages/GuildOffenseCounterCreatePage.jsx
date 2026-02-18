// src/pages/GuildOffenseCounterCreatePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, Swords, Shield, Search, X } from "lucide-react";

import heroesList from "../data/heroes.json";
import skillImages from "../data/skillImages.json";
import petImages from "../data/petImages.json";
import { supabase } from "../lib/supabaseClient";

// ✅ 장비 선택 리스트(중복 허용)
const SET_OPTIONS = [
  "선봉장",
  "추적자",
  "성기사",
  "수문장",
  "수호자",
  "암살자",
  "복수자",
  "주술사",
  "조율자",
];

// ✅ 진형 옵션(저장용)
const FORMATION_OPTIONS = [
  { value: "기본진형", label: "기본진형", desc: "뒤 3 / 앞 2" },
  { value: "밸런스진형", label: "밸런스진형", desc: "뒤 2 / 앞 3" },
  { value: "공격진형", label: "공격진형", desc: "앞 1 / 뒤 4" },
  { value: "보호진형", label: "보호진형", desc: "뒤 1 / 앞 4" },
];

const WEAPON_MAIN_OPTIONS = [
  "약점공격",
  "치명타확률",
  "치명타피해",
  "모든공격력%",
  "방어력%",
  "생명력%",
  "효과적중",
];

const ARMOR_MAIN_OPTIONS = [
  "받는피해감소",
  "막기확률",
  "모든공격력%",
  "방어력%",
  "생명력%",
  "효과저항",
];

const defaultBuild = () => ({
  set: "",
  weapon: { main1: "", main2: "" },
  armor: { main1: "", main2: "" },
  subOption: "",
  speed: null,
  note: "",
  // ✅ 추가: 앞/뒤 저장
  position: "", // "front" | "back"
});

const emptyHero = () => ({
  hero_key: "",
  name: "",
  image: "",
  build: defaultBuild(),
});

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const heroImg = (src) => (src?.startsWith("/images/") ? src : `/images/heroes/${src || ""}`);

function filenameFromImagePath(p) {
  if (!p) return "";
  const s = String(p);
  const parts = s.split("/");
  return parts[parts.length - 1] || "";
}

export default function GuildOffenseCounterCreatePage() {
  const navigate = useNavigate();
  const q = useQuery();

  // =========================
  // ✅ URL 파라미터
  // =========================
  const defensePostIdRaw = q.get("defensePostId");
  const defensePostId = defensePostIdRaw != null ? Number(defensePostIdRaw) : null;

  const jsonCategoryRaw = q.get("jsonCategory");
  const jsonTeamIndexRaw = q.get("jsonTeamIndex");
  const jsonTeamIndex = jsonTeamIndexRaw != null ? Number(jsonTeamIndexRaw) : null;

  const variantIdx = q.get("variant") ? Number(q.get("variant")) : 0;

  // ✅ 문자열 decode
  const jsonCategory = jsonCategoryRaw ? decodeURIComponent(jsonCategoryRaw) : "";

  // ✅ 여기서 “대상”을 1번만 확정(DB 우선)
  const target = useMemo(() => {
    const dbOk = Number.isFinite(defensePostId) && defensePostId > 0;
    const jsonOk = !dbOk && !!jsonCategoryRaw && Number.isFinite(jsonTeamIndex) && jsonTeamIndex !== null;

    if (dbOk) {
      return { type: "db", post_id: Number(defensePostId), json_category: null, json_team_index: null };
    }
    if (jsonOk) {
      return {
        type: "json",
        post_id: null,
        json_category: String(jsonCategory),
        json_team_index: Number(jsonTeamIndex),
      };
    }
    return { type: "none", post_id: null, json_category: null, json_team_index: null };
  }, [defensePostId, jsonCategoryRaw, jsonCategory, jsonTeamIndex]);

  // =========================
  // ✅ 로그인
  // =========================
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoadingMe(true);
      const { data } = await supabase.auth.getUser();
      const user = data?.user ?? null;
      setMe(user);
      setLoadingMe(false);
      if (!user) navigate("/login", { replace: true });
    };
    run();
  }, [navigate]);

  // =========================
  // ✅ 입력값
  // =========================
  const [anonymous, setAnonymous] = useState(false);
  const [note, setNote] = useState("");
  const [detail, setDetail] = useState("");

  // ✅ 진형
  const [formation, setFormation] = useState("기본진형");

  // any / win / lose
  const [speedMode, setSpeedMode] = useState("any");
  const [speedMin, setSpeedMin] = useState("");

  const [slots, setSlots] = useState([emptyHero(), emptyHero(), emptyHero()]);
  const [activeSlot, setActiveSlot] = useState(0);

  // 영웅 선택기
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState(0);
  const [heroQ, setHeroQ] = useState("");

  // 스킬
  const [skills, setSkills] = useState(["", "", ""]);
  const [skillQ, setSkillQ] = useState("");

  // 펫
  const [pets, setPets] = useState([]);
  const [petQ, setPetQ] = useState("");

  const filteredHeroes = useMemo(() => {
    const qq = (heroQ || "").trim().toLowerCase();
    const list = Array.isArray(heroesList) ? heroesList : [];
    if (!qq) return list;
    return list.filter((h) => {
      const k = String(h.key || "").toLowerCase();
      const n = String(h.name || "").toLowerCase();
      return k.includes(qq) || n.includes(qq);
    });
  }, [heroQ]);

  const filteredSkillImages = useMemo(() => {
    const qq = (skillQ || "").trim().toLowerCase();
    const list = Array.isArray(skillImages) ? skillImages : [];
    if (!qq) return list;
    return list.filter((x) => {
      const k = String(x.key || "").toLowerCase();
      const n = String(x.name || "").toLowerCase();
      return k.includes(qq) || n.includes(qq);
    });
  }, [skillQ]);

  const filteredPets = useMemo(() => {
    const qq = (petQ || "").trim().toLowerCase();
    const list = Array.isArray(petImages) ? petImages : [];
    if (!qq) return list;
    return list.filter((p) => {
      const k = String(p.key || "").toLowerCase();
      const n = String(p.name || "").toLowerCase();
      return k.includes(qq) || n.includes(qq);
    });
  }, [petQ]);

  const setSkillAt = (idx, filename) => {
    setSkills((prev) => {
      const next = [...prev];
      next[idx] = filename || "";
      return next;
    });
  };

  const pickNextSkillSlot = (filename) => {
    setSkills((prev) => {
      const next = [...prev];
      const emptyIdx = next.findIndex((x) => !String(x || "").trim());
      if (emptyIdx === -1) next[2] = filename || "";
      else next[emptyIdx] = filename || "";
      return next;
    });
  };

  const togglePet = (petKey) => {
    if (!petKey) return;
    setPets((prev) => {
      const has = prev.includes(petKey);
      if (has) return prev.filter((x) => x !== petKey);
      if (prev.length >= 3) return [...prev.slice(1), petKey];
      return [...prev, petKey];
    });
  };

  const updateSlot = (slotIndex, patch) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = { ...next[slotIndex], ...patch };
      return next;
    });
  };

  const updateBuild = (slotIndex, patch) => {
    setSlots((prev) => {
      const next = [...prev];
      const cur = next[slotIndex];
      next[slotIndex] = {
        ...cur,
        build: { ...(cur.build || defaultBuild()), ...patch },
      };
      return next;
    });
  };

  const updateWeapon = (slotIndex, key, value) => {
    setSlots((prev) => {
      const next = [...prev];
      const cur = next[slotIndex];
      const build = cur.build || defaultBuild();
      next[slotIndex] = {
        ...cur,
        build: { ...build, weapon: { ...(build.weapon || {}), [key]: value } },
      };
      return next;
    });
  };

  const updateArmor = (slotIndex, key, value) => {
    setSlots((prev) => {
      const next = [...prev];
      const cur = next[slotIndex];
      const build = cur.build || defaultBuild();
      next[slotIndex] = {
        ...cur,
        build: { ...build, armor: { ...(build.armor || {}), [key]: value } },
      };
      return next;
    });
  };

  // =========================
  // ✅ 검증 / 저장
  // =========================
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // ✅ “2번 저장” 절대 못 하게 하는 락
  const saveLockRef = useRef(false);

  const validate = () => {
    if (!me?.id) return "로그인이 필요합니다.";
    if (target.type === "none") return "대상 방어팀 정보가 없습니다.";

    for (let i = 0; i < 3; i++) {
      if (!String(slots[i]?.name || "").trim()) {
        return `공격 영웅 ${i + 1}번이 비어있습니다.`;
      }

      // ✅ 추가: 앞/뒤(포지션) 필수
      const pos = String(slots[i]?.build?.position || "");
      if (pos !== "front" && pos !== "back") {
        return `공격 영웅 ${i + 1}번의 앞/뒤(포지션)를 선택하세요.`;
      }
    }

    if (speedMode === "win") {
      const n = Number(speedMin);
      if (!Number.isFinite(n) || n <= 0) {
        return "속공 '이길 때'를 선택했다면 안전 기준 속공(숫자)을 입력해야 합니다.";
      }
    }
    return "";
  };

  const save = async () => {
    if (saveLockRef.current) return;
    saveLockRef.current = true;

    setErr("");
    const v = validate();
    if (v) {
      setErr(v);
      saveLockRef.current = false;
      return;
    }

    setSaving(true);
    try {
      // ✅ 대상 칼럼 3개를 항상 전부 넣고, 아닌 쪽은 null 강제
      const payload = {
        variant_idx: Number(variantIdx) || 0,

        post_id: target.type === "db" ? Number(target.post_id) : null,
        json_category: target.type === "json" ? String(target.json_category) : null,
        json_team_index: target.type === "json" ? Number(target.json_team_index) : null,

        // ✅ 진형 저장
        formation: String(formation || "").trim() || "기본진형",

        note: note || "",
        detail: detail || "",

        speed_mode: speedMode, // 'any'|'win'|'lose'
        speed_min: speedMode === "win" ? Number(speedMin) : null,

        skills: skills.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 3),
        pets: pets.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 3),

        created_by: me.id,
        anonymous: !!anonymous,
      };

      const { data: counterRow, error: cErr } = await supabase.from("guild_offense_counters").insert([payload]).select("id").single();
      if (cErr) throw cErr;

      const counterId = counterRow.id;

      const membersPayload = slots.slice(0, 3).map((x, i) => ({
        counter_id: counterId,
        slot: i + 1,
        hero_key: x.hero_key || "",
        hero_name: x.name || "",
        hero_image: x.image || "",
        build: x.build || {}, // ✅ build.position 포함됨
      }));

      const { error: mErr } = await supabase.from("guild_offense_counter_members").insert(membersPayload);

      if (mErr) {
        await supabase.from("guild_offense_counters").delete().eq("id", counterId);
        throw mErr;
      }

      navigate(-1);
    } catch (e) {
      setErr(e?.message || "저장 실패");
      saveLockRef.current = false; // 실패 시만 락 해제
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // ✅ UI
  // =========================
  const targetLabel = useMemo(() => {
    if (target.type === "db") return `DB 방어팀 #${target.post_id} · 패턴 #${(Number(variantIdx) || 0) + 1}`;
    if (target.type === "json")
      return `JSON 방어팀 · ${target.json_category} #${Number(target.json_team_index) + 1} · 패턴 #${(Number(variantIdx) || 0) + 1}`;
    return "대상 없음";
  }, [target, variantIdx]);

  const s = slots[activeSlot] || emptyHero();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        {/* 헤더 */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            className="h-28 lg:h-32 w-full"
            style={{
              background: "linear-gradient(135deg, rgba(244,63,94,0.14), rgba(99,102,241,0.16), rgba(251,191,36,0.12))",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-5 lg:px-8">
            <div className="min-w-0">
              <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-slate-900">카운터 추가</h1>
              <p className="mt-1 text-xs lg:text-sm font-semibold text-slate-700/70">
                공격팀 3명 + (앞/뒤) + 영웅별 장비 + 스킬(최대 3개) + 펫(최대 3개) + 속공조건
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                  <Shield size={14} strokeWidth={2.6} />
                  대상: {targetLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                  <Swords size={14} strokeWidth={2.6} />
                  {loadingMe ? "유저 확인중" : me ? "로그인됨" : "로그인 필요"}
                </span>
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
              <Link to="/" className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800">
                홈
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6">
          {err ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
              <div className="text-[13px] font-extrabold text-rose-700">오류</div>
              <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">{err}</div>
            </div>
          ) : null}

          {/* 저장 바 */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] font-extrabold text-slate-500">입력 후 저장</div>
                <div className="mt-1 text-[15px] font-black text-slate-900 truncate">카운터 등록</div>
              </div>

              <button
                type="button"
                onClick={save}
                disabled={saving || !me}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Plus size={16} strokeWidth={2.6} />
                {saving ? "저장중..." : "저장"}
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT */}
              <div className="lg:col-span-5 space-y-4">
                {/* 작성자 표시 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600 mb-2">작성자 표시</div>

                  <div className="inline-flex rounded-2xl border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setAnonymous(false)}
                      className={[
                        "px-4 py-2 text-[12px] font-extrabold transition",
                        !anonymous ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                      aria-pressed={!anonymous}
                    >
                      닉네임 표시
                    </button>

                    <button
                      type="button"
                      onClick={() => setAnonymous(true)}
                      className={[
                        "px-4 py-2 text-[12px] font-extrabold transition border-l border-slate-200",
                        anonymous ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                      aria-pressed={anonymous}
                    >
                      익명
                    </button>
                  </div>

                  <div className="mt-2 text-[12px] font-semibold text-slate-500">익명 선택 시 목록/상세에서 작성자 닉네임이 숨겨집니다.</div>
                </div>

                {/* 진형 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">진형</div>
                  <div className="mt-2">
                    <select
                      value={formation}
                      onChange={(e) => setFormation(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold"
                    >
                      {FORMATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} ({opt.desc})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-2 text-[12px] font-semibold text-slate-500">선택한 진형이 카운터에 저장됩니다.</div>
                </div>

                {/* 속공 조건 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">속공 조건</div>

                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {[
                      { key: "any", label: "무관" },
                      { key: "win", label: "속공 이길 때" },
                      { key: "lose", label: "속공 질 때" },
                    ].map((o) => {
                      const on = speedMode === o.key;
                      return (
                        <button
                          key={o.key}
                          type="button"
                          onClick={() => setSpeedMode(o.key)}
                          className={[
                            "rounded-2xl border px-4 py-3 text-left transition",
                            on ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <div className="text-[12px] font-black">{o.label}</div>
                          <div className={["mt-1 text-[12px] font-semibold", on ? "text-white/80" : "text-slate-500"].join(" ")}>
                            {o.key === "win" ? "속공을 “이기는” 상황에서만 유효" : o.key === "lose" ? "속공을 “지는” 상황에서도 가능" : "속공 조건 없이 적용"}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {speedMode === "win" ? (
                    <div className="mt-3">
                      <div className="text-[11px] font-extrabold text-slate-600">속공 이길 때 안전 기준 (몇 이상)</div>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={speedMin}
                        onChange={(e) => setSpeedMin(e.target.value)}
                        placeholder="예) 81"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                      />
                      <div className="mt-1 text-[12px] font-semibold text-slate-500">예) “81 이상이면 안전”</div>
                    </div>
                  ) : null}
                </div>

                {/* 메모 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">메모(선택)</div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="예) 카구라가 강자주시/속공순서 등"
                    className="mt-2 w-full min-h-[90px] rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
                  />
                </div>

                {/* 디테일 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">공격 디테일(선택)</div>
                  <textarea
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="예) 1턴에 누구 스킬 먼저, 반격 유도, 특정 타이밍 등"
                    className="mt-2 w-full min-h-[120px] rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
                  />
                </div>
              </div>

              {/* RIGHT */}
              <div className="lg:col-span-7 space-y-4">
                {/* 공격 영웅 3명 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">공격 영웅 3명</div>
                  <div className="mt-1 text-[12px] font-semibold text-slate-500">아래 카드 클릭 → 선택/장비 편집, “선택/변경”으로 영웅 변경</div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {slots.map((x, idx2) => {
                      const on = idx2 === activeSlot;
                      const pos = String(x?.build?.position || "");
                      const posLabel = pos === "front" ? "앞" : pos === "back" ? "뒤" : "미선택";

                      return (
                        <div
                          key={idx2}
                          onClick={() => setActiveSlot(idx2)}
                          className={[
                            "rounded-3xl border p-3 text-left transition cursor-pointer",
                            on ? "bg-white border-slate-900 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] font-extrabold text-slate-500">슬롯 {idx2 + 1}</div>
                            <div className={["text-[10px] font-extrabold", on ? "text-slate-900" : "text-slate-300"].join(" ")}>
                              {on ? "편집중" : ""}
                            </div>
                          </div>

                          <div className="mt-2 w-full aspect-square rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                            {x?.image ? (
                              <img src={heroImg(x.image)} alt={x.name || "hero"} className="w-full h-full object-contain" loading="lazy" />
                            ) : (
                              <div className="text-[12px] font-extrabold text-slate-400">선택</div>
                            )}
                          </div>

                          <div className="mt-2 text-[12px] font-black text-slate-900 truncate">{x?.name || "영웅 미선택"}</div>

                          {/* ✅ 앞/뒤 선택(저장됨: build.position) */}
                          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex w-full rounded-2xl border border-slate-200 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => updateBuild(idx2, { position: "front" })}
                                className={[
                                  "flex-1 px-2 py-2 text-[11px] font-extrabold transition",
                                  x?.build?.position === "front" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50",
                                ].join(" ")}
                              >
                                앞
                              </button>

                              <button
                                type="button"
                                onClick={() => updateBuild(idx2, { position: "back" })}
                                className={[
                                  "flex-1 px-2 py-2 text-[11px] font-extrabold transition border-l border-slate-200",
                                  x?.build?.position === "back" ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50",
                                ].join(" ")}
                              >
                                뒤
                              </button>
                            </div>

                            <div className="mt-1 text-[11px] font-semibold text-slate-500">
                              현재: <span className="font-extrabold text-slate-800">{posLabel}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPickerSlot(idx2);
                              setPickerOpen(true);
                            }}
                            className="mt-2 w-full rounded-xl px-2 py-2 text-[12px] font-extrabold bg-slate-900 text-white hover:bg-slate-800"
                          >
                            {x?.hero_key ? "변경" : "선택"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 장비 편집(활성 슬롯) */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">영웅 장비</div>
                  <div className="mt-1 text-[13px] font-black text-slate-900">
                    슬롯 {activeSlot + 1} · {s?.name || "영웅 미선택"}
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">세트</div>
                      <select
                        value={s.build?.set || ""}
                        onChange={(e) => updateBuild(activeSlot, { set: e.target.value })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white"
                      >
                        <option value="">선택</option>
                        {SET_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">속공(숫자)</div>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={Number.isFinite(s.build?.speed) ? s.build.speed : ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateBuild(activeSlot, { speed: v === "" ? null : Number(v) });
                        }}
                        placeholder="예) 81"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                      />
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">무기 메인옵 1</div>
                      <select
                        value={s.build?.weapon?.main1 || ""}
                        onChange={(e) => updateWeapon(activeSlot, "main1", e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white"
                      >
                        <option value="">선택</option>
                        {WEAPON_MAIN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">무기 메인옵 2</div>
                      <select
                        value={s.build?.weapon?.main2 || ""}
                        onChange={(e) => updateWeapon(activeSlot, "main2", e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white"
                      >
                        <option value="">선택</option>
                        {WEAPON_MAIN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">방어구 메인옵 1</div>
                      <select
                        value={s.build?.armor?.main1 || ""}
                        onChange={(e) => updateArmor(activeSlot, "main1", e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white"
                      >
                        <option value="">선택</option>
                        {ARMOR_MAIN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">방어구 메인옵 2</div>
                      <select
                        value={s.build?.armor?.main2 || ""}
                        onChange={(e) => updateArmor(activeSlot, "main2", e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white"
                      >
                        <option value="">선택</option>
                        {ARMOR_MAIN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">부옵(자유 텍스트)</div>
                      <input
                        value={s.build?.subOption || ""}
                        onChange={(e) => updateBuild(activeSlot, { subOption: e.target.value })}
                        placeholder="예) 약공80%/치확70%/모공4000"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                      />
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">메모</div>
                      <input
                        value={s.build?.note || ""}
                        onChange={(e) => updateBuild(activeSlot, { note: e.target.value })}
                        placeholder="자유 메모"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* 스킬 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">공격팀 스킬 (최대 3개)</div>
                  <div className="mt-1 text-[12px] font-semibold text-slate-500">아래에서 클릭하면 빈 칸부터 채워짐 (슬롯 클릭하면 제거)</div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {skills.map((s2, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSkillAt(i, "")}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-3 hover:bg-white transition text-left"
                        title="클릭하면 비우기"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] font-extrabold text-slate-500">{i + 1}번</div>
                          <X size={14} className="text-slate-300" />
                        </div>

                        <div className="mt-2 w-full h-16 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                          {s2 ? (
                            <img src={`/images/skills/${s2}`} alt={s2} className="w-full h-full object-contain" loading="lazy" />
                          ) : (
                            <div className="text-[12px] font-extrabold text-slate-400">비어있음</div>
                          )}
                        </div>

                        <div className="mt-2 text-[11px] font-semibold text-slate-500 truncate">{s2 || "-"}</div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12px] font-extrabold text-slate-700">스킬 선택</div>

                      <div className="relative w-[260px] max-w-full">
                        <input
                          value={skillQ}
                          onChange={(e) => setSkillQ(e.target.value)}
                          placeholder="검색: 루리 / luri2 ..."
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold"
                        />
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                          <Search size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 max-h-[340px] overflow-y-auto grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {filteredSkillImages.map((x) => {
                        const filename = filenameFromImagePath(x.image);
                        return (
                          <button
                            key={x.key}
                            type="button"
                            onClick={() => pickNextSkillSlot(filename)}
                            className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 p-2 text-left"
                            title={filename}
                          >
                            <img src={x.image} alt={x.name} className="w-full h-12 object-contain" loading="lazy" />
                            <div className="mt-1 text-[11px] font-extrabold text-slate-900 truncate">{x.name}</div>
                          </button>
                        );
                      })}

                      {!filteredSkillImages.length ? (
                        <div className="col-span-full text-[12px] font-semibold text-slate-500">검색 결과가 없습니다.</div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* 펫 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">펫 (최대 3개)</div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {pets.map((k) => {
                      const found = (Array.isArray(petImages) ? petImages : []).find((p) => p.key === k);
                      const img = found?.image ? found.image : `/images/pet/${k}`;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => togglePet(k)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-extrabold text-slate-700 hover:bg-slate-50"
                          title="클릭하면 제거"
                        >
                          <img src={img} alt={k} className="w-6 h-6 object-contain" />
                          {found?.name || k}
                          <span className="text-slate-400">✕</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <input
                      value={petQ}
                      onChange={(e) => setPetQ(e.target.value)}
                      placeholder="펫 검색"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                    />

                    <div className="mt-3 grid grid-cols-5 gap-2">
                      {filteredPets.slice(0, 30).map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => togglePet(p.key)}
                          className={[
                            "rounded-2xl border p-2 hover:bg-slate-50",
                            pets.includes(p.key) ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white",
                          ].join(" ")}
                          title={p.name || p.key}
                        >
                          <img src={p.image || `/images/pet/${p.key}`} alt={p.name || p.key} className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 영웅 선택 모달 */}
                {pickerOpen ? (
                  <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-3">
                    <div className="w-[94vw] max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <div className="text-[13px] font-black">영웅 선택</div>
                        <button type="button" onClick={() => setPickerOpen(false)} className="w-9 h-9 rounded-2xl hover:bg-slate-100">
                          ✕
                        </button>
                      </div>

                      <div className="p-4">
                        <input
                          value={heroQ}
                          onChange={(e) => setHeroQ(e.target.value)}
                          placeholder="영웅 검색"
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                        />

                        <div className="mt-4 grid grid-cols-4 md:grid-cols-6 gap-2 max-h-[55vh] overflow-auto">
                          {filteredHeroes.map((h) => (
                            <button
                              key={h.key}
                              type="button"
                              onClick={() => {
                                // ✅ 영웅 변경 시 build는 유지(앞/뒤 포함) — 원하면 defaultBuild()로 바꿔도 됨
                                updateSlot(pickerSlot, {
                                  hero_key: h.key || "",
                                  name: h.name || "",
                                  image: h.image || "",
                                  build: slots[pickerSlot]?.build || defaultBuild(),
                                });
                                setPickerOpen(false);
                              }}
                              className="rounded-2xl border border-slate-200 bg-white p-2 hover:bg-slate-50"
                              title={h.name}
                            >
                              <div className="w-full aspect-square rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                                <img src={heroImg(h.image)} alt={h.name} className="w-full h-full object-contain" />
                              </div>
                              <div className="mt-1 text-[11px] font-extrabold text-slate-700 truncate">{h.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="px-4 py-3 border-t border-slate-200 flex justify-end">
                        <button type="button" onClick={() => setPickerOpen(false)} className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white">
                          닫기
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
