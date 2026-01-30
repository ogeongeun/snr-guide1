// src/pages/GuildDefenseKingCreatePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Crown, Shield, Search, X, Save, Trash2 } from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import heroesList from "../data/heroes.json";
import skillImages from "../data/skillImages.json";
import petImages from "../data/petImages.json"; // ✅ 추가

// ✅ 테이블명만 네 DB에 맞게
const DEFENSE_KING_TABLE = "guild_defense_king_entries";

const heroImg = (src) =>
  src?.startsWith("/images/") ? src : `/images/heroes/${src || ""}`;

function filenameFromImagePath(p) {
  if (!p) return "";
  const s = String(p);
  const parts = s.split("/");
  return parts[parts.length - 1] || "";
}

// =========================
// 반지/세공 옵션 (DefenseEditPage랑 동일)
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
const ENGRAVE_OPTIONS = [...RING_OPTIONS];
const ringImg = (key) => `/images/ring/${key}.png`;
const engraveImg = (key) => `/images/ring/${key}.png`;

// =========================
// 장비 옵션
// =========================
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

const emptyHeroSlot = () => ({
  hero_key: "",
  name: "",
  image: "",
  ring_key: null,
  engrave_key: null,
  build: defaultBuild(),
});

function normalizeBuild(b) {
  if (!b || typeof b !== "object") return defaultBuild();
  return {
    set: b.set ?? "",
    weapon: {
      main1: b.weapon?.main1 ?? "",
      main2: b.weapon?.main2 ?? "",
    },
    armor: {
      main1: b.armor?.main1 ?? "",
      main2: b.armor?.main2 ?? "",
    },
    subOption: b.subOption ?? "",
    speed:
      b.speed === null || b.speed === undefined || b.speed === ""
        ? null
        : Number(b.speed),
    note: b.note ?? "",
  };
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
            <div className="text-[16px] font-black text-slate-900">선택</div>
          </div>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-[12px] font-extrabold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
            type="button"
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
                  type="button"
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

function HeroPickerModal({ open, onClose, onPick }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const qq = (q || "").trim().toLowerCase();
    const list = Array.isArray(heroesList) ? heroesList : [];
    if (!qq) return list;
    return list.filter((h) => {
      const k = String(h.key || "").toLowerCase();
      const n = String(h.name || "").toLowerCase();
      return k.includes(qq) || n.includes(qq);
    });
  }, [q]);

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
            type="button"
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
                  onClick={() => onPick(h)}
                  className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:ring-2 hover:ring-slate-200 p-2 text-left transition"
                  title={h.name}
                  type="button"
                >
                  <div className="aspect-square rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                    <img
                      src={heroImg(h.image)}
                      alt={h.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

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

// =========================
// ✅ 펫 선택 모달
// petImages.json 형식 가정: [{ key, name, image }, ...]
// image가 없으면 /images/pets/{key}.png 로 대체
// =========================
const petImg = (p) => {
  const s = String(p || "");
  if (!s) return "";
  if (s.startsWith("/images/")) return s;
  if (s.includes("/")) return s; // 혹시 상대경로/URL 형태면 그대로
  return `/images/pets/${s}`;
};
function normalizePetList(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((x) => {
      const key = String(x?.key ?? "").trim();
      const name = String(x?.name ?? key).trim();
      const image = x?.image ? String(x.image) : "";
      if (!key) return null;
      return { key, name, image };
    })
    .filter(Boolean);
}
function PetPickerModal({ open, onClose, onPick }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) return;
    setQ("");
  }, [open]);

  const list = useMemo(() => normalizePetList(petImages), []);
  const filtered = useMemo(() => {
    const qq = (q || "").trim().toLowerCase();
    if (!qq) return list;
    return list.filter((p) => {
      const k = String(p.key || "").toLowerCase();
      const n = String(p.name || "").toLowerCase();
      return k.includes(qq) || n.includes(qq);
    });
  }, [q, list]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-end lg:items-center justify-center p-3">
      <div className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-extrabold text-slate-500">펫 선택</div>
            <div className="text-[16px] font-black text-slate-900">펫을 선택하세요</div>
          </div>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-[12px] font-extrabold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
            type="button"
          >
            닫기
          </button>
        </div>

        <div className="p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색 (펫명/키)"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-200"
          />

          <div className="mt-3 max-h-[60vh] overflow-auto rounded-2xl border border-slate-200">
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2">
              {filtered.map((p) => (
                <button
                  key={p.key}
                  onClick={() => onPick(p)}
                  className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:ring-2 hover:ring-slate-200 p-2 text-left transition"
                  title={p.name}
                  type="button"
                >
                  <div className="aspect-square rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                    <img
                      src={petImg(p.image || p.key)}
                      alt={p.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>

                  <div className="mt-1 text-[11px] font-extrabold text-slate-800 truncate">
                    {p.name}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 truncate">{p.key}</div>
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

export default function GuildDefenseKingCreatePage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const editId = (() => {
    const n = Number(sp.get("id"));
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const isEdit = !!editId;

  // 로그인/길드
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [guild, setGuild] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  // ✅ 누구 방어팀인지(닉네임)
  const [nickname, setNickname] = useState("");

  // 방어 횟수/메모
  const [defenseCount, setDefenseCount] = useState("");
  const [note, setNote] = useState("");

  // ✅ 펫(1개)
  const [pet, setPet] = useState({ key: "", name: "", image: "" });
  const [petPickOpen, setPetPickOpen] = useState(false);

  // 세팅
  const [slots, setSlots] = useState([emptyHeroSlot(), emptyHeroSlot(), emptyHeroSlot()]);
  const [activeSlot, setActiveSlot] = useState(0);

  // 스킬(최대 3개)
  const [skills, setSkills] = useState(["", "", ""]);
  const [skillQ, setSkillQ] = useState("");

  // picker
  const [heroPickOpen, setHeroPickOpen] = useState(false);
  const [ringPickOpen, setRingPickOpen] = useState(false);
  const [engravePickOpen, setEngravePickOpen] = useState(false);
  const [pickSlotIdx, setPickSlotIdx] = useState(0);

  // 저장
  const [saving, setSaving] = useState(false);
  const saveLockRef = useRef(false);

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

        // 내 길드 1개
        const { data: memRows, error: memErr } = await supabase
          .from("guild_members")
          .select("guild_id, created_at")
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
          .select("id,name")
          .eq("id", mem.guild_id)
          .limit(1);

        if (gErr) throw gErr;
        const g = (gRows ?? [])[0] ?? null;
        setGuild(g);

        // ✅ 수정모드: 기존 데이터 로드해서 폼 채우기
        if (editId) {
          const { data: row, error: rErr } = await supabase
            .from(DEFENSE_KING_TABLE)
            .select("id,nickname,defense_count,note,team,skills,equipment,guild_id,pet") // ✅ pet 추가
            .eq("id", editId)
            .maybeSingle();

          if (rErr) throw rErr;
          if (!row?.id) throw new Error("수정할 데이터를 찾을 수 없습니다.");

          // (선택) 다른 길드 데이터면 차단하고 싶으면 여기서 체크
          if (row.guild_id && g?.id && row.guild_id !== g.id) {
            throw new Error("다른 길드 데이터는 수정할 수 없습니다.");
          }

          setNickname(row.nickname || "");
          setDefenseCount(String(row.defense_count ?? ""));
          setNote(row.note || "");

          // ✅ 펫 로드
          const rp = row?.pet && typeof row.pet === "object" ? row.pet : null;
          setPet({
            key: rp?.key ? String(rp.key) : "",
            name: rp?.name ? String(rp.name) : "",
            image: rp?.image ? String(rp.image) : "",
          });

          const teamArr = Array.isArray(row.team) ? row.team : [];
          const equipArr = Array.isArray(row.equipment) ? row.equipment : [];
          const sk = Array.isArray(row.skills) ? row.skills : [];

          const nextSlots = [0, 1, 2].map((i) => {
            const t = teamArr[i] || {};
            const b = equipArr[i] || defaultBuild();
            return {
              hero_key: t.hero_key || "",
              name: t.name || "",
              image: t.image || "",
              ring_key: t.ring_key ?? null,
              engrave_key: t.engrave_key ?? null,
              build: normalizeBuild(b),
            };
          });

          setSlots(nextSlots);
          setSkills([sk[0] || "", sk[1] || "", sk[2] || ""]);
        }
      } catch (e) {
        setErrMsg(e?.message ? String(e.message) : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, editId]);

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

  const validate = () => {
    if (!me?.id) return "로그인이 필요합니다.";
    if (!guild?.id) return "길드 정보를 찾을 수 없습니다.";

    if (!String(nickname || "").trim()) return "닉네임(누구 방어팀인지)을 입력하세요.";

    const dc = Number(defenseCount);
    if (!Number.isFinite(dc) || dc <= 0) return "방어 횟수는 1 이상 숫자여야 합니다.";

    for (let i = 0; i < 3; i++) {
      if (!String(slots[i]?.hero_key || "").trim()) return `영웅 ${i + 1}번이 비어있습니다.`;
    }
    // ✅ 펫은 선택사항이면 검증 안함 (필수로 하고싶으면 여기서 체크)
    return "";
  };

  const buildPayload = () => ({
    guild_id: guild.id,
    user_id: me.id,
    season_key: null,
    title: "",
    nickname: String(nickname).trim(),
    defense_count: Number(defenseCount),
    note: note || "",
    // ✅ 펫 저장(1개)
    pet: pet?.key
      ? { key: pet.key, name: pet.name || "", image: pet.image || "" }
      : null,
    team: slots.map((s) => ({
      hero_key: s.hero_key || "",
      name: s.name || "",
      image: s.image || "",
      ring_key: s.ring_key || null,
      engrave_key: s.engrave_key || null,
    })),
    skills: skills.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 3),
    equipment: slots.map((s) => (s.build ? normalizeBuild(s.build) : defaultBuild())),
    ring: null,
    engrave: null,
  });

  const save = async () => {
    if (saveLockRef.current) return;
    saveLockRef.current = true;

    const v = validate();
    if (v) {
      setErrMsg(v);
      saveLockRef.current = false;
      return;
    }

    setSaving(true);
    setErrMsg("");

    try {
      const payload = buildPayload();

      if (isEdit) {
        const { error } = await supabase
          .from(DEFENSE_KING_TABLE)
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(DEFENSE_KING_TABLE).insert([payload]);
        if (error) throw error;
      }

      navigate(-1);
    } catch (e) {
      setErrMsg(e?.message || "저장 실패");
      saveLockRef.current = false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!isEdit) return;
    const ok = window.confirm("정말 삭제할까요?");
    if (!ok) return;

    setSaving(true);
    setErrMsg("");
    try {
      const { error } = await supabase.from(DEFENSE_KING_TABLE).delete().eq("id", editId);
      if (error) throw error;
      navigate(-1);
    } catch (e) {
      setErrMsg(e?.message || "삭제 실패");
    } finally {
      setSaving(false);
    }
  };

  const s = slots[activeSlot] || emptyHeroSlot();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        {/* 헤더 */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            className="h-28 lg:h-32 w-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(251,191,36,0.16), rgba(99,102,241,0.16), rgba(16,185,129,0.12))",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-5 lg:px-8">
            <div className="min-w-0">
              <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-slate-900">
                {isEdit ? "방어왕 수정" : "방어왕 추가"}
              </h1>
              <p className="mt-1 text-xs lg:text-sm font-semibold text-slate-700/70">
                닉네임 + 방어횟수 + 세팅(장비/반지/세공/스킬/펫)
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                  <Crown size={14} strokeWidth={2.6} />
                  {loading ? "불러오는중" : guild?.name || "(길드 없음)"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                  <Shield size={14} strokeWidth={2.6} />
                  {me ? "로그인됨" : "로그인 필요"}
                </span>
                {isEdit ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                    ID: {editId}
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

        {/* 에러/로딩 */}
        {loading ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm p-5 text-sm font-semibold text-slate-600">
            불러오는중...
          </div>
        ) : errMsg ? (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-5">
            <div className="text-[13px] font-extrabold text-rose-700">오류</div>
            <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">
              {errMsg}
            </div>
          </div>
        ) : null}

        {/* 저장바 */}
        <div className="mt-6 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[12px] font-extrabold text-slate-500">
                {isEdit ? "수정 후 저장" : "입력 후 저장"}
              </div>
              <div className="mt-1 text-[15px] font-black text-slate-900 truncate">
                {isEdit ? "방어왕 수정" : "방어왕 등록"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEdit ? (
                <button
                  type="button"
                  onClick={remove}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  <Trash2 size={16} strokeWidth={2.6} />
                  삭제
                </button>
              ) : null}

              <button
                type="button"
                onClick={save}
                disabled={saving || !me || !guild}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
              >
                <Save size={16} strokeWidth={2.6} />
                {saving ? "저장중..." : "저장"}
              </button>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-[12px] font-extrabold text-slate-600">
                  닉네임 (누구 방어팀인지)
                </div>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="예) 건근본 / 홍길동"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
                />
                <div className="mt-3 text-[12px] font-extrabold text-slate-600">방어 횟수</div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={defenseCount}
                  onChange={(e) => setDefenseCount(e.target.value)}
                  placeholder="예) 27"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
                />
              </div>

              {/* ✅ 펫 */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-[12px] font-extrabold text-slate-600">펫 (선택)</div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                    {pet?.key ? (
                      <img
                        src={petImg(pet.image || pet.key)}
                        alt={pet.name || pet.key}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-[11px] font-extrabold text-slate-400">없음</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-black text-slate-900 truncate">
                      {pet?.name || (pet?.key ? pet.key : "펫 미선택")}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 truncate">
                      {pet?.key || "-"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPetPickOpen(true)}
                      className="rounded-xl px-3 py-2 text-[12px] font-extrabold bg-slate-900 text-white hover:bg-slate-800"
                    >
                      {pet?.key ? "변경" : "선택"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPet({ key: "", name: "", image: "" })}
                      className="rounded-xl px-3 py-2 text-[12px] font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50"
                      disabled={!pet?.key}
                      title="펫 비우기"
                    >
                      제거
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-[12px] font-extrabold text-slate-600">메모(선택)</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="예) 방어 핵심 포인트 / 카운터 주의점 등"
                  className="mt-2 w-full min-h-[120px] rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
                />
              </div>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-7 space-y-4">
              {/* 영웅 3명 */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-[12px] font-extrabold text-slate-600">대표 세팅 영웅 3명</div>
                <div className="mt-1 text-[12px] font-semibold text-slate-500">
                  카드 클릭 = 편집 슬롯 선택 / “선택/변경”으로 영웅 선택
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  {slots.map((x, idx) => {
                    const on = idx === activeSlot;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveSlot(idx)}
                        className={[
                          "rounded-3xl border p-3 text-left transition cursor-pointer",
                          on
                            ? "bg-white border-slate-900 shadow-sm"
                            : "bg-white border-slate-200 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] font-extrabold text-slate-500">
                            슬롯 {idx + 1}
                          </div>
                          <div
                            className={[
                              "text-[10px] font-extrabold",
                              on ? "text-slate-900" : "text-slate-300",
                            ].join(" ")}
                          >
                            {on ? "편집중" : ""}
                          </div>
                        </div>

                        <div className="mt-2 w-full aspect-square rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                          {x?.image ? (
                            <img
                              src={heroImg(x.image)}
                              alt={x.name || "hero"}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <div className="text-[12px] font-extrabold text-slate-400">선택</div>
                          )}
                        </div>

                        <div className="mt-2 text-[12px] font-black text-slate-900 truncate">
                          {x?.name || "영웅 미선택"}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickSlotIdx(idx);
                            setHeroPickOpen(true);
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

              {/* 반지/세공 */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-[12px] font-extrabold text-slate-600">반지 / 세공</div>
                <div className="mt-1 text-[13px] font-black text-slate-900">
                  슬롯 {activeSlot + 1} · {s?.name || "영웅 미선택"}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!s?.hero_key}
                    onClick={() => setRingPickOpen(true)}
                    className={[
                      "rounded-2xl border px-4 py-3 text-left transition flex items-center gap-3",
                      s?.hero_key
                        ? "bg-white border-slate-200 hover:bg-slate-50"
                        : "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed",
                    ].join(" ")}
                  >
                    <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {s?.ring_key ? (
                        <img
                          src={ringImg(s.ring_key)}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-[11px] font-extrabold text-slate-400">반지</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-extrabold text-slate-700">반지</div>
                      <div className="text-[12px] font-semibold text-slate-500 truncate">
                        {s?.ring_key || "없음"}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!s?.hero_key}
                    onClick={() => setEngravePickOpen(true)}
                    className={[
                      "rounded-2xl border px-4 py-3 text-left transition flex items-center gap-3",
                      s?.hero_key
                        ? "bg-white border-slate-200 hover:bg-slate-50"
                        : "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed",
                    ].join(" ")}
                  >
                    <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {s?.engrave_key ? (
                        <img
                          src={engraveImg(s.engrave_key)}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-[11px] font-extrabold text-slate-400">세공</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-extrabold text-slate-700">세공</div>
                      <div className="text-[12px] font-semibold text-slate-500 truncate">
                        {s?.engrave_key || "없음"}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 장비 */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-[12px] font-extrabold text-slate-600">장비</div>
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
                      disabled={!s?.hero_key}
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
                      disabled={!s?.hero_key}
                    />
                  </div>

                  <div>
                    <div className="text-[11px] font-extrabold text-slate-600">무기 메인옵 1</div>
                    <select
                      value={s.build?.weapon?.main1 || ""}
                      onChange={(e) => updateWeapon(activeSlot, "main1", e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white"
                      disabled={!s?.hero_key}
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
                      disabled={!s?.hero_key}
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
                      disabled={!s?.hero_key}
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
                      disabled={!s?.hero_key}
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
                      disabled={!s?.hero_key}
                    />
                  </div>

                  <div>
                    <div className="text-[11px] font-extrabold text-slate-600">메모</div>
                    <input
                      value={s.build?.note || ""}
                      onChange={(e) => updateBuild(activeSlot, { note: e.target.value })}
                      placeholder="자유 메모"
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                      disabled={!s?.hero_key}
                    />
                  </div>
                </div>
              </div>

              {/* 스킬 */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-[12px] font-extrabold text-slate-600">스킬 순서 (최대 3개)</div>
                <div className="mt-1 text-[12px] font-semibold text-slate-500">
                  아래에서 클릭하면 빈 칸부터 채워짐 (슬롯 클릭하면 제거)
                </div>

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
                          <img
                            src={`/images/skills/${s2}`}
                            alt={s2}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-[12px] font-extrabold text-slate-400">비어있음</div>
                        )}
                      </div>

                      <div className="mt-2 text-[11px] font-semibold text-slate-500 truncate">
                        {s2 || "-"}
                      </div>
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
                          <img
                            src={x.image}
                            alt={x.name}
                            className="w-full h-12 object-contain"
                            loading="lazy"
                          />
                          <div className="mt-1 text-[11px] font-extrabold text-slate-900 truncate">
                            {x.name}
                          </div>
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
            </div>
          </div>
        </div>
      </div>

      {/* Pickers */}
      <HeroPickerModal
        open={heroPickOpen}
        onClose={() => setHeroPickOpen(false)}
        onPick={(h) => {
          setSlots((prev) => {
            const next = [...prev];
            next[pickSlotIdx] = {
              ...next[pickSlotIdx],
              hero_key: h.key || "",
              name: h.name || "",
              image: h.image || "",
              build: normalizeBuild(next[pickSlotIdx]?.build || defaultBuild()),
            };
            return next;
          });
          setHeroPickOpen(false);
        }}
      />

      <PetPickerModal
        open={petPickOpen}
        onClose={() => setPetPickOpen(false)}
        onPick={(p) => {
          setPet({ key: p.key || "", name: p.name || "", image: p.image || "" });
          setPetPickOpen(false);
        }}
      />

      <ItemPickerModal
        open={ringPickOpen}
        title="반지 선택"
        options={RING_OPTIONS}
        imgFn={ringImg}
        onClose={() => setRingPickOpen(false)}
        onPick={(key) => {
          updateSlot(activeSlot, { ring_key: key || null });
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
          updateSlot(activeSlot, { engrave_key: key || null });
          setEngravePickOpen(false);
        }}
      />
    </div>
  );
}
