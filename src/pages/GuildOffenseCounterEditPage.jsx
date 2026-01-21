// src/pages/GuildOffenseCounterEditPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, X, Swords, Shield, PawPrint, Save } from "lucide-react";

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
});

const emptyHero = () => ({ hero_key: "", name: "", image: "", build: defaultBuild() });

function filenameFromImagePath(p) {
  if (!p) return "";
  const s = String(p);
  const parts = s.split("/");
  return parts[parts.length - 1] || "";
}

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const heroImg = (src) => (src?.startsWith("/images/") ? src : `/images/heroes/${src || ""}`);

function normalizeBuild(raw) {
  const b = raw && typeof raw === "object" ? raw : {};
  return {
    set: String(b.set || ""),
    weapon: {
      main1: String(b.weapon?.main1 || ""),
      main2: String(b.weapon?.main2 || ""),
    },
    armor: {
      main1: String(b.armor?.main1 || ""),
      main2: String(b.armor?.main2 || ""),
    },
    subOption: String(b.subOption || ""),
    speed: Number.isFinite(b.speed) ? b.speed : b.speed === 0 ? 0 : null,
    note: String(b.note || ""),
  };
}

function normalizeHeroMember(m) {
  const mm = m || {};
  return {
    hero_key: String(mm.hero_key || ""),
    name: String(mm.hero_name || mm.name || ""),
    image: String(mm.hero_image || mm.image || ""),
    build: normalizeBuild(mm.build),
  };
}

export default function GuildOffenseCounterEditPage() {
  const navigate = useNavigate();
  const q = useQuery();

  const counterId = q.get("id") ? Number(q.get("id")) : null;

  // ------------------------------------------------------
  // ✅ 로그인
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // ✅ 원본 로드
  // ------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const [postId, setPostId] = useState(null);
  const [variantIdx, setVariantIdx] = useState(0);
  const [createdBy, setCreatedBy] = useState(null);

  // ------------------------------------------------------
  // ✅ 입력값
  // ------------------------------------------------------
  const [anonymous, setAnonymous] = useState(false);
  
  

  const [note, setNote] = useState("");
  const [detail, setDetail] = useState("");

  // ✅ 속공 조건
  const [speedMode, setSpeedMode] = useState("any");
  const [speedMin, setSpeedMin] = useState(""); // win일 때만 숫자

  // 공격 영웅 3명
  const [slots, setSlots] = useState([emptyHero(), emptyHero(), emptyHero()]);
  const [activeSlot, setActiveSlot] = useState(0);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState(0);

  // 공격 스킬 3개(파일명)
  const [skills, setSkills] = useState(["", "", ""]);
  const [skillQ, setSkillQ] = useState("");

  // 펫 (최대 3개)
  const [pets, setPets] = useState([]);
  const [petPickerOpen, setPetPickerOpen] = useState(false);
  const [petQ, setPetQ] = useState("");

  const canEdit = useMemo(() => {
    if (!me?.id) return false;
    if (!createdBy) return false;
    return String(me.id) === String(createdBy);
  }, [me?.id, createdBy]);

  // ✅ counter + members 로드
  useEffect(() => {
    const run = async () => {
      setLoadErr("");
      if (!counterId) {
        setLoadErr("수정 대상이 없습니다. (id 필요)");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: cRow, error: cErr } = await supabase
          .from("guild_offense_counters")
          .select(
            "id, post_id, variant_idx,  note, detail, skills, pets, speed_mode, speed_min, created_by, anonymous"
          )
          .eq("id", Number(counterId))
          .maybeSingle();

        if (cErr) throw cErr;
        if (!cRow?.id) throw new Error("카운터를 찾을 수 없습니다.");

        setPostId(Number(cRow.post_id));
        setVariantIdx(Number(cRow.variant_idx) || 0);
        setCreatedBy(cRow.created_by || null);

        setAnonymous(!!cRow.anonymous);
       
        setNote(String(cRow.note || ""));
        setDetail(String(cRow.detail || ""));

        const sm = String(cRow.speed_mode || "any");
        setSpeedMode(sm);
        setSpeedMin(sm === "win" && Number.isFinite(Number(cRow.speed_min)) ? String(Number(cRow.speed_min)) : "");

        const sk = Array.isArray(cRow.skills) ? cRow.skills : [];
        const sk3 = [sk[0] || "", sk[1] || "", sk[2] || ""].map((x) => String(x || "").trim());
        setSkills(sk3);

        const ps = Array.isArray(cRow.pets) ? cRow.pets : [];
        setPets(ps.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 3));

        const { data: members, error: mErr } = await supabase
          .from("guild_offense_counter_members")
          .select("counter_id, slot, hero_key, hero_name, hero_image, build")
          .eq("counter_id", Number(counterId))
          .order("slot", { ascending: true });

        if (mErr) throw mErr;

        const ms = Array.isArray(members) ? members : [];
        const s1 = ms.find((x) => Number(x.slot) === 1);
        const s2 = ms.find((x) => Number(x.slot) === 2);
        const s3 = ms.find((x) => Number(x.slot) === 3);

        setSlots([
          s1 ? normalizeHeroMember(s1) : emptyHero(),
          s2 ? normalizeHeroMember(s2) : emptyHero(),
          s3 ? normalizeHeroMember(s3) : emptyHero(),
        ]);
      } catch (e) {
        setLoadErr(e?.message || "로드 실패");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [counterId]);

  // ------------------------------------------------------
  // ✅ 필터
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // ✅ 조작 함수
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // ✅ 검증 / 저장
  // ------------------------------------------------------
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const validate = () => {
    if (!me?.id) return "로그인이 필요합니다.";
    if (!counterId) return "수정 대상이 없습니다. (id 필요)";
    if (!Number.isFinite(postId) || postId === null) return "대상 방어팀 정보가 없습니다. (post_id 없음)";
    if (!canEdit) return "작성자만 수정할 수 있습니다.";

    for (let i = 0; i < 3; i++) {
      if (!String(slots[i]?.name || "").trim()) return `공격 영웅 ${i + 1}번이 비어있습니다.`;
    }

    if (speedMode === "win") {
      const n = Number(speedMin);
      if (!Number.isFinite(n) || n <= 0) return "속공 '이길 때'를 선택했다면 안전 기준 속공(숫자)을 입력해야 합니다.";
    }
    return "";
  };

  const save = async () => {
    setErr("");
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setSaving(true);
    try {
      const payload = {
       
        note: note || "",
        detail: detail || "",
        speed_mode: speedMode,
        speed_min: speedMode === "win" ? Number(speedMin) : null,
        skills: skills.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 3),
        pets: pets.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 3),
        anonymous: !!anonymous,
      };

      const { error: upErr } = await supabase
        .from("guild_offense_counters")
        .update(payload)
        .eq("id", Number(counterId));

      if (upErr) throw upErr;

      // ✅ members upsert (slot 1~3)
      const membersPayload = slots.slice(0, 3).map((x, i) => ({
        counter_id: Number(counterId),
        slot: i + 1,
        hero_key: x.hero_key || "",
        hero_name: x.name || "",
        hero_image: x.image || "",
        build: x.build || {},
      }));

      // upsert 키가 (counter_id, slot) 유니크여야 깔끔함
      // 만약 유니크 없으면 "delete 후 insert"로 바꿔야 함.
      const { error: mErr } = await supabase
        .from("guild_offense_counter_members")
        .upsert(membersPayload, { onConflict: "counter_id,slot" });

      if (mErr) throw mErr;

      navigate(-1);
    } catch (e) {
      setErr(e?.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------
  // ✅ UI
  // ------------------------------------------------------
  const targetLabel = useMemo(() => {
    if (Number.isFinite(postId) && postId !== null)
      return `DB 방어팀 #${postId} · 패턴 #${(Number(variantIdx) || 0) + 1}`;
    return "대상 없음";
  }, [postId, variantIdx]);

  const s = slots[activeSlot] || emptyHero();

  // 로딩/에러 화면
  if (loading || loadingMe) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-[15px] font-black text-slate-900">불러오는 중...</div>
            <div className="mt-2 text-[12px] font-semibold text-slate-500">잠시만</div>
          </div>
        </div>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
            <div className="text-[15px] font-black text-rose-700">로드 오류</div>
            <div className="mt-2 text-[12px] font-semibold text-rose-700/90 break-all">{loadErr}</div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-xl px-4 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
              >
                ← 뒤로
              </button>
              <Link
                to="/"
                className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
              >
                홈
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                카운터 수정
              </h1>
              <p className="mt-1 text-xs lg:text-sm font-semibold text-slate-700/70">
                공격팀 3명 + 영웅별 장비 + 스킬(최대 3개) + 펫(최대 3개) + 속공조건
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                  <Shield size={14} strokeWidth={2.6} />
                  대상: {targetLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                  <Swords size={14} strokeWidth={2.6} />
                  카운터ID: {counterId ?? "-"}
                </span>

                {!canEdit ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[12px] font-extrabold text-rose-700">
                    작성자만 수정 가능
                  </span>
                ) : null}
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
              <Link
                to="/"
                className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
              >
                홈
              </Link>
            </div>
          </div>
        </div>

        {/* 본문 */}
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
                <div className="text-[12px] font-extrabold text-slate-500">수정 후 저장</div>
                <div className="mt-1 text-[15px] font-black text-slate-900 truncate">
                  카운터 수정
                </div>
              </div>

              <button
                type="button"
                onClick={save}
                disabled={saving || !me || !canEdit}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Save size={16} strokeWidth={2.6} />
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
                      disabled={!canEdit}
                      onClick={() => setAnonymous(false)}
                      className={[
                        "px-4 py-2 text-[12px] font-extrabold transition",
                        !anonymous ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50",
                        !canEdit ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                      aria-pressed={!anonymous}
                    >
                      닉네임 표시
                    </button>

                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setAnonymous(true)}
                      className={[
                        "px-4 py-2 text-[12px] font-extrabold transition border-l border-slate-200",
                        anonymous ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50",
                        !canEdit ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                      aria-pressed={anonymous}
                    >
                      익명
                    </button>
                  </div>

                  <div className="mt-2 text-[12px] font-semibold text-slate-500">
                    익명 선택 시 목록/상세에서 작성자 닉네임이 숨겨집니다.
                  </div>
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
                          disabled={!canEdit}
                          onClick={() => setSpeedMode(o.key)}
                          className={[
                            "rounded-2xl border px-4 py-3 text-left transition",
                            on ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
                            !canEdit ? "opacity-60 cursor-not-allowed" : "",
                          ].join(" ")}
                        >
                          <div className="text-[12px] font-black">{o.label}</div>
                          {o.key === "win" ? (
                            <div className={`mt-1 text-[12px] font-semibold ${on ? "text-white/80" : "text-slate-500"}`}>
                              속공을 “이기는” 상황에서만 유효한 카운터
                            </div>
                          ) : o.key === "lose" ? (
                            <div className={`mt-1 text-[12px] font-semibold ${on ? "text-white/80" : "text-slate-500"}`}>
                              속공을 “지는” 상황에서도 가능한 카운터
                            </div>
                          ) : (
                            <div className={`mt-1 text-[12px] font-semibold ${on ? "text-white/80" : "text-slate-500"}`}>
                              속공 조건 없이 적용
                            </div>
                          )}
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
                        disabled={!canEdit}
                        onChange={(e) => setSpeedMin(e.target.value)}
                        placeholder="예) 81"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold disabled:opacity-60"
                      />
                      <div className="mt-1 text-[12px] font-semibold text-slate-500">
                        예) “81 이상이면 안전” 같은 기준을 적어두면 됨.
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 메모 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">메모(선택)</div>
                  <textarea
                    value={note}
                    disabled={!canEdit}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="예) 카구라가 강자주시/속공순서 등"
                    className="mt-2 w-full min-h-[90px] rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold disabled:opacity-60"
                  />
                </div>

                {/* 디테일 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">공격 디테일(선택)</div>
                  <textarea
                    value={detail}
                    disabled={!canEdit}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="예) 1턴에 누구 스킬 먼저, 반격 유도, 특정 타이밍 등"
                    className="mt-2 w-full min-h-[120px] rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold disabled:opacity-60"
                  />
                </div>
              </div>

              {/* RIGHT */}
              <div className="lg:col-span-7 space-y-4">
                {/* 공격 영웅 3명 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">공격 영웅 3명</div>
                  <div className="mt-1 text-[12px] font-semibold text-slate-500">
                    아래 카드 클릭 → 선택/장비 편집, “선택/변경”으로 영웅 변경
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {slots.map((x, idx2) => {
                      const on = idx2 === activeSlot;
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
                            <div className={`text-[10px] font-extrabold ${on ? "text-slate-900" : "text-slate-300"}`}>
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

                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPickerSlot(idx2);
                              setPickerOpen(true);
                            }}
                            className={[
                              "mt-2 w-full rounded-xl px-2 py-2 text-[12px] font-extrabold",
                              canEdit ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-500 cursor-not-allowed",
                            ].join(" ")}
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
                        disabled={!canEdit}
                        onChange={(e) => updateBuild(activeSlot, { set: e.target.value })}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white disabled:opacity-60"
                      >
                        <option value="">선택</option>
                        {SET_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">속공(숫자)</div>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={Number.isFinite(s.build?.speed) ? s.build.speed : ""}
                        disabled={!canEdit}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateBuild(activeSlot, { speed: v === "" ? null : Number(v) });
                        }}
                        placeholder="예) 81"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">무기 메인옵 1</div>
                      <select
                        value={s.build?.weapon?.main1 || ""}
                        disabled={!canEdit}
                        onChange={(e) => updateWeapon(activeSlot, "main1", e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white disabled:opacity-60"
                      >
                        <option value="">선택</option>
                        {WEAPON_MAIN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">무기 메인옵 2</div>
                      <select
                        value={s.build?.weapon?.main2 || ""}
                        disabled={!canEdit}
                        onChange={(e) => updateWeapon(activeSlot, "main2", e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white disabled:opacity-60"
                      >
                        <option value="">선택</option>
                        {WEAPON_MAIN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">방어구 메인옵 1</div>
                      <select
                        value={s.build?.armor?.main1 || ""}
                        disabled={!canEdit}
                        onChange={(e) => updateArmor(activeSlot, "main1", e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white disabled:opacity-60"
                      >
                        <option value="">선택</option>
                        {ARMOR_MAIN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">방어구 메인옵 2</div>
                      <select
                        value={s.build?.armor?.main2 || ""}
                        disabled={!canEdit}
                        onChange={(e) => updateArmor(activeSlot, "main2", e.target.value)}
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white disabled:opacity-60"
                      >
                        <option value="">선택</option>
                        {ARMOR_MAIN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">부옵(자유 텍스트)</div>
                      <input
                        value={s.build?.subOption || ""}
                        disabled={!canEdit}
                        onChange={(e) => updateBuild(activeSlot, { subOption: e.target.value })}
                        placeholder="예) 약공80%/치확70%/모공4000"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <div className="text-[11px] font-extrabold text-slate-600">메모</div>
                      <input
                        value={s.build?.note || ""}
                        disabled={!canEdit}
                        onChange={(e) => updateBuild(activeSlot, { note: e.target.value })}
                        placeholder="자유 메모"
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {/* 스킬 3개 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">공격팀 스킬 (최대 3개)</div>
                  <div className="mt-1 text-[12px] font-semibold text-slate-500">
                    아래에서 클릭하면 빈 칸부터 채워짐 (슬롯 클릭하면 제거)
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {skills.map((s2, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => setSkillAt(i, "")}
                        className={[
                          "rounded-3xl border border-slate-200 bg-slate-50 p-3 hover:bg-white transition text-left",
                          !canEdit ? "opacity-60 cursor-not-allowed" : "",
                        ].join(" ")}
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

                  {/* 스킬 검색 */}
                  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12px] font-extrabold text-slate-700">스킬 선택</div>
                      <div className="relative w-[260px] max-w-full">
                        <input
                          value={skillQ}
                          disabled={!canEdit}
                          onChange={(e) => setSkillQ(e.target.value)}
                          placeholder="검색: 루리 / luri2 ..."
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold disabled:opacity-60"
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
                            disabled={!canEdit}
                            onClick={() => pickNextSkillSlot(filename)}
                            className={[
                              "rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 p-2 text-left",
                              !canEdit ? "opacity-60 cursor-not-allowed" : "",
                            ].join(" ")}
                            title={filename}
                          >
                            <img src={x.image} alt={x.name} className="w-full h-12 object-contain" loading="lazy" />
                            <div className="mt-1 text-[11px] font-extrabold text-slate-900 truncate">{x.name}</div>
                          </button>
                        );
                      })}

                      {!filteredSkillImages.length ? (
                        <div className="col-span-full text-[12px] font-semibold text-slate-500">
                          검색 결과가 없습니다.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* 펫 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] font-extrabold text-slate-600">펫 (최대 3개)</div>
                      <div className="mt-1 text-[12px] font-semibold text-slate-500">
                        선택/해제 가능 (3개 초과 시 오래된 것 교체)
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setPetPickerOpen(true)}
                      className={[
                        "shrink-0 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-extrabold",
                        canEdit ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-500 cursor-not-allowed",
                      ].join(" ")}
                    >
                      <PawPrint size={16} />
                      펫 선택
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {pets.length ? (
                      pets.map((k) => {
                        const p = (Array.isArray(petImages) ? petImages : []).find((x) => x.key === k);
                        return (
                          <button
                            key={k}
                            type="button"
                            disabled={!canEdit}
                            onClick={() => togglePet(k)}
                            className={[
                              "inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white px-3 py-2",
                              !canEdit ? "opacity-60 cursor-not-allowed" : "",
                            ].join(" ")}
                            title="클릭하면 제거"
                          >
                            <div className="w-9 h-9 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                              {p?.image ? (
                                <img src={p.image} alt={p.name || k} className="w-full h-full object-contain" loading="lazy" />
                              ) : (
                                <div className="text-[11px] font-black text-slate-400">-</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[12px] font-black text-slate-900">{p?.name || k}</div>
                              <div className="text-[11px] font-semibold text-slate-500">{k}</div>
                            </div>
                            <span className="ml-1 text-[11px] font-extrabold text-slate-400">제거 ✕</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-[12px] font-semibold text-slate-400">(미선택) “펫 선택”을 눌러 추가하세요.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 영웅 선택 모달 */}
      {pickerOpen ? (
        <HeroPickerModal
          heroesList={heroesList}
          heroImg={heroImg}
          onClose={() => setPickerOpen(false)}
          onPick={(hero) => {
            updateSlot(pickerSlot, {
              hero_key: hero.key || "",
              name: hero.name || "",
              image: hero.image || "",
              build: defaultBuild(), // ✅ 영웅 바꾸면 장비 초기화 (원하면 유지로 바꿔줌)
            });
            setActiveSlot(pickerSlot);
            setPickerOpen(false);
          }}
        />
      ) : null}

      {/* 펫 선택 모달 */}
      {petPickerOpen ? (
        <PetPickerModal
          pets={filteredPets}
          selected={pets}
          q={petQ}
          setQ={setPetQ}
          onClose={() => setPetPickerOpen(false)}
          onToggle={(k) => togglePet(k)}
        />
      ) : null}
    </div>
  );
}

function HeroPickerModal({ heroesList, heroImg, onClose, onPick }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = (q || "").trim().toLowerCase();
    const list = Array.isArray(heroesList) ? heroesList : [];
    if (!query) return list;
    return list.filter((h) => {
      const n = String(h.name || "").toLowerCase();
      const k = String(h.key || "").toLowerCase();
      return n.includes(query) || k.includes(query);
    });
  }, [q, heroesList]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200">
          <div>
            <div className="font-black text-slate-900">영웅 선택</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-500">한글 이름 또는 key로 검색</div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition"
            aria-label="닫기"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="예: 에반 / 루리 / 미호 ..."
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
          />

          <div className="mt-3 max-h-[60vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-2">
            {filtered.map((h) => (
              <button
                key={h.key}
                type="button"
                onClick={() => onPick(h)}
                className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 p-3 text-left"
              >
                <img src={heroImg(h.image)} alt={h.name} className="w-full h-16 object-contain" loading="lazy" />
                <div className="mt-2 text-[12px] font-extrabold text-slate-900 truncate">{h.name}</div>
                <div className="text-[11px] font-semibold text-slate-500 truncate">{h.key}</div>
              </button>
            ))}
          </div>

          {!filtered.length ? (
            <div className="mt-4 text-[12px] font-semibold text-slate-500">검색 결과가 없습니다.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PetPickerModal({ pets, selected, q, setQ, onClose, onToggle }) {
  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200">
          <div>
            <div className="font-black text-slate-900">펫 선택 (최대 3개)</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-500">선택/해제 가능 (3개 초과 시 자동 교체)</div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition"
            aria-label="닫기"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[12px] font-extrabold text-slate-700">
              현재 선택: {Array.isArray(selected) ? selected.length : 0}/3
            </div>
            <div className="relative w-[260px] max-w-full">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="검색: 델로 / ru ..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold"
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                <Search size={16} />
              </div>
            </div>
          </div>

          <div className="mt-3 max-h-[60vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Array.isArray(pets) ? pets : []).map((p) => {
              const on = Array.isArray(selected) ? selected.includes(p.key) : false;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onToggle(p.key)}
                  className={[
                    "rounded-2xl border p-3 text-left transition",
                    on ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="w-full h-16 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                    <img src={p.image} alt={p.name} className="w-full h-full object-contain" loading="lazy" />
                  </div>
                  <div className="mt-2 text-[12px] font-extrabold truncate">{p.name}</div>
                  <div className={`text-[11px] font-semibold truncate ${on ? "text-white/80" : "text-slate-500"}`}>
                    {p.key}
                  </div>
                  <div className={`mt-2 text-[11px] font-extrabold ${on ? "text-white/80" : "text-slate-400"}`}>
                    {on ? "선택됨 ✓" : "탭해서 선택"}
                  </div>
                </button>
              );
            })}

            {!Array.isArray(pets) || pets.length === 0 ? (
              <div className="col-span-full text-[12px] font-semibold text-slate-500">검색 결과가 없습니다.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
