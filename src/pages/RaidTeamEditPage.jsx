import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageShell from "../components/PageShell";

import heroesList from "../data/heroes.json";
import skillImages from "../data/skillImages.json";
import { getRaidBossLabel } from "../data/raidBossOptions";
import { supabase } from "../lib/supabaseClient";

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

const defaultSkillOrder = () => ({
  skills: [
    { stageTitle: "1스테이지", images: [] },
    { stageTitle: "2스테이지", images: [] },
    { stageTitle: "3스테이지", images: [] },
  ],
});

const deepClone = (v) => JSON.parse(JSON.stringify(v));

function filenameFromImagePath(p) {
  if (!p) return "";
  const s = String(p);
  const parts = s.split("/");
  return parts[parts.length - 1] || "";
}

function findHeroByKey(heroKey) {
  const list = Array.isArray(heroesList) ? heroesList : [];
  return list.find((h) => h.key === heroKey) || null;
}

function normalizeSkillImageToFilename(x) {
  if (!x) return "";
  const s = String(x);
  if (s.includes("/")) return filenameFromImagePath(s);
  return s;
}

export default function RaidTeamEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const postId = useMemo(() => (id || "").trim(), [id]);

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [bossKey, setBossKey] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [title, setTitle] = useState("");
  const [tagText, setTagText] = useState("");
  const [teamNote, setTeamNote] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const [activeSlot, setActiveSlot] = useState(0);
  const [slots, setSlots] = useState(() =>
    Array.from({ length: 5 }, () => ({
      hero_key: "",
      name: "",
      image: "",
      build: defaultBuild(),
    }))
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState(0);

  const [skillOrder, setSkillOrder] = useState(() => defaultSkillOrder());
  const [activeStageIdx, setActiveStageIdx] = useState(2);
  const [skillQ, setSkillQ] = useState("");

  useEffect(() => {
    const run = async () => {
      setLoadingMe(true);
      const { data } = await supabase.auth.getUser();
      const user = data?.user ?? null;
      setMe(user);
      setLoadingMe(false);

      if (!user) {
        navigate("/login", { replace: true });
      }
    };
    run();
  }, [navigate]);

  useEffect(() => {
    const run = async () => {
      setErr("");
      if (!postId) {
        setErr("잘못된 접근입니다. (id 없음)");
        setLoadingPage(false);
        return;
      }

      setLoadingPage(true);
      try {
        const { data: post, error: postErr } = await supabase
          .from("raid_team_posts")
          .select("id,boss_key,title,tags,note,skill_order,created_by,anonymous")
          .eq("id", postId)
          .maybeSingle();

        if (postErr) throw postErr;
        if (!post) {
          setErr("게시글을 찾을 수 없습니다.");
          setLoadingPage(false);
          return;
        }

        setBossKey(String(post.boss_key || ""));
        setCreatedBy(post.created_by || "");
        setTitle(post.title || "");
        setTagText(Array.isArray(post.tags) ? post.tags.join(", ") : "");
        setTeamNote(post.note || "");
        setAnonymous(!!post.anonymous);

        const { data: members, error: memErr } = await supabase
          .from("raid_team_members")
          .select("slot,hero_key,hero_name,hero_image,build")
          .eq("post_id", postId)
          .order("slot", { ascending: true });

        if (memErr) throw memErr;

        const nextSlots = Array.from({ length: 5 }, () => ({
          hero_key: "",
          name: "",
          image: "",
          build: defaultBuild(),
        }));

        for (const m of members || []) {
          const slotIdx = (Number(m.slot || 1) || 1) - 1;
          if (slotIdx < 0 || slotIdx > 4) continue;

          const hk = m.hero_key || "";
          const hero = hk ? findHeroByKey(hk) : null;
          const img = m.hero_image || hero?.image || "";

          nextSlots[slotIdx] = {
            hero_key: hk,
            name: m.hero_name || hero?.name || "",
            image: img,
            build: m.build ? { ...defaultBuild(), ...m.build } : defaultBuild(),
          };
        }

        setSlots(nextSlots);

        const one = post.skill_order || defaultSkillOrder();
        const normalized = deepClone(one);

        normalized.skills = Array.isArray(normalized.skills)
          ? normalized.skills.map((st, i) => {
              const title = st?.stageTitle || `${i + 1}스테이지`;
              const imgs = Array.isArray(st?.images) ? st.images : [];
              return {
                stageTitle: title,
                images: imgs.map(normalizeSkillImageToFilename).filter(Boolean),
              };
            })
          : defaultSkillOrder().skills;

        setSkillOrder(normalized);
        setActiveStageIdx(2);
        setLoadingPage(false);
      } catch (e) {
        setErr(e?.message || "불러오기 실패");
        setLoadingPage(false);
      }
    };

    run();
  }, [postId]);

  const isMine = useMemo(() => {
    return !!(me?.id && createdBy && me.id === createdBy);
  }, [me?.id, createdBy]);

  const tags = useMemo(() => {
    const raw = (tagText || "").trim();
    if (!raw) return [];
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [tagText]);

  const s = slots[activeSlot];

  const filteredSkillImages = useMemo(() => {
    const qq = (skillQ || "").trim().toLowerCase();
    const list = Array.isArray(skillImages) ? skillImages : [];
    if (!qq) return list;
    return list.filter((x) => {
      const k = (x.key || "").toLowerCase();
      const n = (x.name || "").toLowerCase();
      return k.includes(qq) || n.includes(qq);
    });
  }, [skillQ]);

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
    if (!postId) return "id가 올바르지 않습니다.";
    if (!bossKey) return "boss 정보를 찾을 수 없습니다.";
    if (!title.trim()) return "팀 제목을 입력해주세요.";
    for (let i = 0; i < 5; i++) {
      if (!slots[i].hero_key) return `영웅 ${i + 1}번 슬롯이 비어있습니다.`;
    }
    return "";
  };

  const pushSkillImageToStage = (stageIdx, imgFilename) => {
    if (!imgFilename) return;
    setSkillOrder((prev) => {
      const next = deepClone(prev || defaultSkillOrder());
      const stage = next?.skills?.[stageIdx];
      if (!stage) return prev;
      stage.images = Array.isArray(stage.images) ? stage.images : [];
      stage.images.push(imgFilename);
      return next;
    });
  };

  const undoStage = (stageIdx) => {
    setSkillOrder((prev) => {
      const next = deepClone(prev || defaultSkillOrder());
      const stage = next?.skills?.[stageIdx];
      if (!stage?.images?.length) return prev;
      stage.images.pop();
      return next;
    });
  };

  const clearStage = (stageIdx) => {
    setSkillOrder((prev) => {
      const next = deepClone(prev || defaultSkillOrder());
      const stage = next?.skills?.[stageIdx];
      if (!stage) return prev;
      stage.images = [];
      return next;
    });
  };

  const removeOneAt = (stageIdx, index) => {
    setSkillOrder((prev) => {
      const next = deepClone(prev || defaultSkillOrder());
      const stage = next?.skills?.[stageIdx];
      if (!stage?.images?.length) return prev;
      stage.images.splice(index, 1);
      return next;
    });
  };

  const save = async () => {
    setErr("");

    if (!me?.id) {
      setErr("로그인이 필요합니다.");
      return;
    }
    if (!isMine) {
      setErr("본인이 작성한 글만 수정할 수 있습니다.");
      return;
    }

    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setSaving(true);
    try {
      const { error: postErr } = await supabase
        .from("raid_team_posts")
        .update({
          title: title.trim(),
          tags,
          note: teamNote || "",
          anonymous: !!anonymous,
          skill_order: skillOrder,
        })
        .eq("id", postId);

      if (postErr) throw postErr;

      const { error: delErr } = await supabase
        .from("raid_team_members")
        .delete()
        .eq("post_id", postId);

      if (delErr) throw delErr;

      const memberPayload = slots.map((x, idx) => ({
        post_id: postId,
        slot: idx + 1,
        hero_key: x.hero_key,
        hero_name: x.name,
        hero_image: x.image,
        build: x.build || {},
      }));

      const { error: insErr } = await supabase
        .from("raid_team_members")
        .insert(memberPayload);

      if (insErr) throw insErr;

      navigate(`/raid/${encodeURIComponent(bossKey)}`);
    } catch (e) {
      setErr(e?.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const currentStage = skillOrder?.skills?.[activeStageIdx] || {
    stageTitle: `${activeStageIdx + 1}스테이지`,
    images: [],
  };

  return (
    <PageShell
      title="레이드 팀 수정"
      right={
        <button
          onClick={() => navigate(`/raid/${encodeURIComponent(bossKey)}`)}
          className="rounded-xl px-3 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
        >
          ← 돌아가기
        </button>
      }
    >
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-[12px] font-extrabold text-slate-500">
            {getRaidBossLabel(bossKey)}{" "}
            {loadingMe ? (
              <span className="ml-2 text-slate-400">(유저 확인중)</span>
            ) : null}
            {loadingPage ? (
              <span className="ml-2 text-slate-400">(불러오는 중)</span>
            ) : null}
          </div>

          <button
            onClick={save}
            disabled={saving || loadingPage || !isMine}
            className="rounded-2xl px-3 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-60"
            title={!isMine ? "본인 글만 수정 가능" : ""}
          >
            {saving ? "저장중..." : "저장"}
          </button>
        </div>

        <div className="p-5 space-y-4">
          {err ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
              <div className="text-[12px] font-extrabold">오류</div>
              <div className="mt-1 text-[12px] font-semibold break-all">{err}</div>
            </div>
          ) : null}

          {!loadingPage && !isMine ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
              <div className="text-[12px] font-extrabold">
                본인이 작성한 글만 수정할 수 있습니다.
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-[12px] font-extrabold text-slate-600">팀 제목</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 안정형 / 저스펙용 / 2방컷"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
              disabled={!isMine}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-extrabold text-slate-600">
                  작성자 표시
                </div>
                <div className="mt-1 text-[12px] font-semibold text-slate-500">
                  익명으로 설정하면 목록/상세에서 닉네임이 숨겨집니다.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!isMine}
                  onClick={() => setAnonymous(true)}
                  className={[
                    "rounded-2xl px-3 py-2 text-[12px] font-extrabold border transition disabled:opacity-60",
                    anonymous
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                  aria-pressed={anonymous}
                >
                  익명
                </button>
                <button
                  type="button"
                  disabled={!isMine}
                  onClick={() => setAnonymous(false)}
                  className={[
                    "rounded-2xl px-3 py-2 text-[12px] font-extrabold border transition disabled:opacity-60",
                    !anonymous
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                  aria-pressed={!anonymous}
                >
                  닉네임 표시
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-[12px] font-extrabold text-slate-600">설명(tags)</div>
            <input
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="콤마(,)로 구분. 예) 안정형,2방컷"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
              disabled={!isMine}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-[12px] font-extrabold text-slate-600">팀 메모</div>
            <textarea
              value={teamNote}
              onChange={(e) => setTeamNote(e.target.value)}
              placeholder="예) 안정적 대신 느림 / 블랙로즈 필수"
              className="mt-2 w-full min-h-[100px] rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
              disabled={!isMine}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div>
              <div className="text-[12px] font-extrabold text-slate-600">스킬 순서</div>
              <div className="mt-1 text-[12px] font-semibold text-slate-500">
                스테이지(1/2/3) 선택 후, 아래 스킬 이미지를 클릭하면 순서대로 쌓입니다.
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {[0, 1, 2].map((i) => {
                const on = i === activeStageIdx;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveStageIdx(i)}
                    disabled={!isMine}
                    className={`px-3 py-2 rounded-2xl border text-[12px] font-extrabold transition disabled:opacity-60 ${
                      on
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {i + 1}스테이지
                  </button>
                );
              })}

              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => undoStage(activeStageIdx)}
                  disabled={!isMine}
                  className="px-3 py-2 rounded-2xl border border-slate-200 bg-white text-[12px] font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  ← 되돌리기
                </button>
                <button
                  type="button"
                  onClick={() => clearStage(activeStageIdx)}
                  disabled={!isMine}
                  className="px-3 py-2 rounded-2xl border border-rose-200 bg-rose-50 text-[12px] font-extrabold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  스테이지 초기화
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[12px] font-extrabold text-slate-700">
                {currentStage?.stageTitle || `${activeStageIdx + 1}스테이지`} ·{" "}
                {(currentStage?.images || []).length}개
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {(currentStage?.images || []).map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => removeOneAt(activeStageIdx, idx)}
                    disabled={!isMine}
                    className="relative w-10 h-10 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center disabled:opacity-60"
                    title={`클릭하면 삭제 (${idx + 1}번)`}
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
                  </button>
                ))}
                {!((currentStage?.images || []).length) ? (
                  <div className="text-[12px] font-semibold text-slate-400">
                    (비어있음) 아래에서 스킬을 눌러 추가하세요.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-extrabold text-slate-600">
                  스킬 이미지 선택
                </div>
                <input
                  value={skillQ}
                  onChange={(e) => setSkillQ(e.target.value)}
                  placeholder="검색: 루리 / luri2 ..."
                  className="w-[240px] max-w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                  disabled={!isMine}
                />
              </div>

              <div className="mt-2 max-h-[320px] overflow-y-auto grid grid-cols-3 sm:grid-cols-6 gap-2">
                {filteredSkillImages.map((x) => {
                  const filename = filenameFromImagePath(x.image);
                  return (
                    <button
                      key={x.key}
                      type="button"
                      onClick={() => pushSkillImageToStage(activeStageIdx, filename)}
                      disabled={!isMine}
                      className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 p-2 text-left disabled:opacity-60"
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

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[12px] font-extrabold text-slate-600">
              영웅 5명 (클릭해서 장비 수정)
            </div>

            <div className="mt-3 overflow-x-auto">
              <div className="min-w-[560px] grid grid-cols-5 gap-2">
                {slots.map((x, idx) => {
                  const on = idx === activeSlot;

                  return (
                    <div
                      key={idx}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveSlot(idx)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setActiveSlot(idx);
                      }}
                      className={`rounded-2xl border p-3 text-left transition cursor-pointer ${
                        on
                          ? "bg-white border-slate-900 shadow-sm"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-black text-slate-900">
                          슬롯 {idx + 1}
                        </div>
                        <span
                          className={`text-[10px] font-extrabold ${
                            on ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {on ? "편집중" : ""}
                        </span>
                      </div>

                      <div className="mt-2 w-full aspect-square rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                        {x.image ? (
                          <img
                            src={x.image}
                            alt={x.name || "hero"}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-[11px] font-extrabold text-slate-400">
                            선택
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-[12px] font-extrabold text-slate-900 truncate">
                        {x.name || "영웅 미선택"}
                      </div>

                      <button
                        type="button"
                        disabled={!isMine}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPickerSlot(idx);
                          setPickerOpen(true);
                        }}
                        className="mt-2 w-full rounded-xl px-2 py-2 text-[12px] font-extrabold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {x.hero_key ? "변경" : "선택"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-extrabold text-slate-600">장비 편집</div>
                <div className="mt-1 text-[13px] font-black text-slate-900">
                  슬롯 {activeSlot + 1} · {s?.name || "영웅 미선택"}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-extrabold text-slate-600">세트</div>
                <select
                  value={s.build.set}
                  onChange={(e) => updateBuild(activeSlot, { set: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white"
                  disabled={!isMine}
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
                  value={Number.isFinite(s.build.speed) ? s.build.speed : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    updateBuild(activeSlot, { speed: v === "" ? null : Number(v) });
                  }}
                  placeholder="예) 81"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                  disabled={!isMine}
                />
              </div>

              <div>
                <div className="text-[11px] font-extrabold text-slate-600">무기구 메인옵 1</div>
                <select
                  value={s.build.weapon.main1}
                  onChange={(e) => updateWeapon(activeSlot, "main1", e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white"
                  disabled={!isMine}
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
                <div className="text-[11px] font-extrabold text-slate-600">무기구 메인옵 2</div>
                <select
                  value={s.build.weapon.main2}
                  onChange={(e) => updateWeapon(activeSlot, "main2", e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white"
                  disabled={!isMine}
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
                  value={s.build.armor.main1}
                  onChange={(e) => updateArmor(activeSlot, "main1", e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white"
                  disabled={!isMine}
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
                  value={s.build.armor.main2}
                  onChange={(e) => updateArmor(activeSlot, "main2", e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold bg-white"
                  disabled={!isMine}
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
                  value={s.build.subOption}
                  onChange={(e) => updateBuild(activeSlot, { subOption: e.target.value })}
                  placeholder="예) 약공80%/치확70%/모공4000"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                  disabled={!isMine}
                />
              </div>

              <div>
                <div className="text-[11px] font-extrabold text-slate-600">메모</div>
                <input
                  value={s.build.note}
                  onChange={(e) => updateBuild(activeSlot, { note: e.target.value })}
                  placeholder="예) 치확49%/약확24%"
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[12px] font-semibold"
                  disabled={!isMine}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {pickerOpen ? (
        <HeroPickerModal
          heroesList={heroesList}
          onClose={() => setPickerOpen(false)}
          onPick={(hero) => {
            updateSlot(pickerSlot, {
              hero_key: hero.key,
              name: hero.name,
              image: hero.image,
              build: defaultBuild(),
            });
            setActiveSlot(pickerSlot);
            setPickerOpen(false);
          }}
          disabled={!isMine}
        />
      ) : null}
    </PageShell>
  );
}

function HeroPickerModal({ heroesList, onClose, onPick, disabled }) {
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
            <div className="mt-1 text-[12px] font-semibold text-slate-500">
              한글 이름으로 검색
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition"
            aria-label="닫기"
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
                disabled={disabled}
                className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 p-3 text-left disabled:opacity-60"
              >
                <img
                  src={h.image}
                  alt={h.name}
                  className="w-full h-16 object-contain"
                  loading="lazy"
                />
                <div className="mt-2 text-[12px] font-extrabold text-slate-900 truncate">
                  {h.name}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 truncate">
                  {h.key}
                </div>
              </button>
            ))}
          </div>

          {!filtered.length ? (
            <div className="mt-4 text-[12px] font-semibold text-slate-500">
              검색 결과가 없습니다.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}