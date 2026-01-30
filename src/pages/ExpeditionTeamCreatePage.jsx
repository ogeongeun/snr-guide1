// src/pages/ExpeditionTeamCreatePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import PageShell from "../components/PageShell";
import { supabase } from "../lib/supabaseClient";

import heroesList from "../data/heroes.json";
import skillImages from "../data/skillImages.json";
import petImages from "../data/petImages.json";

const heroImg = (src) =>
  String(src || "").startsWith("/images/") ? src : `/images/heroes/${src || ""}`;

// ✅ 펫 폴더가 프로젝트마다 달라서 1차: /images/pets, 실패시 /images/heroes 로 폴백
const petImgPrimary = (filename) =>
  String(filename || "").startsWith("/images/") ? filename : `/images/pets/${filename || ""}`;
const petImgFallback = (filename) =>
  String(filename || "").startsWith("/images/") ? filename : `/images/heroes/${filename || ""}`;

// ✅ 스킬 이미지 경로: skillImages.json에 image가 "/images/skills/xxx.png" 형태로 이미 들어있음(시즈 코드 기준)
function filenameFromImagePath(p) {
  if (!p) return "";
  const s = String(p);
  const parts = s.split("/");
  return parts[parts.length - 1] || "";
}

// ✅ 파일명 확장자(.png 등) 강제 보정 + 공백 제거
const ensureExt = (fn) => {
  const s = String(fn || "").trim();
  if (!s) return "";
  if (/\.[a-z0-9]+$/i.test(s)) return s; // 이미 확장자 있음
  return `${s}.png`; // 없으면 png로 보정
};

// ✅ 어떤 값이 와도 "irin.png" 형태로 통일
const normalizePetFilename = (v) => {
  const s = String(v || "").trim();
  if (!s) return "";
  const base = filenameFromImagePath(s); // "/images/pets/irin.png" -> "irin.png"
  return ensureExt(base || s);
};

// =========================
// ✅ 장비 옵션(선택형)
// =========================
const SET_OPTIONS = ["선봉장", "추적자", "성기사", "수문장", "수호자", "암살자", "복수자", "주술사", "조율자"];
const WEAPON_MAIN_OPTIONS = ["약점공격", "치명타확률", "치명타피해", "모든공격력%", "방어력%", "생명력%", "효과적중"];
const ARMOR_MAIN_OPTIONS = ["받는피해감소", "막기확률", "모든공격력%", "방어력%", "생명력%", "효과저항"];

const defaultBuild = () => ({
  set: "",
  weapon: { main1: "", main2: "" },
  armor: { main1: "", main2: "" },
  subOption: "",
  speed: null,
  note: "",
});

function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}

function defaultTeam() {
  return {
    teamName: "",
    teamNote: "",
    // ✅ DB에는 "펫 파일명"만 저장 (예: yeonji.png)
    pet: "",
    slots: Array.from({ length: 5 }, () => ({
      hero_key: "",
      name: "",
      image: "",
      build: defaultBuild(),
    })),
    // ✅ 팀당 스킬 1개: "파일명 배열"만 저장
    skillSequence: [],
  };
}

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

// ✅ petImages.json 구조가 어떤 형태든 "선택 가능한 배열"로 정규화
function normalizePetList(raw) {
  if (Array.isArray(raw)) {
    return raw.map((p) => ({
      key: p?.key || p?.id || p?.name || "",
      name: p?.name || p?.label || p?.key || "",
      image: p?.image || "",
      filename: p?.filename || filenameFromImagePath(p?.image) || p?.key || "",
    }));
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([k, v]) => {
      if (typeof v === "string") {
        return { key: k, name: k, image: "", filename: v };
      }
      return {
        key: v?.key || k,
        name: v?.name || v?.label || v?.key || k,
        image: v?.image || "",
        filename: v?.filename || filenameFromImagePath(v?.image) || v?.key || k,
      };
    });
  }

  return [];
}

// ✅ build 파싱: object/ string(json) 모두 대응
function parseBuild(build) {
  if (!build) return defaultBuild();
  if (typeof build === "object") {
    const b = build || {};
    return {
      ...defaultBuild(),
      ...b,
      weapon: { ...(defaultBuild().weapon || {}), ...(b.weapon || {}) },
      armor: { ...(defaultBuild().armor || {}), ...(b.armor || {}) },
    };
  }
  if (typeof build === "string") {
    try {
      const v = JSON.parse(build);
      if (v && typeof v === "object") return parseBuild(v);
    } catch {}
  }
  return defaultBuild();
}

export default function ExpeditionTeamCreatePage() {
  const navigate = useNavigate();
  const q = useQuery();

  const heroId = q.get("heroId") ? decodeURIComponent(q.get("heroId")) : "";
  const setIdx = Number.parseInt(q.get("setIdx") || "0", 10) || 0;

  // ✅ edit 모드: postId 있으면 수정
  const postId = q.get("postId") ? String(q.get("postId")) : "";
  const isEdit = !!postId;

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [loadingEdit, setLoadingEdit] = useState(false);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // ✅ 세트(글) 공통
  const [setName, setSetName] = useState("");
  const [tagText, setTagText] = useState("");
  const [setNote, setSetNote] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  // ✅ 팀 2개
  const [teams, setTeams] = useState(() => [defaultTeam(), defaultTeam()]);
  const [activeTeam, setActiveTeam] = useState(0); // 0=1팀, 1=2팀
  const [activeSlot, setActiveSlot] = useState(0);

  // ✅ 영웅 픽커
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTeam, setPickerTeam] = useState(0);
  const [pickerSlot, setPickerSlot] = useState(0);

  // ✅ 펫 픽커
  const [petPickerOpen, setPetPickerOpen] = useState(false);

  // ✅ 스킬 선택 검색
  const [skillQ, setSkillQ] = useState("");

  // ✅ 스킬 undo (팀별)
  const [skillUndoStacks, setSkillUndoStacks] = useState(() => [[], []]);

  // ✅ 펫 이미지가 깨지면(1차+fallback까지) 더 이상 요청하지 않게 막기
  const [petBrokenByTeam, setPetBrokenByTeam] = useState([false, false]);

  const resetPetBroken = (teamIndex) => {
    setPetBrokenByTeam((prev) => {
      const next = [...prev];
      next[teamIndex] = false;
      return next;
    });
  };

  const markPetBroken = (teamIndex) => {
    setPetBrokenByTeam((prev) => {
      const next = [...prev];
      next[teamIndex] = true;
      return next;
    });
  };

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

  const tags = useMemo(() => {
    const raw = (tagText || "").trim();
    if (!raw) return [];
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [tagText]);

  const t = teams[activeTeam];
  const s = t?.slots?.[activeSlot];

  // ✅ petImages.json을 정규화해서 "filename -> image 경로"를 만들기
  const petList = useMemo(() => normalizePetList(petImages), []);
  const petImageByFilename = useMemo(() => {
    const m = new Map();
    for (const p of petList) {
      // filename 키를 안정적으로 만들고
      const fn = normalizePetFilename(p?.filename || p?.image || p?.key || "");
      if (!fn) continue;

      // p.image가 있으면 그 경로를 최우선으로 저장
      if (p?.image) {
        m.set(fn, p.image);
      }
    }
    return m;
  }, [petList]);

  // ✅ 선택된 t.pet(파일명)으로 프리뷰 src 만들기 (json에 image가 있으면 그걸 씀)
  const petPreviewSrc = useMemo(() => {
    const fn = normalizePetFilename(t?.pet || "");
    if (!fn) return "";
    return petImageByFilename.get(fn) || petImgPrimary(fn);
  }, [t?.pet, petImageByFilename]);

  useEffect(() => {
    // 팀/펫이 바뀌면 다시 로드 시도 가능하게 리셋
    resetPetBroken(activeTeam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam, t?.pet]);

  const filteredSkillImages = useMemo(() => {
    const qq = (skillQ || "").trim().toLowerCase();
    const list = Array.isArray(skillImages) ? skillImages : [];
    if (!qq) return list;
    return list.filter((x) => {
      const k = (x.key || "").toLowerCase();
      const n = (x.name || "").toLowerCase();
      const fn = filenameFromImagePath(x.image).toLowerCase();
      return k.includes(qq) || n.includes(qq) || fn.includes(qq);
    });
  }, [skillQ]);

  // =========================
  // state helpers
  // =========================
  const updateTeam = (teamIndex, patch) => {
    setTeams((prev) => {
      const next = [...prev];
      next[teamIndex] = { ...next[teamIndex], ...patch };
      return next;
    });
  };

  const updateTeamSlot = (teamIndex, slotIndex, patch) => {
    setTeams((prev) => {
      const next = [...prev];
      const curTeam = next[teamIndex];
      const slots = [...(curTeam.slots || [])];
      slots[slotIndex] = { ...slots[slotIndex], ...patch };
      next[teamIndex] = { ...curTeam, slots };
      return next;
    });
  };

  const updateBuild = (teamIndex, slotIndex, patch) => {
    setTeams((prev) => {
      const next = [...prev];
      const curTeam = next[teamIndex];
      const slots = [...(curTeam.slots || [])];
      const cur = slots[slotIndex];
      slots[slotIndex] = {
        ...cur,
        build: { ...(cur.build || defaultBuild()), ...patch },
      };
      next[teamIndex] = { ...curTeam, slots };
      return next;
    });
  };

  const updateWeapon = (teamIndex, slotIndex, key, value) => {
    setTeams((prev) => {
      const next = [...prev];
      const curTeam = next[teamIndex];
      const slots = [...(curTeam.slots || [])];
      const cur = slots[slotIndex];
      const build = cur.build || defaultBuild();
      slots[slotIndex] = {
        ...cur,
        build: { ...build, weapon: { ...(build.weapon || {}), [key]: value } },
      };
      next[teamIndex] = { ...curTeam, slots };
      return next;
    });
  };

  const updateArmor = (teamIndex, slotIndex, key, value) => {
    setTeams((prev) => {
      const next = [...prev];
      const curTeam = next[teamIndex];
      const slots = [...(curTeam.slots || [])];
      const cur = slots[slotIndex];
      const build = cur.build || defaultBuild();
      slots[slotIndex] = {
        ...cur,
        build: { ...build, armor: { ...(build.armor || {}), [key]: value } },
      };
      next[teamIndex] = { ...curTeam, slots };
      return next;
    });
  };

  // =========================
  // ✅ EDIT 로드 (postId 있으면)
  // =========================
  const loadEdit = async () => {
    if (!isEdit || !postId) return;
    if (!me?.id) return;

    setLoadingEdit(true);
    setErr("");

    try {
      const { data, error } = await supabase
        .from("expedition_set_posts")
        .select(
          `
          id, hero_id, set_idx, set_name, note, tags, created_by, anonymous,
          expedition_teams (
            id, team_index, team_name, note, recommended_pet,
            expedition_team_members ( slot, hero_key, hero_name, hero_image, build ),
            expedition_team_skill_sequences:expedition_team_skill_sequences!expedition_team_skill_sequences_team_id_fkey ( sequence )
          )
        `
        )
        .eq("id", postId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("수정할 공략(post)을 찾을 수 없습니다.");

      if (data.hero_id && heroId && String(data.hero_id) !== String(heroId)) {
        throw new Error("URL heroId와 DB hero_id가 다릅니다. (잘못된 링크)");
      }

      if (data.created_by && data.created_by !== me.id) {
        throw new Error("내가 작성한 공략만 수정할 수 있습니다.");
      }

      setSetName((data.set_name || "").trim());
      setSetNote((data.note || "").trim());
      setAnonymous(!!data.anonymous);
      setTagText(Array.isArray(data.tags) ? data.tags.join(", ") : "");

      const nextTeams = [defaultTeam(), defaultTeam()];
      const dbTeams = Array.isArray(data.expedition_teams) ? data.expedition_teams : [];

      for (const tt of dbTeams) {
        const ti = (tt.team_index || 1) - 1;
        if (ti !== 0 && ti !== 1) continue;

        nextTeams[ti].teamName = (tt.team_name || "").trim();
        nextTeams[ti].teamNote = (tt.note || "").trim();

        // ✅ DB에서 읽어올 때도 정규화(경로/확장자/공백)
        nextTeams[ti].pet = normalizePetFilename((tt.recommended_pet || "").trim());

        const mems = Array.isArray(tt.expedition_team_members) ? tt.expedition_team_members : [];
        const sorted = mems.slice().sort((a, b) => (a.slot || 0) - (b.slot || 0));

        for (const m of sorted) {
          const si = (m.slot || 1) - 1;
          if (si < 0 || si >= 5) continue;
          nextTeams[ti].slots[si] = {
            hero_key: m.hero_key || "",
            name: m.hero_name || "",
            image: m.hero_image || "",
            build: parseBuild(m.build),
          };
        }

        const seqNode = tt.expedition_team_skill_sequences;
        let seq = [];
        if (Array.isArray(seqNode)) seq = seqNode?.[0]?.sequence || [];
        else if (seqNode && typeof seqNode === "object") seq = seqNode.sequence || [];
        nextTeams[ti].skillSequence = Array.isArray(seq) ? seq : [];
      }

      setTeams(nextTeams);

      setSkillUndoStacks([[], []]);
      setActiveTeam(0);
      setActiveSlot(0);
    } catch (e) {
      setErr(e?.message ? String(e.message) : "수정 데이터 로드 실패");
    } finally {
      setLoadingEdit(false);
    }
  };

  useEffect(() => {
    if (!isEdit) return;
    if (!me?.id) return;
    loadEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, me?.id, postId]);

  // =========================
  // 스킬 순서 (Siege 스타일)
  // =========================
  const pushSkillUndo = (teamIndex, snap) => {
    setSkillUndoStacks((prev) => {
      const next = [...prev];
      const stk = Array.isArray(next[teamIndex]) ? [...next[teamIndex]] : [];
      stk.push(snap);
      if (stk.length > 60) stk.shift();
      next[teamIndex] = stk;
      return next;
    });
  };

  const commitSkillSeq = (teamIndex, updater) => {
    setTeams((prev) => {
      const next = [...prev];
      const curTeam = next[teamIndex];

      const prevSnap = deepClone(curTeam?.skillSequence || []);
      const draftSeq = deepClone(prevSnap);

      const updatedSeq = updater(draftSeq);
      if (!updatedSeq) return prev;

      pushSkillUndo(teamIndex, prevSnap);
      next[teamIndex] = { ...curTeam, skillSequence: updatedSeq };
      return next;
    });
  };

  const undoSkillSeq = (teamIndex) => {
    setSkillUndoStacks((prev) => {
      const next = [...prev];
      const stk = Array.isArray(next[teamIndex]) ? next[teamIndex] : [];
      if (!stk.length) return prev;

      const last = stk[stk.length - 1];

      setTeams((p) => {
        const nn = [...p];
        const ct = nn[teamIndex];
        nn[teamIndex] = { ...ct, skillSequence: last };
        return nn;
      });

      next[teamIndex] = stk.slice(0, -1);
      return next;
    });
  };

  const addSkillImage = (teamIndex, imgFilename) => {
    if (!imgFilename) return;
    commitSkillSeq(teamIndex, (seq) => {
      seq.push(imgFilename);
      return seq;
    });
  };

  const removeSkillAt = (teamIndex, idx) => {
    commitSkillSeq(teamIndex, (seq) => {
      if (idx < 0 || idx >= seq.length) return null;
      seq.splice(idx, 1);
      return seq;
    });
  };

  const clearSkills = (teamIndex) => {
    commitSkillSeq(teamIndex, () => []);
  };

  // =========================
  // validate/save
  // =========================
  const validate = () => {
    if (!heroId) return "heroId가 없습니다. /expedition/create?heroId=darkteo 형태로 들어와야 합니다.";

    for (let ti = 0; ti < 2; ti++) {
      const tt = teams[ti];
      for (let i = 0; i < 5; i++) {
        if (!tt?.slots?.[i]?.hero_key) return `팀 ${ti + 1} · 영웅 ${i + 1}번 슬롯이 비어있습니다.`;
      }
    }
    return "";
  };

  // ✅ 수정 저장은: post update + 기존 팀/멤버/스킬 삭제 후 재삽입
  const save = async () => {
    setErr("");

    if (!me?.id) {
      setErr("로그인이 필요합니다.");
      return;
    }

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setSaving(true);

    try {
      let workingPostId = postId;

      // -------------------------
      // 1) post (insert or update)
      // -------------------------
      if (!isEdit) {
        const { data: postRow, error: postErr } = await supabase
          .from("expedition_set_posts")
          .insert([
            {
              hero_id: heroId,
              set_idx: setIdx,
              set_name: (setName || "").trim(),
              note: (setNote || "").trim(),
              tags,
              anonymous,
              created_by: me.id,
            },
          ])
          .select("id")
          .single();

        if (postErr) throw postErr;
        workingPostId = postRow.id;
      } else {
        const { data: chk, error: chkErr } = await supabase
          .from("expedition_set_posts")
          .select("id, created_by")
          .eq("id", workingPostId)
          .maybeSingle();
        if (chkErr) throw chkErr;
        if (!chk) throw new Error("수정할 공략을 찾을 수 없습니다.");
        if (chk.created_by && chk.created_by !== me.id) throw new Error("내가 작성한 공략만 수정할 수 있습니다.");

        const { error: upErr } = await supabase
          .from("expedition_set_posts")
          .update({
            set_idx: setIdx,
            set_name: (setName || "").trim(),
            note: (setNote || "").trim(),
            tags,
            anonymous,
          })
          .eq("id", workingPostId);

        if (upErr) throw upErr;

        // -------------------------
        // 2) edit이면 기존 팀/멤버/스킬 삭제
        // -------------------------
        const { data: oldTeams, error: oldTeamErr } = await supabase.from("expedition_teams").select("id").eq("post_id", workingPostId);
        if (oldTeamErr) throw oldTeamErr;

        const teamIds = (oldTeams || []).map((x) => x.id).filter(Boolean);

        if (teamIds.length) {
          const { error: delSeqErr } = await supabase.from("expedition_team_skill_sequences").delete().in("team_id", teamIds);
          if (delSeqErr) throw delSeqErr;

          const { error: delMemErr } = await supabase.from("expedition_team_members").delete().in("team_id", teamIds);
          if (delMemErr) throw delMemErr;

          const { error: delTeamErr } = await supabase.from("expedition_teams").delete().in("id", teamIds);
          if (delTeamErr) throw delTeamErr;
        }
      }

      // -------------------------
      // 3) 팀 2개 insert
      // -------------------------
      const teamPayload = [
        {
          post_id: workingPostId,
          team_index: 1,
          team_name: (teams[0].teamName || "").trim(),
          note: (teams[0].teamNote || "").trim(),
          recommended_pet: normalizePetFilename(teams[0].pet), // ✅ 저장도 정규화
        },
        {
          post_id: workingPostId,
          team_index: 2,
          team_name: (teams[1].teamName || "").trim(),
          note: (teams[1].teamNote || "").trim(),
          recommended_pet: normalizePetFilename(teams[1].pet), // ✅ 저장도 정규화
        },
      ];

      const { data: teamRows, error: teamErr } = await supabase.from("expedition_teams").insert(teamPayload).select("id, team_index");

      if (teamErr) {
        if (!isEdit) await supabase.from("expedition_set_posts").delete().eq("id", workingPostId);
        throw teamErr;
      }

      const teamId1 = teamRows?.find((x) => x.team_index === 1)?.id;
      const teamId2 = teamRows?.find((x) => x.team_index === 2)?.id;

      if (!teamId1 || !teamId2) {
        if (!isEdit) await supabase.from("expedition_set_posts").delete().eq("id", workingPostId);
        throw new Error("팀 생성 결과가 올바르지 않습니다.");
      }

      // -------------------------
      // 4) 멤버 10개 insert
      // -------------------------
      const mem1 = (teams[0].slots || []).map((x, idx) => ({
        team_id: teamId1,
        slot: idx + 1,
        hero_key: x.hero_key,
        hero_name: x.name,
        hero_image: x.image,
        build: x.build || {},
      }));

      const mem2 = (teams[1].slots || []).map((x, idx) => ({
        team_id: teamId2,
        slot: idx + 1,
        hero_key: x.hero_key,
        hero_name: x.name,
        hero_image: x.image,
        build: x.build || {},
      }));

      const { error: memErr } = await supabase.from("expedition_team_members").insert([...mem1, ...mem2]);

      if (memErr) {
        if (!isEdit) await supabase.from("expedition_set_posts").delete().eq("id", workingPostId);
        throw memErr;
      }

      // -------------------------
      // 5) 팀당 스킬 1개씩 upsert (sequence: 파일명 배열)
      // -------------------------
      const seq1 = Array.isArray(teams[0].skillSequence) ? teams[0].skillSequence : [];
      const seq2 = Array.isArray(teams[1].skillSequence) ? teams[1].skillSequence : [];

      const { error: skillErr } = await supabase.from("expedition_team_skill_sequences").upsert([
        { team_id: teamId1, tag: null, sequence: seq1 },
        { team_id: teamId2, tag: null, sequence: seq2 },
      ]);

      if (skillErr) {
        if (!isEdit) await supabase.from("expedition_set_posts").delete().eq("id", workingPostId);
        throw skillErr;
      }

      navigate(`/expedition/${encodeURIComponent(heroId)}`, { replace: true });
    } catch (e) {
      setErr(e?.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const undoDisabled = !(skillUndoStacks?.[activeTeam]?.length);

  return (
    <PageShell
      title={isEdit ? "강림원정대 공략 수정" : "강림원정대 공략 추가"}
      right={
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="rounded-xl px-3 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
          >
            ← 뒤로
          </button>
          {heroId ? (
            <Link
              to={`/expedition/${encodeURIComponent(heroId)}`}
              className="rounded-xl px-3 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
            >
              목록
            </Link>
          ) : null}
        </div>
      }
    >
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-[12px] font-extrabold text-slate-500">
            heroId: <span className="text-slate-900">{heroId || "(없음)"}</span> · setIdx:{" "}
            <span className="text-slate-900">{setIdx}</span>
            {isEdit ? (
              <>
                {" "}
                · postId: <span className="text-slate-900">{postId}</span>
              </>
            ) : null}
            {loadingMe ? <span className="ml-2 text-slate-400">(유저 확인중)</span> : null}
            {loadingEdit ? <span className="ml-2 text-slate-400">(수정 데이터 불러오는중)</span> : null}
          </div>

          <button
            onClick={save}
            disabled={saving || !heroId || loadingEdit}
            className="rounded-2xl px-3 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-60"
          >
            {saving ? "저장중..." : isEdit ? "수정 저장" : "저장"}
          </button>
        </div>

        <div className="p-5 space-y-4">
          {err ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
              <div className="text-[12px] font-extrabold">오류</div>
              <div className="mt-1 text-[12px] font-semibold break-all">{err}</div>
            </div>
          ) : null}

          {/* 세트 이름 */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-[12px] font-extrabold text-slate-600">세트 이름(선택)</div>
            <input
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="예) 종결세팅 / 안전세팅 ..."
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
            />
          </div>

          {/* 태그 */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-[12px] font-extrabold text-slate-600">설명(tags)</div>
            <input
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="쉼표로 구분"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
            />
          </div>

          {/* 익명 */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-[12px] font-extrabold text-slate-600 mb-2">작성자 표시</div>
            <div className="inline-flex rounded-2xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setAnonymous(false)}
                className={[
                  "px-4 py-2 text-[12px] font-extrabold transition",
                  !anonymous ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
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
              >
                익명
              </button>
            </div>
          </div>

          

          {/* 팀 탭 */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[12px] font-extrabold text-slate-600">팀 선택</div>
            <div className="mt-3 inline-flex rounded-2xl border border-slate-200 overflow-hidden bg-white">
              {[0, 1].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActiveTeam(i);
                    setActiveSlot(0);
                  }}
                  className={[
                    "px-4 py-2 text-[12px] font-extrabold transition",
                    activeTeam === i ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50",
                    i === 1 ? "border-l border-slate-200" : "",
                  ].join(" ")}
                >
                  {i + 1}팀
                </button>
              ))}
            </div>
          </div>

          {/* 팀 정보 + 펫(이미지로 선택) */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-[12px] font-extrabold text-slate-600">팀 정보</div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-extrabold text-slate-600">팀 이름</div>
                <input
                  value={t.teamName}
                  onChange={(e) => updateTeam(activeTeam, { teamName: e.target.value })}
                  placeholder="예) 1팀 / 빔초빔 ..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
                />
              </div>

              <div>
                <div className="text-[11px] font-extrabold text-slate-600">추천 펫</div>
                <div className="mt-1 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                    {t.pet ? (
                      petBrokenByTeam[activeTeam] ? (
                        <div className="text-[11px] font-extrabold text-slate-400">X</div>
                      ) : (
                        <img
                          src={petPreviewSrc}
                          alt={t.pet}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // ✅ 1) primary 실패 -> fallback 시도
                            const cur = e.currentTarget;
                            const fn = normalizePetFilename(t.pet);

                            // 이미 fallback을 시도한 상태면, 더 이상 재시도 금지
                            if (cur.dataset.fallbackTried === "1") {
                              cur.onerror = null;
                              cur.src =
                                "data:image/svg+xml;charset=utf-8," +
                                encodeURIComponent(
                                  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-size="12">NO IMG</text></svg>`
                                );
                              markPetBroken(activeTeam);
                              return;
                            }

                            cur.dataset.fallbackTried = "1";
                            cur.src = petImgFallback(fn);
                          }}
                        />
                      )
                    ) : (
                      <div className="text-[11px] font-extrabold text-slate-400">-</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-extrabold text-slate-800 truncate">{t.pet || "미선택"}</div>
                    <div className="text-[11px] font-semibold text-slate-500">클릭해서 선택</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPetPickerOpen(true)}
                    className="shrink-0 rounded-2xl px-3 py-2 text-[12px] font-extrabold bg-slate-900 text-white hover:bg-slate-800"
                  >
                    펫 선택
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[11px] font-extrabold text-slate-600">팀 메모</div>
              <textarea
                value={t.teamNote}
                onChange={(e) => updateTeam(activeTeam, { teamNote: e.target.value })}
                placeholder="예) 델로끼면 치확 더 낮춰도됨..."
                className="mt-1 w-full min-h-[70px] rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
              />
            </div>
          </div>

          {/* 스킬 순서 */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[12px] font-extrabold text-slate-600">스킬 순서 (팀당 1개)</div>
                <div className="mt-1 text-[12px] font-semibold text-slate-500">아래 스킬을 클릭하면 순서대로 쌓이고, 위에서 클릭하면 삭제됨.</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => undoSkillSeq(activeTeam)}
                  disabled={undoDisabled}
                  className="rounded-2xl px-3 py-2 text-[12px] font-extrabold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  ← 되돌리기
                </button>
                <button
                  type="button"
                  onClick={() => clearSkills(activeTeam)}
                  className="rounded-2xl px-3 py-2 text-[12px] font-extrabold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 현재 쌓인 순서 */}
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[12px] font-extrabold text-slate-700">현재 {Array.isArray(t.skillSequence) ? t.skillSequence.length : 0}개</div>

              <div className="mt-2 flex flex-wrap gap-2">
                {(Array.isArray(t.skillSequence) ? t.skillSequence : []).map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => removeSkillAt(activeTeam, idx)}
                    className="relative w-10 h-10 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center"
                    title={`클릭하면 삭제 (${idx + 1}번)`}
                  >
                    <img src={`/images/skills/${img}`} alt={img} className="w-full h-full object-contain" loading="lazy" />
                    <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </div>
                  </button>
                ))}

                {!((t.skillSequence || []).length) ? (
                  <div className="text-[12px] font-semibold text-slate-400">(비어있음) 아래에서 스킬을 눌러 추가하세요.</div>
                ) : null}
              </div>
            </div>

            {/* 스킬 이미지 선택 */}
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-extrabold text-slate-600">스킬 선택</div>
                <input
                  value={skillQ}
                  onChange={(e) => setSkillQ(e.target.value)}
                  placeholder="검색: 루리 / luri2 ..."
                  className="w-[240px] max-w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                />
              </div>

              <div className="mt-2 max-h-[320px] overflow-y-auto grid grid-cols-3 sm:grid-cols-6 gap-2">
                {filteredSkillImages.map((x) => {
                  const filename = filenameFromImagePath(x.image);
                  return (
                    <button
                      key={x.key}
                      type="button"
                      onClick={() => addSkillImage(activeTeam, filename)}
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

          {/* 영웅 5명 */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[12px] font-extrabold text-slate-600">영웅 5명</div>

            <div className="mt-3 overflow-x-auto">
              <div className="min-w-[560px] grid grid-cols-5 gap-2">
                {(t.slots || []).map((x, idx) => {
                  const on = idx === activeSlot;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActiveSlot(idx)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        on ? "bg-white border-slate-900 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-black text-slate-900">슬롯 {idx + 1}</div>
                        <span className={`text-[10px] font-extrabold ${on ? "text-slate-900" : "text-slate-400"}`}>{on ? "편집중" : ""}</span>
                      </div>

                      <div className="mt-2 w-full aspect-square rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                        {x.image ? (
                          <img src={heroImg(x.image)} alt={x.name || "hero"} className="w-full h-full object-contain" loading="lazy" />
                        ) : (
                          <div className="text-[11px] font-extrabold text-slate-400">선택</div>
                        )}
                      </div>

                      <div className="mt-2 text-[12px] font-extrabold text-slate-900 truncate">{x.name || "영웅 미선택"}</div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPickerTeam(activeTeam);
                          setPickerSlot(idx);
                          setPickerOpen(true);
                        }}
                        className="mt-2 w-full rounded-xl px-2 py-2 text-[12px] font-extrabold bg-slate-900 text-white hover:bg-slate-800"
                      >
                        {x.hero_key ? "변경" : "선택"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 장비 편집 */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-[12px] font-extrabold text-slate-600">장비 편집</div>
            <div className="mt-1 text-[13px] font-black text-slate-900">
              {activeTeam + 1}팀 · 슬롯 {activeSlot + 1} · {s?.name || "영웅 미선택"}
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-extrabold text-slate-600">세트</div>
                <select
                  value={s?.build?.set || ""}
                  onChange={(e) => updateBuild(activeTeam, activeSlot, { set: e.target.value })}
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
                <div className="text-[11px] font-extrabold text-slate-600">속공</div>
                <input
                  type="number"
                  inputMode="numeric"
                  value={Number.isFinite(s?.build?.speed) ? s.build.speed : ""}
                  onChange={(e) => {
                    const v2 = e.target.value;
                    updateBuild(activeTeam, activeSlot, { speed: v2 === "" ? null : Number(v2) });
                  }}
                  placeholder="예) 81"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                  disabled={!s?.hero_key}
                />
              </div>

              <div>
                <div className="text-[11px] font-extrabold text-slate-600">무기 메인옵 1</div>
                <select
                  value={s?.build?.weapon?.main1 || ""}
                  onChange={(e) => updateWeapon(activeTeam, activeSlot, "main1", e.target.value)}
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
                  value={s?.build?.weapon?.main2 || ""}
                  onChange={(e) => updateWeapon(activeTeam, activeSlot, "main2", e.target.value)}
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
                  value={s?.build?.armor?.main1 || ""}
                  onChange={(e) => updateArmor(activeTeam, activeSlot, "main1", e.target.value)}
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
                  value={s?.build?.armor?.main2 || ""}
                  onChange={(e) => updateArmor(activeTeam, activeSlot, "main2", e.target.value)}
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
                <div className="text-[11px] font-extrabold text-slate-600">부옵</div>
                <input
                  value={s?.build?.subOption || ""}
                  onChange={(e) => updateBuild(activeTeam, activeSlot, { subOption: e.target.value })}
                  placeholder="예) 약공80/치확70/모공4000"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                  disabled={!s?.hero_key}
                />
              </div>

              <div>
                <div className="text-[11px] font-extrabold text-slate-600">메모</div>
                <input
                  value={s?.build?.note || ""}
                  onChange={(e) => updateBuild(activeTeam, activeSlot, { note: e.target.value })}
                  placeholder="자유 메모"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                  disabled={!s?.hero_key}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          ✅ 영웅 선택 모달
          ========================= */}
      {pickerOpen ? (
        <HeroPickerModal
          heroesList={heroesList}
          onClose={() => setPickerOpen(false)}
          onPick={(hero) => {
            updateTeamSlot(pickerTeam, pickerSlot, {
              hero_key: hero.key,
              name: hero.name,
              image: hero.image,
              build: defaultBuild(),
            });
            setActiveTeam(pickerTeam);
            setActiveSlot(pickerSlot);
            setPickerOpen(false);
          }}
        />
      ) : null}

      {/* =========================
          ✅ 펫 선택 모달
          ========================= */}
      {petPickerOpen ? (
        <PetPickerModal
          petList={petList}
          onClose={() => setPetPickerOpen(false)}
          onPick={(pet) => {
            // ✅ 어떤 구조든 최종적으로 "확장자 포함 파일명"으로 저장
            const raw = pet?.filename || pet?.image || pet?.key || "";
            updateTeam(activeTeam, { pet: normalizePetFilename(raw) });
            resetPetBroken(activeTeam);
            setPetPickerOpen(false);
          }}
        />
      ) : null}
    </PageShell>
  );
}

/* =========================
   ✅ Hero Picker Modal
   ========================= */
function HeroPickerModal({ heroesList, onClose, onPick }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = (q || "").trim().toLowerCase();
    const list = Array.isArray(heroesList) ? heroesList : [];
    if (!query) return list;
    return list.filter((h) => {
      const n = (h.name || "").toLowerCase();
      const k = (h.key || "").toLowerCase();
      return n.includes(query) || k.includes(query);
    });
  }, [q, heroesList]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200">
          <div>
            <div className="font-black text-slate-900">영웅 선택</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-500">한글 이름/키로 검색</div>
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
                onClick={() => onPick(h)}
                className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 p-3 text-left"
                type="button"
              >
                <img src={heroImg(h.image)} alt={h.name} className="w-full h-16 object-contain" loading="lazy" />
                <div className="mt-2 text-[12px] font-extrabold text-slate-900 truncate">{h.name}</div>
                <div className="text-[11px] font-semibold text-slate-500 truncate">{h.key}</div>
              </button>
            ))}
          </div>

          {!filtered.length ? <div className="mt-4 text-[12px] font-semibold text-slate-500">검색 결과가 없습니다.</div> : null}
        </div>
      </div>
    </div>
  );
}

/* =========================
   ✅ Pet Picker Modal
   ========================= */
function PetPickerModal({ petList, onClose, onPick }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = (q || "").trim().toLowerCase();
    const list = Array.isArray(petList) ? petList : [];
    if (!qq) return list;
    return list.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const key = (p.key || "").toLowerCase();
      const fn = String(p.filename || filenameFromImagePath(p.image) || "").toLowerCase();
      return name.includes(qq) || key.includes(qq) || fn.includes(qq);
    });
  }, [q, petList]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200">
          <div>
            <div className="font-black text-slate-900">펫 선택</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-500">이름/키/파일명으로 검색</div>
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
            placeholder="예: 연지 / yeonji ..."
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
          />

          <div className="mt-3 max-h-[60vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-5 gap-2">
            {filtered.map((p) => {
              const fn = normalizePetFilename(p?.filename || p?.image || p?.key || "");
              const src = p?.image ? p.image : petImgPrimary(fn);

              return (
                <button
                  key={p.key || fn}
                  type="button"
                  onClick={() => onPick(p)}
                  className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 p-3 text-left"
                >
                  <div className="w-full h-16 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                    <img
                      src={src}
                      alt={p.name || p.key || fn}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const cur = e.currentTarget;

                        // 1) json image가 깨지면 /images/pets로 시도
                        if (cur.dataset.stage !== "1") {
                          cur.dataset.stage = "1";
                          cur.src = petImgPrimary(fn);
                          return;
                        }

                        // 2) /images/pets도 깨지면 /images/heroes로 시도
                        if (cur.dataset.stage !== "2") {
                          cur.dataset.stage = "2";
                          cur.src = petImgFallback(fn);
                          return;
                        }

                        // 3) 그래도 안되면 placeholder로 종료 (요청 증가 방지)
                        cur.onerror = null;
                        cur.src =
                          "data:image/svg+xml;charset=utf-8," +
                          encodeURIComponent(
                            `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-size="12">NO IMG</text></svg>`
                          );
                      }}
                    />
                  </div>

                  <div className="mt-2 text-[12px] font-extrabold text-slate-900 truncate">{p.name || p.key || fn}</div>
                  <div className="text-[11px] font-semibold text-slate-500 truncate">{fn}</div>
                </button>
              );
            })}
          </div>

          {!filtered.length ? <div className="mt-4 text-[12px] font-semibold text-slate-500">검색 결과가 없습니다.</div> : null}
        </div>
      </div>
    </div>
  );
}
