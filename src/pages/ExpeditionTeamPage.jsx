// src/pages/ExpeditionTeamPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import expeditionTeams from "../data/expedition-teams.json"; // ✅ 기존 JSON 유지
import equipmentData from "../data/equipmentRecommend.json";
import EquipmentModal from "../components/EquipmentModal";

// ✅ DB용
import { supabase } from "../lib/supabaseClient";
import { Plus, RefreshCw, X, Pencil, Trash2 } from "lucide-react";

const heroImg = (src) =>
  String(src || "").startsWith("/images/") ? src : `/images/heroes/${src || ""}`;

const skillImg = (filename) => `/images/skills/${filename}`;

// ✅ 펫 폴더가 프로젝트마다 달라서 1차: /images/pets, 실패시 /images/heroes 로 폴백
const petImgPrimary = (filename) =>
  String(filename || "").startsWith("/images/") ? filename : `/images/pet/${filename || ""}`;
const petImgFallback = (filename) =>
  String(filename || "").startsWith("/images/") ? filename : `/images/heroes/${filename || ""}`;

// ✅ 경로/확장자/공백 정규화 (DB/JSON 값이 섞여 들어와도 안전하게)
function filenameFromImagePath(p) {
  if (!p) return "";
  const s = String(p);
  const parts = s.split("/");
  return parts[parts.length - 1] || "";
}
const ensureExt = (fn) => {
  const s = String(fn || "").trim();
  if (!s) return "";
  if (/\.[a-z0-9]+$/i.test(s)) return s;
  return `${s}.png`;
};
const normalizePetFilename = (v) => {
  const s = String(v || "").trim();
  if (!s) return "";
  const base = filenameFromImagePath(s);
  return ensureExt(base || s);
};

const parseBuild = (build) => {
  if (!build) return {};
  if (typeof build === "object") return build;
  if (typeof build === "string") {
    try {
      const v = JSON.parse(build);
      return v && typeof v === "object" ? v : {};
    } catch {
      return {};
    }
  }
  return {};
};

const parseSkillSequence = (seqNode) => {
  let rawSeq = null;
  if (Array.isArray(seqNode)) rawSeq = seqNode?.[0]?.sequence ?? null;
  else if (seqNode && typeof seqNode === "object") rawSeq = seqNode.sequence ?? null;

  let seq = [];
  if (Array.isArray(rawSeq)) seq = rawSeq;
  else if (typeof rawSeq === "string") {
    try {
      const v = JSON.parse(rawSeq);
      if (Array.isArray(v)) seq = v;
    } catch {
      seq = [];
    }
  }
  return seq;
};

// ✅ 요청 폭주 방지용 placeholder (네트워크 요청 없음)
const NO_IMG_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-size="12">NO IMG</text>
    </svg>`
  );

/**
 * ✅ 펫 이미지 컴포넌트 (핵심 수정)
 * - primary 실패 → fallback 1회 시도
 * - fallback 실패 → placeholder로 종료 + onError 제거(재요청 방지)
 * - 렌더가 반복돼도 이미 stage가 끝난 이미지는 더 이상 네트워크 요청 안 함
 */
function PetImage({ filename, className = "w-full h-full object-contain" }) {
  const fn = useMemo(() => normalizePetFilename(filename), [filename]);
  const [stage, setStage] = useState(0); // 0=primary, 1=fallback, 2=done(placeholder)
  const [src, setSrc] = useState(() => (fn ? petImgPrimary(fn) : ""));

  useEffect(() => {
    // filename이 바뀌면 상태 리셋
    if (!fn) {
      setStage(2);
      setSrc("");
      return;
    }
    setStage(0);
    setSrc(petImgPrimary(fn));
  }, [fn]);

  if (!fn) return null;

  return (
    <img
      src={src || NO_IMG_PLACEHOLDER}
      alt={fn}
      className={className}
      loading="lazy"
      onError={(e) => {
        const cur = e.currentTarget;

        // 0 -> 1 : fallback 1회만
        if (stage === 0) {
          setStage(1);
          setSrc(petImgFallback(fn));
          return;
        }

        // 1 -> 2 : placeholder로 종료 (재요청 방지)
        if (stage === 1) {
          setStage(2);
          cur.onerror = null; // ✅ 여기서 끊어야 request 폭주 멈춤
          setSrc(NO_IMG_PLACEHOLDER);
          return;
        }

        // 2면 아무 것도 안 함
        cur.onerror = null;
      }}
    />
  );
}

function UserBuildModal({ open, onClose, heroName, heroImage, build, onOpenRecommend }) {
  if (!open) return null;

  const b = build || {};
  const weapon = b.weapon || {};
  const armor = b.armor || {};

  const Row = ({ label, value }) => (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-[12px] font-extrabold text-slate-700">{label}</div>
      <div className="text-[12px] font-semibold text-slate-600 text-right break-words">
        {String(value ?? "").trim() || "-"}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/40 flex items-end sm:items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
              {heroImage ? <img src={heroImage} alt={heroName || "hero"} className="w-full h-full object-contain" /> : null}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-extrabold text-slate-500">DB 저장 장비</div>
              <div className="mt-1 text-[15px] font-black text-slate-900 truncate">{heroName || "영웅"}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-2xl p-2 border border-slate-200 bg-white hover:bg-slate-50"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Row label="세트" value={b.set} />
            <Row label="비고" value={b.note} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[12px] font-extrabold text-slate-700">무기</div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Row label="주옵1" value={weapon.main1} />
              <Row label="주옵2" value={weapon.main2} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[12px] font-extrabold text-slate-700">방어구</div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Row label="주옵1" value={armor.main1} />
              <Row label="주옵2" value={armor.main2} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Row label="속도" value={b.speed} />
            <Row label="부옵/메모" value={b.subOption} />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          {typeof onOpenRecommend === "function" ? (
            <button
              type="button"
              onClick={onOpenRecommend}
              className="flex-1 rounded-2xl px-3 py-3 text-[13px] font-extrabold bg-indigo-600 text-white hover:bg-indigo-500"
            >
              추천 장비 보기
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl px-3 py-3 text-[13px] font-extrabold bg-slate-900 text-white hover:bg-slate-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function SkillSequenceModal({ open, onClose, title, sequence }) {
  if (!open) return null;
  const seq = Array.isArray(sequence) ? sequence : [];

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/40 flex items-end sm:items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-extrabold text-slate-500">스킬 순서</div>
            <div className="mt-1 text-[15px] font-black text-slate-900 truncate">{title || "스킬순서"}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-2xl p-2 border border-slate-200 bg-white hover:bg-slate-50"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {!seq.length ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[13px] font-semibold text-slate-600">
              등록된 스킬 순서가 없습니다.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {seq.map((fn, idx) => (
                <div
                  key={`${fn}-${idx}`}
                  className="relative w-12 h-12 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center"
                  title={fn}
                >
                  <img src={skillImg(fn)} alt={fn} className="w-full h-full object-contain" loading="lazy" />
                  <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-extrabold flex items-center justify-center">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl px-3 py-3 text-[13px] font-extrabold bg-slate-900 text-white hover:bg-slate-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExpeditionTeamPage() {
  const navigate = useNavigate();
  const { heroId } = useParams();
  const decodedHeroId = useMemo(() => decodeURIComponent(heroId || ""), [heroId]);

  const [me, setMe] = useState(null);

  // ✅ JSON은 "항상" 보여주기
  const jsonTeamSets = expeditionTeams?.expeditionTeams?.[decodedHeroId] || [];
  const hasJson = Array.isArray(jsonTeamSets) && jsonTeamSets.length > 0;

  // ✅ DB
  const [loadingDb, setLoadingDb] = useState(true);
  const [dbErr, setDbErr] = useState("");
  const [dbPosts, setDbPosts] = useState([]);
  const [profileMap, setProfileMap] = useState({});

  // ✅ 추천 장비 모달
  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);

  // ✅ DB build 모달
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [selectedBuildHeroName, setSelectedBuildHeroName] = useState("");
  const [selectedBuildHeroImage, setSelectedBuildHeroImage] = useState("");

  // ✅ DB build 모달에서 "추천 장비 보기" 눌렀을 때 열 추천 모달 정보
  const [recommendHeroKey, setRecommendHeroKey] = useState(null);
  const [recommendPreset, setRecommendPreset] = useState(null);

  // ✅ 스킬 모달
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [skillModalTitle, setSkillModalTitle] = useState("");
  const [skillModalSeq, setSkillModalSeq] = useState([]);

  const [deletingPostId, setDeletingPostId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMe(data?.user ?? null);
    });
  }, []);

  const loadDb = async () => {
    setLoadingDb(true);
    setDbErr("");

    try {
      const { data, error } = await supabase
        .from("expedition_set_posts")
        .select(
          `
          id, hero_id, set_idx, set_name, note, tags, created_at, created_by, anonymous,
          expedition_teams (
            id, team_index, team_name, note, recommended_pet,
            expedition_team_members ( slot, hero_key, hero_name, hero_image, build ),
            expedition_team_skill_sequences:expedition_team_skill_sequences!expedition_team_skill_sequences_team_id_fkey (
              sequence
            )
          )
        `
        )
        .eq("hero_id", decodedHeroId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // ✅ 작성자 닉네임 로드 (profiles에서 직접 읽기)
      const uids = Array.from(new Set((data || []).map((x) => x.created_by).filter(Boolean)));
      if (uids.length) {
        const { data: profs, error: profErr } = await supabase.from("profiles").select("user_id, nickname").in("user_id", uids);

        if (!profErr) {
          const nextMap = {};
          (profs || []).forEach((p) => {
            if (p?.user_id) nextMap[p.user_id] = (p.nickname || "").trim();
          });
          setProfileMap(nextMap);
        } else {
          setProfileMap({});
        }
      } else {
        setProfileMap({});
      }

      // 팀카드 단위 평탄화
      const flat = (data || []).flatMap((post) => {
        const teams = Array.isArray(post.expedition_teams) ? post.expedition_teams : [];
        return teams.map((t) => {
          const seq = parseSkillSequence(t.expedition_team_skill_sequences);

          return {
            id: `${post.id}:${t.id}`,
            post_id: post.id,
            team_id: t.id,

            hero_id: post.hero_id,
            set_idx: post.set_idx,
            set_name: post.set_name,
            post_note: post.note,
            tags: post.tags,
            created_at: post.created_at,
            anonymous: post.anonymous,
            created_by: post.created_by,

            team_index: t.team_index,
            team_name: t.team_name,
            note: t.note,
            recommended_pet: t.recommended_pet,

            members: (t.expedition_team_members || []).sort((a, b) => (a.slot || 0) - (b.slot || 0)),
            skill_sequence: seq,
          };
        });
      });

      setDbPosts(flat);
    } catch (e) {
      setDbErr(e?.message ? String(e.message) : "DB 로드 실패");
      setDbPosts([]);
      setProfileMap({});
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    loadDb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decodedHeroId]);

  const deletePost = async (postId) => {
    if (!postId) return;
    const ok = window.confirm("이 공략(세트)을 삭제할까요?\n(해당 포스트의 1/2팀 전체가 같이 삭제됩니다.)");
    if (!ok) return;

    setDeletingPostId(postId);
    setDbErr("");

    try {
      const { data: teams, error: teamSelErr } = await supabase.from("expedition_teams").select("id").eq("post_id", postId);
      if (teamSelErr) throw teamSelErr;

      const teamIds = (teams || []).map((x) => x.id).filter(Boolean);

      if (teamIds.length) {
        const { error: seqErr } = await supabase.from("expedition_team_skill_sequences").delete().in("team_id", teamIds);
        if (seqErr) throw seqErr;

        const { error: memErr } = await supabase.from("expedition_team_members").delete().in("team_id", teamIds);
        if (memErr) throw memErr;

        const { error: teamDelErr } = await supabase.from("expedition_teams").delete().in("id", teamIds);
        if (teamDelErr) throw teamDelErr;
      }

      const { error: postDelErr } = await supabase.from("expedition_set_posts").delete().eq("id", postId);
      if (postDelErr) throw postDelErr;

      await loadDb();
    } catch (e) {
      setDbErr(e?.message ? String(e.message) : "삭제 실패");
    } finally {
      setDeletingPostId(null);
    }
  };

  // ✅ 수정: Create 페이지로 이동해서 postId로 불러오게 + setIdx도 같이 넘김
  const goEdit = (postId, setIdx = 0) => {
    navigate(
      `/expedition/create?heroId=${encodeURIComponent(decodedHeroId)}&setIdx=${encodeURIComponent(
        String(setIdx)
      )}&postId=${encodeURIComponent(postId)}`
    );
  };

  // ✅ 장비 클릭: DB build 있으면 DB 모달 먼저, 추천은 버튼으로
  const openEquipModal = (hero) => {
    if (!hero) return;

    if (hero.build && Object.keys(hero.build || {}).length) {
      setSelectedBuild(hero.build);
      setSelectedBuildHeroName(hero.name || "");
      setSelectedBuildHeroImage(hero.image || "");
      setBuildModalOpen(true);

      setRecommendHeroKey(hero.hero_key || null);
      setRecommendPreset(hero.preset || null);
      return;
    }

    if (hero?.hero_key) {
      setSelectedHeroKey(hero.hero_key);
      setPresetTag(hero?.preset || null);
      return;
    }

    const heroKey = Object.keys(equipmentData || {}).find((key) => equipmentData?.[key]?.name === hero?.name);
    if (heroKey) {
      setSelectedHeroKey(heroKey);
      setPresetTag(hero?.preset || null);
    } else {
      alert("장비 정보가 없습니다.");
    }
  };

  const renderHeroes = (heroes, cols = "grid-cols-5") => (
    <div className={`grid ${cols} gap-2 mt-3`}>
      {(heroes || []).map((hero, idx) => {
        const imagePath = heroImg(hero?.image);
        return (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              openEquipModal(hero);
            }}
            className="flex flex-col items-center bg-gradient-to-b from-white to-gray-100 border border-gray-300 rounded-xl p-1.5 shadow-sm hover:shadow-md hover:scale-105 hover:border-indigo-400 transition-all duration-300"
            type="button"
          >
            <img
              src={imagePath}
              alt={hero?.name || "hero"}
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-md"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <p className="text-[10px] sm:text-[11px] mt-1 text-gray-800 font-medium text-center leading-tight">
              {hero?.name || "영웅"}
            </p>

            {hero?.preset ? (
              <span className="text-[9px] sm:text-[10px] text-white bg-indigo-500/80 px-1.5 py-0.5 rounded-full mt-1 leading-tight">
                {hero.preset}
              </span>
            ) : null}

            {hero?.note ? <p className="text-[9px] text-red-500 italic mt-0.5 text-center leading-tight">{hero.note}</p> : null}
          </button>
        );
      })}
    </div>
  );

  // ✅ 작성자: 닉네임 있으면 닉네임, 없으면 "알수없음"
  const groupedDb = useMemo(() => {
    const groups = {};

    for (const pp of dbPosts || []) {
      const nick = (profileMap?.[pp.created_by] || "").trim();
      const authorLabel = pp.anonymous ? "익명" : nick || "알수없음";
      if (!groups[authorLabel]) groups[authorLabel] = [];
      groups[authorLabel].push(pp);
    }

    const keys = Object.keys(groups).sort((a, b) => {
      if (a === "익명") return 1;
      if (b === "익명") return -1;
      return a.localeCompare(b);
    });

    return keys.map((k) => ({ author: k, posts: groups[k] }));
  }, [dbPosts, profileMap]);

  if (!hasJson && !loadingDb && !dbPosts.length) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">데이터를 찾을 수 없습니다.</div>;
  }

 return (
  <div className="min-h-screen bg-gradient-to-b from-[#f7f7fb] to-[#eceef6] py-8 px-3 sm:px-6">
    <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-md shadow-lg rounded-3xl p-4 sm:p-6 border border-gray-200">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow">
          ⚔️ {decodedHeroId.toUpperCase()} - 팀 선택
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDb}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md"
          >
            <RefreshCw size={16} />
            새로고침
          </button>

          <Link
            to={`/expedition/create?heroId=${encodeURIComponent(decodedHeroId)}`}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-transform"
          >
            <Plus size={16} />
            공략 추가
          </Link>
        </div>
      </div>

      {/* ✅ DB 공략을 먼저 */}
      <div className="mt-8 text-sm font-bold text-gray-700">🧾 유저 추가 공략 (DB)</div>

      {dbErr ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-red-700 text-sm">{dbErr}</div>
      ) : null}

      {loadingDb ? (
        <div className="mt-33 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">DB 공략 불러오는중...</div>
      ) : dbPosts.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          아직 DB 공략이 없습니다. “공략 추가”로 등록해줘.
        </div>
      ) : (
        <div className="mt-4 space-y-8">
          {groupedDb.map((g) => (
            <div key={g.author} className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13px] sm:text-[14px] font-extrabold text-gray-800">
                  작성자: <span className="text-indigo-700">{g.author}</span>
                  <span className="ml-2 text-[12px] font-semibold text-gray-500">({g.posts.length}개)</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {g.posts.map((p) => {
                  const members = Array.isArray(p.members) ? p.members : [];

                  const heroes = members.slice(0, 5).map((m) => {
                    const b = parseBuild(m.build);
                    return {
                      hero_key: m.hero_key || null,
                      name: m.hero_name,
                      image: m.hero_image,
                      preset: b.set || null,
                      note: b.note || null,
                      build: b,
                    };
                  });

                  const isMine = !!(me?.id && p.created_by && me.id === p.created_by);
                  const deleting = deletingPostId === p.post_id;

                  const petFn = normalizePetFilename(p.recommended_pet);

                  return (
                    <div
                      key={p.id}
                      className="bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[11px] text-gray-500">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}
                        </div>

                        {isMine ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => goEdit(p.post_id, p.set_idx)}
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-white border border-gray-200 hover:bg-gray-50"
                              title="수정"
                            >
                              <Pencil size={14} />
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePost(p.post_id)}
                              disabled={deleting}
                              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 disabled:opacity-60"
                              title="삭제"
                            >
                              <Trash2 size={14} />
                              {deleting ? "삭제중" : "삭제"}
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <h3 className="font-bold text-gray-800 text-center mb-2 text-lg sm:text-xl">
                        🧩 {p.team_name || "팀"}{" "}
                        <span className="text-[12px] font-semibold text-gray-500">({p.set_name || "세트"})</span>
                      </h3>

                      <div className="flex items-center justify-center gap-2 mt-1">
                        <div className="w-10 h-10 rounded-2xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                          {petFn ? <PetImage filename={petFn} className="w-full h-full object-contain" /> : (
                            <div className="text-[10px] font-extrabold text-gray-400">-</div>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-gray-600">
                          펫: <span className="font-extrabold text-gray-800">{petFn || "미지정"}</span>
                        </div>
                      </div>

                      {renderHeroes(heroes, "grid-cols-5")}

                      {String(p.note || "").trim() ? (
                        <p className="text-[11px] text-red-500 text-center mt-2 italic">※ {p.note}</p>
                      ) : null}

                      <div className="flex justify-end mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSkillModalTitle(`${p.team_name || "팀"} (${p.set_name || "세트"})`);
                            setSkillModalSeq(Array.isArray(p.skill_sequence) ? p.skill_sequence : []);
                            setSkillModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-transform"
                        >
                          ⚡ 스킬순서 보기
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ JSON 공략은 아래로 */}
      {hasJson ? (
        <>
          <div className="mt-10 text-sm font-bold text-gray-700">📘 기본 공략 (JSON)</div>

          {jsonTeamSets.map((set, setIdx) => (
            <div key={`json-${setIdx}`} className="mb-10 mt-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-center text-indigo-700 mb-4">{set.setName}</h2>

              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(set.teams || []).map((team) => (
                  <li
                    key={`json-team-${setIdx}-${team.id}`}
                    className="bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 sm:p-5 flex flex-col justify-between h-fit max-h-[480px]"
                  >
                    <h3 className="font-bold text-gray-800 text-center mb-2 text-lg sm:text-xl">🧩 {team.teamName}</h3>

                    {renderHeroes(team.heroes, "grid-cols-5")}

                    {team.note ? <p className="text-[11px] text-red-500 text-center mt-2 italic">※ {team.note}</p> : null}

                    <div className="flex justify-end mt-4">
                      <Link
                        to={`/expedition-skill/${encodeURIComponent(decodedHeroId)}/${setIdx}/${team.id - 1}`}
                        className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-transform"
                      >
                        ⚡ 스킬순서 보기
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>

              {set.note ? <p className="text-[12px] text-gray-600 text-center mt-4 italic">📘 {set.note}</p> : null}
            </div>
          ))}
        </>
      ) : null}

      <div className="text-center mt-10">
        <Link to="/expedition" className="text-sm sm:text-base font-medium text-indigo-500 hover:underline hover:text-indigo-600 transition">
          ← 강림원정대 메인으로
        </Link>
      </div>
    </div>

    {/* 모달들은 그대로 */}
    <UserBuildModal
      open={buildModalOpen}
      onClose={() => {
        setBuildModalOpen(false);
        setSelectedBuild(null);
        setSelectedBuildHeroName("");
        setSelectedBuildHeroImage("");
      }}
      heroName={selectedBuildHeroName}
      heroImage={selectedBuildHeroImage}
      build={selectedBuild}
      onOpenRecommend={() => {
        setBuildModalOpen(false);
        if (recommendHeroKey) {
          setSelectedHeroKey(recommendHeroKey);
          setPresetTag(recommendPreset || null);
        }
      }}
    />

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

    <SkillSequenceModal
      open={skillModalOpen}
      onClose={() => setSkillModalOpen(false)}
      title={skillModalTitle}
      sequence={skillModalSeq}
    />
  </div>
);

}
