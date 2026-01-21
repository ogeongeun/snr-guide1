// src/pages/GuildOffenseDetailPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,

  Plus,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Trash2,
} from "lucide-react";

import data from "../data/guildCounter.json";
import equipmentData from "../data/equipmentRecommend.json";
import petImages from "../data/petImages.json";
import EquipmentModal from "../components/EquipmentModal";
import { supabase } from "../lib/supabaseClient";

// ✅ 라플라스 보정 승률(투표 적을 때 튀는거 방지)
const calcRate = (w = 0, l = 0) => {
  const wins = Number(w) || 0;
  const losses = Number(l) || 0;
  return (wins + 3) / (wins + losses + 6);
};

export default function GuildOffenseDetailPage({
  embedded = false,
  entry: embeddedEntry = null,
  category: embeddedCategory = "",
  teamIndex: embeddedTeamIndex = 0,
  variantIdx: embeddedVariantIdx = 0,
  onVariantChange = null,
}) {
  const navigate = useNavigate();
  const { category, teamIndex } = useParams();
  const [searchParams] = useSearchParams();

  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);
  const [openDetailKey, setOpenDetailKey] = useState(null);

  // ✅ DB build 모달
  const [openDbBuild, setOpenDbBuild] = useState(null);

  // ✅ vote optimistic update
  const [voteOverride, setVoteOverride] = useState({});
  const [voteLoading, setVoteLoading] = useState({});
  const [voteErr, setVoteErr] = useState({});

  // ✅ 로그인 유저
  const [me, setMe] = useState(null);

  // ✅ 수정/삭제 로딩/에러 (DB id 기준으로 저장됨)
  const [rowActionLoading, setRowActionLoading] = useState({});
  const [rowActionErr, setRowActionErr] = useState({});

  // ✅ DB counters 로딩
  const [dbCounters, setDbCounters] = useState([]);
  const [dbCountersLoading, setDbCountersLoading] = useState(false);
  const [dbCountersErr, setDbCountersErr] = useState("");

  // ✅ 작성자 닉네임 맵
  const [nameMap, setNameMap] = useState({}); // { [userId]: nickname }

  // ✅ 라우트로 진입한 DB(사용자등록) entry를 DB에서 만들어 쓰기 위한 state
  const [routeDbEntry, setRouteDbEntry] = useState(null);



  // ✅ 카테고리/인덱스/entry 결정
  const decodedCategory = useMemo(() => {
    return embedded
      ? String(embeddedCategory || "")
      : decodeURIComponent(category || "");
  }, [embedded, embeddedCategory, category]);

  const idx = useMemo(() => {
    return embedded ? Number(embeddedTeamIndex || 0) : Number.parseInt(teamIndex, 10);
  }, [embedded, embeddedTeamIndex, teamIndex]);

  // ✅ postId는 embedded 여부와 무관하게 쿼리에서 읽게
  const postIdFromQuery = searchParams.get("postId");
  const routePostId = useMemo(() => {
    const n = postIdFromQuery != null ? Number(postIdFromQuery) : null;
    return Number.isFinite(n) ? n : null;
  }, [postIdFromQuery]);

  // ✅ 라우트 진입인데 DB(사용자등록) 카테고리인 경우
  const isRouteDbCategory = useMemo(() => {
    return !embedded && decodedCategory === "DB(사용자등록)" && !!routePostId;
  }, [embedded, decodedCategory, routePostId]);

  // ✅ 라우트 DB entry 로드 (방어팀 표시용)
  useEffect(() => {
    const run = async () => {
    

      if (!isRouteDbCategory) {
        setRouteDbEntry(null);
        
        return;
      }

    
      try {
        const pid = Number(routePostId);
        if (!Number.isFinite(pid) || pid <= 0) throw new Error("postId가 올바르지 않습니다.");

        const { data: post, error: postErr } = await supabase
          .from("guild_defense_posts")
          .select("id,label,note,tags,skills,created_at")
          .eq("id", pid)
          .maybeSingle();

        if (postErr) throw postErr;
        if (!post?.id) throw new Error("DB 방어글을 찾을 수 없습니다.");

        const { data: members, error: memErr } = await supabase
          .from("guild_defense_members")
          .select("post_id,slot,hero_key,hero_name,hero_image")
          .eq("post_id", pid);

        if (memErr) throw memErr;

        const list = (members || [])
          .slice()
          .sort((a, b) => (a.slot || 0) - (b.slot || 0))
          .slice(0, 3);

        const defenseTeam = [1, 2, 3].map((slot) => {
          const found = list.find((x) => x.slot === slot);
          return {
            hero_key: found?.hero_key || "",
            name: found?.hero_name || "",
            image: found?.hero_image || "",
          };
        });

        setRouteDbEntry({
          source: "db",
          id: post.id,
          label: post.label || "라벨없음",
          note: post.note || "",
          tags: Array.isArray(post.tags) ? post.tags : [],
          skills: Array.isArray(post.skills) ? post.skills : [],
          created_at: post.created_at,
          defenseTeam,
          defenseNotes: [],
          defenseVariants: [], // ✅ 카운터는 아래에서 DB로 로드
          pet: null,
        });
      } catch (e) {
        setRouteDbEntry(null);
       
      } finally {
       
      }
    };

    run();
  }, [isRouteDbCategory, routePostId]);

  // ✅ entry 결정
  const entry = useMemo(() => {
    if (embedded) return embeddedEntry;
    if (isRouteDbCategory) return routeDbEntry;
    return data?.categories?.[decodedCategory]?.[idx];
  }, [embedded, embeddedEntry, isRouteDbCategory, routeDbEntry, decodedCategory, idx]);

  const variantParam = embedded ? null : searchParams.get("variant");
  const parsedVariant = useMemo(() => {
    if (embedded) return Number(embeddedVariantIdx || 0);
    if (variantParam !== null) return Number.parseInt(variantParam, 10);
    return 0;
  }, [embedded, embeddedVariantIdx, variantParam]);

 
  const variants = useMemo(() => {
    return Array.isArray(entry?.defenseVariants) ? entry.defenseVariants : [];
  }, [entry]);

  const safeVariantIdx = useMemo(() => {
    if (!variants.length) return 0;
    const v = Number.isFinite(parsedVariant) ? parsedVariant : 0;
    if (v < 0) return 0;
    if (v >= variants.length) return variants.length - 1;
    return v;
  }, [parsedVariant, variants.length]);

  const currentVariant = useMemo(() => {
    return variants[safeVariantIdx] || null;
  }, [variants, safeVariantIdx]);

  // ✅ DB인지 여부 / postId
  const isDb = entry?.source === "db";
  const postId = useMemo(() => {
    const byEntry =
      entry?.id != null
        ? Number(entry.id)
        : entry?.post_id != null
        ? Number(entry.post_id)
        : null;

    if (Number.isFinite(byEntry)) return byEntry;
    return routePostId ?? null;
  }, [entry, routePostId]);

  // ✅ 로그인 체크(권한/작성자)
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      setMe(data?.user ?? null);
    };
    run();
  }, []);

  // =========================
  // ✅ DB counters + members(build) + 작성자 닉네임 로드
  // =========================
  useEffect(() => {
    const run = async () => {
      setDbCountersErr("");

      // ✅ DB 방어팀 or JSON 방어팀 모두 허용
      const canLoadByPost =
        isDb && Number.isFinite(Number(postId)) && Number(postId) > 0;

      const canLoadByJson =
        !canLoadByPost && decodedCategory && Number.isFinite(idx);

      if (!canLoadByPost && !canLoadByJson) {
        setDbCounters([]);
        setNameMap({});
        return;
      }

      setDbCountersLoading(true);
      try {
        let q = supabase
          .from("guild_offense_counters")
          .select(
            "id,post_id,variant_idx,recommendation,first_attack,note,detail,pets,skills,created_at,wins,losses,created_by,anonymous,speed_mode,speed_min,json_category,json_team_index"
          )
          .eq("variant_idx", Number(safeVariantIdx))
          .order("created_at", { ascending: false });

        if (canLoadByPost) {
          q = q.eq("post_id", Number(postId));
        } else {
          q = q
            .eq("json_category", String(decodedCategory || "").trim())
            .eq("json_team_index", Number(idx));
        }

        const { data: counters, error: cErr } = await q;
        if (cErr) throw cErr;

        const ids = (counters || []).map((x) => x.id).filter(Boolean);
        if (!ids.length) {
          setDbCounters([]);
          setNameMap({});
          setDbCountersLoading(false);
          return;
        }

        const { data: members, error: mErr } = await supabase
          .from("guild_offense_counter_members")
          .select("counter_id, slot, hero_key, hero_name, hero_image, build")
          .in("counter_id", ids)
          .order("slot", { ascending: true });

        if (mErr) throw mErr;

        const byCounter = new Map();
        for (const m of members || []) {
          if (!byCounter.has(m.counter_id)) byCounter.set(m.counter_id, []);
          byCounter.get(m.counter_id).push(m);
        }

        const uids = [
          ...new Set((counters || []).map((c) => c.created_by).filter(Boolean)),
        ];

        if (uids.length) {
          const { data: profs, error: pErr } = await supabase
            .from("profiles")
            .select("user_id,nickname")
            .in("user_id", uids);

          if (!pErr) {
            const m = {};
            for (const r of profs || []) m[r.user_id] = r.nickname;
            setNameMap(m);
          } else {
            setNameMap({});
          }
        } else {
          setNameMap({});
        }

        const mapped = (counters || []).map((c) => {
          const ms = (byCounter.get(c.id) || []).sort(
            (a, b) => (a.slot ?? 0) - (b.slot ?? 0)
          );
          const team = ms.slice(0, 3).map((m) => ({
            hero_key: m.hero_key || "",
            name: m.hero_name || "",
            image: m.hero_image || "",
            build: m.build || {},
          }));

          return {
            id: c.id,
            source: "db",
            firstAttack: !!c.first_attack,
            note: c.note || "",
            detail: c.detail || "",
            skills: Array.isArray(c.skills) ? c.skills : [],
            pet: Array.isArray(c.pets) ? c.pets : [],
            speed_mode: c.speed_mode || "any",
            speed_min: c.speed_min ?? null,
            wins: Number(c.wins || 0),
            losses: Number(c.losses || 0),
            created_by: c.created_by || null,
            anonymous: !!c.anonymous,
            team,
          };
        });

        setDbCounters(mapped);
      } catch (e) {
        setDbCountersErr(e?.message || "DB 카운터 로드 실패");
        setDbCounters([]);
        setNameMap({});
      } finally {
        setDbCountersLoading(false);
      }
    };

    run();
  }, [embedded, decodedCategory, idx, postId, safeVariantIdx, isDb]);

  // =========================
  // ✅ 유틸/렌더
  // =========================
  const heroImg = (src) =>
    src?.startsWith("/images/") ? src : `/images/heroes/${src || ""}`;

  const petImgFromKey = (keyOrPath) => {
    if (!keyOrPath) return "";
    const s = String(keyOrPath);
    if (s.startsWith("/images/")) return s;

    const found = (Array.isArray(petImages) ? petImages : []).find((x) => x.key === s);
    if (found?.image) return found.image;

    return `/images/pet/${s}`;
  };

  const findHeroKeyByName = (name) => {
    const key = Object.keys(equipmentData || {}).find(
      (k) => equipmentData?.[k]?.name === name
    );
    return key || null;
  };

  const hasBuild = (b) => {
    const build = b || {};
    return (
      !!build.set ||
      !!build.subOption ||
      !!build.note ||
      Number.isFinite(build.speed) ||
      !!build.weapon?.main1 ||
      !!build.weapon?.main2 ||
      !!build.armor?.main1 ||
      !!build.armor?.main2
    );
  };

  const openEquipmentByHero = (hero) => {
    if (!hero) return;

    if (hero.hero_key && equipmentData?.[hero.hero_key]) {
      setSelectedHeroKey(hero.hero_key);
      setPresetTag(null);
      return;
    }

    const hk = findHeroKeyByName(hero?.name);
    if (hk) {
      setSelectedHeroKey(hk);
      setPresetTag(hero?.preset || null);
    }
  };

  const SkillStrip = ({ skills, size = "w-9 h-9" }) => {
    if (!Array.isArray(skills) || skills.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {skills.map((img, i) => (
          <img
            key={`${img}-${i}`}
            src={`/images/skills/${img}`}
            alt={`Skill ${i + 1}`}
            className={`${size} border border-slate-200 rounded bg-white`}
            loading="lazy"
          />
        ))}
      </div>
    );
  };

  const renderHeroCard = (hero) => {
    const b = hero?.build || null;
    const buildOn = hasBuild(b);

    return (
      <button
        key={`${hero?.hero_key || hero?.name}-${hero?.image}`}
        type="button"
        onClick={() => {
          if (buildOn) {
            setOpenDbBuild({ heroName: hero?.name || "영웅", build: b || {} });
            return;
          }
          openEquipmentByHero(hero);
        }}
        className="flex flex-col items-center bg-white border border-slate-200 rounded-2xl p-2"
        title={buildOn ? "DB 세팅 있음" : "기본 추천 열기"}
      >
        <img
          src={heroImg(hero?.image)}
          alt={hero?.name}
          className="w-14 h-14 object-contain"
          loading="lazy"
        />
        <p className="text-[11px] mt-1 font-semibold text-slate-700">{hero?.name}</p>
        {buildOn ? (
          <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
        ) : (
          <div className="h-2" />
        )}
      </button>
    );
  };

  const renderPetIcons = (pets) => {
    const list = Array.isArray(pets) ? pets : pets ? [pets] : [];
    if (!list.length) return null;
    return (
      <div className="ml-3 flex flex-col gap-2">
        {list.map((p, i) => (
          <img
            key={`${p}-${i}`}
            src={petImgFromKey(p)}
            alt={`Pet ${i + 1}`}
            className="w-10 h-10 object-contain"
            loading="lazy"
          />
        ))}
      </div>
    );
  };

  // ✅ 속공 조건 칩
  const renderSpeedCondition = (rec) => {
    const mode = String(rec?.speed_mode ?? rec?.speedMode ?? "any");
    const min = rec?.speed_min ?? rec?.speedMin ?? null;

    let label = "무관";
    let tone = "border-slate-200 bg-white text-slate-700";

    if (mode === "win") {
      label = `속공 이길 때${
        Number.isFinite(Number(min)) ? ` (≥${Number(min)})` : ""
      }`;
      tone = "border-emerald-200 bg-emerald-50 text-emerald-700";
    } else if (mode === "lose") {
      label = "속공 질 때";
      tone = "border-indigo-200 bg-indigo-50 text-indigo-700";
    }

    return (
      <div className="mt-3 flex justify-between items-center">
        <div className="text-[12px] font-extrabold text-slate-500">속공 조건</div>
        <span className={`text-[11px] font-extrabold px-2 py-1 rounded-full border ${tone}`}>
          {label}
        </span>
      </div>
    );
  };

  // =========================
  // ✅ 투표 (DB 카운터만 투표 가능)
  // =========================
  const doVote = async (counterId, type) => {
    if (!counterId) return;

    const key = `db-${counterId}`;

    setVoteErr((p) => ({ ...p, [key]: "" }));
    setVoteLoading((p) => ({ ...p, [key]: true }));

    try {
      const { data: rdata, error } = await supabase.rpc("guild_offense_vote", {
        p_counter_id: Number(counterId),
        p_is_win: type === "win",
      });

      if (error) {
        if (error.code === "23505") {
          setVoteErr((p) => ({ ...p, [key]: "이미 오늘 투표했습니다." }));
          return;
        }
        console.log("RPC_ERR_CODE:", error.code);
        console.log("RPC_ERR_MSG:", error.message);
        setVoteErr((p) => ({ ...p, [key]: error.message }));
        return;
      }

      const row = Array.isArray(rdata) ? rdata[0] : rdata;

      const updated = {
        wins: Number(row?.out_wins ?? 0),
        losses: Number(row?.out_losses ?? 0),
      };

      setVoteOverride((p) => ({ ...p, [key]: updated }));
    } catch (e) {
      setVoteErr((p) => ({ ...p, [key]: e?.message || "투표 실패" }));
    } finally {
      setVoteLoading((p) => ({ ...p, [key]: false }));
    }
  };

  const renderWinRateBar = (wins, losses) => {
    const rate = calcRate(wins, losses);
    const pct = Math.max(0, Math.min(100, rate * 100));
    const total = (Number(wins) || 0) + (Number(losses) || 0);

    return (
      <div className="mt-3">
        <div className="flex items-end justify-between">
          <div className="text-[12px] font-extrabold text-slate-700">
            승률 <span className="text-slate-500 font-black">(보정)</span>
          </div>
          <div className="text-[12px] font-black text-slate-900">
            {pct.toFixed(1)}%{" "}
            <span className="text-slate-400 text-[11px] font-extrabold">(투표 {total})</span>
          </div>
        </div>

        <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
        </div>

        
      </div>
    );
  };

  // =========================
  // ✅ 수정/삭제
  // =========================
  const canEditOrDelete = (rec) => {
    if (!me?.id) return false;
    const createdBy = rec?.created_by ?? rec?.createdBy ?? null;
    return createdBy && String(createdBy) === String(me.id);
  };

  const deleteCounter = async (counterId) => {
    if (!counterId) return;
    const ok = window.confirm("정말 이 카운터를 삭제할까요?");
    if (!ok) return;

    setRowActionErr((p) => ({ ...p, [counterId]: "" }));
    setRowActionLoading((p) => ({ ...p, [counterId]: true }));

    try {
      const { error: mErr } = await supabase
        .from("guild_offense_counter_members")
        .delete()
        .eq("counter_id", counterId);
      if (mErr) throw mErr;

      const { error: dErr } = await supabase
        .from("guild_offense_counters")
        .delete()
        .eq("id", counterId);
      if (dErr) throw dErr;

      // ✅ 삭제 키 고정 (voteOverride는 db-키로 관리)
      setVoteOverride((p) => ({ ...p, [`db-${counterId}`]: { __deleted: true } }));
    } catch (e) {
      setRowActionErr((p) => ({ ...p, [counterId]: e?.message || "삭제 실패" }));
    } finally {
      setRowActionLoading((p) => ({ ...p, [counterId]: false }));
    }
  };

  const goEditCounter = (counterId) => {
    navigate(`/guild-offense/counter/edit?id=${counterId}`);
  };

  // =========================
  // ✅ 카운터: JSON + DB 합치기 (JSON은 보기만, DB는 투표 가능)
  // =========================
  const jsonCounters = useMemo(() => {
    if (!currentVariant || !Array.isArray(currentVariant.counters)) return [];

    // ✅ JSON도 고정 key를 부여 (정렬/필터/삭제/리렌더 꼬임 방지)
    return currentVariant.counters.map((x, i) => ({
      ...x,
      source: x?.source || "json",
      _key: x?._key || `json-${decodedCategory}-${idx}-${safeVariantIdx}-${i}`,
    }));
  }, [currentVariant, decodedCategory, idx, safeVariantIdx]);

  const dbOnlyCounters = useMemo(() => {
    return Array.isArray(dbCounters) ? dbCounters : [];
  }, [dbCounters]);

  const baseCounters = useMemo(() => {
    return [...jsonCounters, ...dbOnlyCounters];
  }, [jsonCounters, dbOnlyCounters]);

  // ✅ (중요) 인덱스 j를 쓰지 말고 rec 자체로 고정키 생성
  const getCounterKey = (rec) => {
    if (rec?.source === "db" && rec?.id != null) return `db-${rec.id}`;
    return rec?._key || "json-unknown";
  };

  const sortedCounters = useMemo(() => {
    if (!Array.isArray(baseCounters)) return [];
    return [...baseCounters].sort((a, b) => {
     

      const aKey = getCounterKey(a);
      const bKey = getCounterKey(b);

      const aW = voteOverride[aKey]?.wins ?? a?.wins ?? 0;
      const aL = voteOverride[aKey]?.losses ?? a?.losses ?? 0;
      const bW = voteOverride[bKey]?.wins ?? b?.wins ?? 0;
      const bL = voteOverride[bKey]?.losses ?? b?.losses ?? 0;

      return calcRate(bW, bL) - calcRate(aW, aL);
    });
  }, [baseCounters, voteOverride]);

  const renderCounterCard = (recommended, j) => {
    const detailKey = `${safeVariantIdx}-${getCounterKey(recommended)}`; // ✅ 안정
   

    const key = getCounterKey(recommended);
    if (voteOverride[key]?.__deleted) return null;

    const wins = voteOverride[key]?.wins ?? Number(recommended?.wins ?? 0);
    const losses = voteOverride[key]?.losses ?? Number(recommended?.losses ?? 0);

    const loading = !!voteLoading[key];
    const err = voteErr[key];

    // ✅ 수정/삭제 로딩/에러는 DB id 기준 (여기 버그였음: db-키로 읽고 있었음)
    const isDbCounter = recommended?.source === "db" && recommended?.id != null;
    const dbId = isDbCounter ? Number(recommended.id) : null;

    const actLoading = dbId != null ? !!rowActionLoading[dbId] : false;
    const actErr = dbId != null ? rowActionErr[dbId] : "";

    const canManage = isDbCounter ? canEditOrDelete(recommended) : false;

    // ✅ 익명 표시
    const isAnon = !!recommended?.anonymous;
    const authorId = recommended?.created_by ?? null;
    const nick = authorId ? nameMap[authorId] : null;
    const authorLabel = isDbCounter ? (isAnon ? "익명" : nick || "알수없음") : "기존";

    return (
     <div
  key={key}
  className="relative mb-6 rounded-2xl p-4 bg-white border border-slate-200"
>

     

        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="text-[12px] font-extrabold text-slate-500">카운터 #{j + 1}</div>

            <span className="text-[11px] font-extrabold px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
              {authorLabel}
            </span>

            {!isDbCounter ? (
              <span className="text-[11px] font-extrabold px-2 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700">
                JSON
              </span>
            ) : (
              <span className="text-[11px] font-extrabold px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                DB
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canManage ? (
              <>
                <button
                  type="button"
                  disabled={actLoading}
                  onClick={() => goEditCounter(recommended.id)}
                  className={[
                    "inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold border",
                    actLoading
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <Pencil size={14} />
                  수정
                </button>

                <button
                  type="button"
                  disabled={actLoading}
                  onClick={() => deleteCounter(recommended.id)}
                  className={[
                    "inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold border",
                    actLoading
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50",
                  ].join(" ")}
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              </>
            ) : null}

            {/* ✅ 투표 버튼 (DB 카운터만 가능) */}
        

          </div>
        </div>

        {renderWinRateBar(wins, losses)}
{/* ✅ 투표 버튼 줄 (승률바 아래로 이동) */}
<div className="mt-3 flex justify-end gap-2">
  <button
    type="button"
    disabled={loading || !isDbCounter}
    onClick={() => doVote(recommended.id, "win")}
    className={[
      "inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold border",
      loading || !isDbCounter
        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
        : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
    ].join(" ")}
    title={!isDbCounter ? "DB 카운터만 투표 가능" : "승"}
  >
    <ThumbsUp size={14} />
    승
  </button>

  <button
    type="button"
    disabled={loading || !isDbCounter}
    onClick={() => doVote(recommended.id, "lose")}
    className={[
      "inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold border",
      loading || !isDbCounter
        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
        : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
    ].join(" ")}
    title={!isDbCounter ? "DB 카운터만 투표 가능" : "패"}
  >
    <ThumbsDown size={14} />
    패
  </button>
</div>

        {err ? (
          <div className="mt-2 text-[12px] font-semibold text-rose-600">투표 오류: {err}</div>
        ) : null}

        {actErr ? (
          <div className="mt-2 text-[12px] font-semibold text-rose-600">처리 오류: {actErr}</div>
        ) : null}

        <div className="mt-4 flex justify-center items-start">
          <div className="grid grid-cols-3 gap-2">
            {Array.isArray(recommended?.team) ? recommended.team.slice(0, 3).map(renderHeroCard) : null}
          </div>
          {renderPetIcons(recommended?.pet)}
        </div>

        {renderSpeedCondition(recommended)}

        {Array.isArray(recommended?.skills) && recommended.skills.length > 0 ? (
          <div className="mt-3">
            <div className="text-[12px] font-extrabold text-slate-500 mb-2 text-center">스킬 3개</div>
            <SkillStrip skills={recommended.skills.slice(0, 3)} size="w-9 h-9" />
          </div>
        ) : null}

        {recommended?.note ? (
          <p className="text-[12px] text-slate-600 mt-2 italic">※ {recommended.note}</p>
        ) : null}

        {recommended?.detail ? (
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => setOpenDetailKey(openDetailKey === detailKey ? null : detailKey)}
              className="text-xs px-3 py-1.5 rounded-full border border-slate-200"
            >
              {openDetailKey === detailKey ? "디테일 닫기 ▲" : "공격 디테일 보기 ▼"}
            </button>
          </div>
        ) : null}

        {openDetailKey === detailKey && recommended?.detail ? (
          <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            {recommended.detail}
          </div>
        ) : null}
      </div>
    );
  };

 

  const goAddCounter = () => {
    console.log("[goAddCounter fired]", {
      embedded,
      decodedCategory,
      idx,
      isDb,
      postId,
      href: window.location.href,
    });
    if (isDb && postId) {
      navigate(`/guild-offense/counter/new?defensePostId=${postId}&variant=${safeVariantIdx}`);
      return;
    }

    // ✅ JSON 방어팀
    navigate(
      `/guild-offense/counter/new?jsonCategory=${encodeURIComponent(decodedCategory)}&jsonTeamIndex=${idx}&variant=${safeVariantIdx}`
    );
  };

  // ✅ 삭제 필터도 고정키로
  const visibleCounters = useMemo(() => {
    return sortedCounters.filter((rec) => {
      const key = getCounterKey(rec);
      return !voteOverride[key]?.__deleted;
    });
  }, [sortedCounters, voteOverride]);

  // =========================
  // ✅ 렌더
  // =========================
  if (!entry) {
    return (
      <div className={embedded ? "p-5" : "p-6 max-w-4xl mx-auto"}>
        <p className="text-red-500 text-center text-lg mt-10">해당 팀 데이터를 찾을 수 없습니다.</p>
        {!embedded ? (
          <div className="mt-6 text-center">
            <Link
              to="/guild-offense"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white"
            >
              <ChevronLeft size={16} />
              목록으로
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className={embedded ? "bg-slate-50" : "min-h-screen bg-slate-50 p-6 max-w-4xl mx-auto"}>
        <div className={embedded ? "p-5 pb-0" : ""}>
          <div className="flex items-center justify-between mb-4">
            {!embedded ? (
              <Link
                to="/guild-offense"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white"
              >
                <ChevronLeft size={16} />
                목록
              </Link>
            ) : (
              <div className="text-[12px] font-extrabold text-slate-500">카운터덱</div>
            )}

            <button
              type="button"
              onClick={embedded ? undefined : goAddCounter}
              disabled={embedded}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold",
                embedded
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700",
              ].join(" ")}
              title={embedded ? "PC 우측패널(embedded)에서는 추가를 막습니다. 상세 페이지에서 추가하세요." : ""}
            >
              <Plus size={16} />
              카운터 추가하기
            </button>
          </div>

          {/* 로딩/에러 표시(선택) */}
          {dbCountersLoading ? (
            <div className="mb-4 text-[12px] font-extrabold text-slate-500">DB 카운터 로딩중...</div>
          ) : null}
          {dbCountersErr ? (
            <div className="mb-4 text-[12px] font-extrabold text-rose-600">DB 로드 오류: {dbCountersErr}</div>
          ) : null}

          {visibleCounters.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="text-[13px] font-black text-slate-900">카운터 없음</div>
              <div className="mt-1 text-[12px] font-semibold text-slate-600">
                아직 등록된 카운터가 없습니다.
              </div>
            </div>
          ) : (
            visibleCounters.map((rec, j) => renderCounterCard(rec, j))
          )}
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

      {/* DB 빌드 모달 */}
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

// =========================
// ✅ DB 장비 세팅 모달
// =========================
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
          "text-[12px] font-extrabold text-slate-900 break-words",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-3">
      <div className="w-[92vw] max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
          <div className="text-[12px] font-black text-slate-900 truncate">{heroName} · DB 세팅</div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100"
            type="button"
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
            className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[12px] font-extrabold"
            type="button"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
