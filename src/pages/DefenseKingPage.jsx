// src/pages/DefenseKingPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Crown, Plus, Pencil, Trash2, X } from "lucide-react";

const heroImg = (src) => (src?.startsWith("/images/") ? src : `/images/heroes/${src || ""}`);
const ringImg = (key) => `/images/ring/${key}.png`;
const engraveImg = (key) => `/images/ring/${key}.png`;
const skillImg = (s) => (s?.startsWith("/images/") ? s : `/images/skills/${s || ""}`);

// ✅ 펫 이미지 유틸 (DB에는 pet이 없을 수도 있으니 안전하게)
const petImg = (src) => {
  const s = String(src || "");
  if (!s) return "";
  if (s.startsWith("/images/")) return s;
  if (s.includes("/")) return s; // 상대경로/URL이면 그대로
  // 기본: /images/pets/ 폴더 사용 (너 폴더명 다르면 여기만 수정)
  return `/images/pets/${s}`;
};

// ✅ row.pet에서 안전하게 꺼내기
function readPet(row) {
  const p = row?.pet;
  if (!p) return null;

  // 1) json 형태: {key,name,image}
  if (typeof p === "object") {
    const key = String(p.key || "").trim();
    const name = String(p.name || key || "").trim();
    const image = String(p.image || "").trim();
    if (!key && !image && !name) return null;
    return { key, name, image };
  }

  // 2) 문자열 형태: "ru.png" 또는 "ru" 등
  const s = String(p).trim();
  if (!s) return null;
  return { key: s, name: s, image: s };
}

export default function DefenseKingPage({ embedded = false, guildId: embeddedGuildId = null }) {
  const navigate = useNavigate();

  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [guildId, setGuildId] = useState(embeddedGuildId);
  const [rows, setRows] = useState([]);

  const [me, setMe] = useState(null);

  // 삭제
  const [deleting, setDeleting] = useState({});
  const [actionErr, setActionErr] = useState({});

  // ✅ DB 세팅 모달
  const [openBuild, setOpenBuild] = useState(null); // { title, hero, entry, slotIndex }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data?.user ?? null));
  }, []);

  // 길드ID 확보
  useEffect(() => {
    const run = async () => {
      if (embeddedGuildId) {
        setLoadingBase(false);
        return;
      }

      setLoadingBase(true);
      setErrMsg("");

      try {
        const { data: userRes, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;

        const uid = userRes?.user?.id;
        if (!uid) {
          navigate("/login", { replace: true });
          return;
        }

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
             // 🔽🔽🔽 여기부터 추가 🔽🔽🔽
      const { data: gRow, error: gErr } = await supabase
        .from("guilds")
        .select("id,name,parent_guild_id")
        .eq("id", mem.guild_id)
        .maybeSingle();
      if (gErr) throw gErr;

      // ✅ 백우회면 parent_guild_id(천우회)로, 아니면 자기 길드
      setGuildId(gRow?.parent_guild_id || gRow?.id || mem.guild_id);
      // 🔼🔼🔼 여기까지 추가 🔼🔼🔼

      } catch (e) {
        setErrMsg(e?.message ? String(e.message) : "알 수 없는 오류");
      } finally {
        setLoadingBase(false);
      }
    };

    run();
  }, [navigate, embeddedGuildId]);

  const load = async () => {
    if (!guildId) return;
    setLoadingList(true);
    setErrMsg("");

    try {
      // ✅ 너가 DB에 pet 컬럼을 아직 안 만들었으면 select에 pet 넣으면 에러남.
      // 👉 pet 컬럼을 실제로 추가한 뒤에만 아래 주석을 풀어.
      const SELECT = "id,guild_id,user_id,nickname,defense_count,note,created_at,team,skills,equipment,pet"; // + ",pet"

      const { data, error } = await supabase
        .from("guild_defense_king_entries")
        .select(SELECT)
        .eq("guild_id", guildId)
        .order("defense_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrMsg(e?.message ? String(e.message) : "목록 로드 실패");
      setRows([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const canManage = (row) => {
    if (!me?.id) return false;
    return String(row?.user_id || "") === String(me.id);
  };

  const goCreate = () => navigate("/guild-manage/defense-king/create");
  const goEdit = (id) => navigate(`/guild-manage/defense-king/edit?id=${id}`);

  const remove = async (id) => {
    const ok = window.confirm("이 항목을 삭제할까요?");
    if (!ok) return;

    setActionErr((p) => ({ ...p, [id]: "" }));
    setDeleting((p) => ({ ...p, [id]: true }));

    try {
      const { error } = await supabase.from("guild_defense_king_entries").delete().eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setActionErr((p) => ({ ...p, [id]: e?.message || "삭제 실패" }));
    } finally {
      setDeleting((p) => ({ ...p, [id]: false }));
    }
  };

  const list = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);

  if (loadingBase) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5 text-sm font-semibold text-slate-600">
        불러오는중...
      </div>
    );
  }

  return (
    <>
      <div className={embedded ? "" : "min-h-screen bg-slate-50"}>
        <div className={embedded ? "" : "mx-auto w-full max-w-6xl px-4 py-8 lg:py-10"}>
          {!embedded ? (
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div
                className="h-28 lg:h-32 w-full"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(99,102,241,0.16), rgba(16,185,129,0.12))",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-5 lg:px-8">
                <div className="min-w-0">
                  <div className="text-[12px] font-extrabold text-slate-500">방어왕</div>
                  <div className="mt-1 text-[22px] lg:text-[28px] font-black text-slate-900">
                    방어횟수 랭킹
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                    <Crown size={14} strokeWidth={2.6} />
                    {loadingList ? "불러오는중..." : `총 ${list.length}개`}
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
          ) : null}

          <div className={embedded ? "mt-0" : "mt-6"}>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-[12px] font-extrabold text-slate-500">랭킹</div>
                <div className="mt-1 text-[16px] font-black text-slate-900">방어횟수 높은 순</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={load}
                  className="rounded-xl px-4 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
                >
                  새로고침
                </button>

                <button
                  type="button"
                  onClick={goCreate}
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Plus size={16} strokeWidth={2.6} />
                  방어왕 추가
                </button>
              </div>
            </div>

            {errMsg ? (
              <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-5">
                <div className="text-[13px] font-extrabold text-rose-700">오류</div>
                <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">
                  {errMsg}
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-4">
              {loadingList ? (
                <div className="col-span-full rounded-3xl border border-slate-200 bg-white shadow-sm p-5 text-sm font-semibold text-slate-600">
                  불러오는중...
                </div>
              ) : list.length === 0 ? (
                <div className="col-span-full rounded-3xl border border-slate-200 bg-white shadow-sm p-5">
                  <div className="text-[14px] font-black text-slate-900">등록 없음</div>
                  <div className="mt-1 text-[12px] font-semibold text-slate-600">
                    “방어왕 추가”로 첫 등록을 해줘.
                  </div>
                </div>
              ) : (
                list.map((r, rankIdx) => {
                  const mine = canManage(r);
                  const teamArr = Array.isArray(r.team) ? r.team : [];
                  const skillsArr = Array.isArray(r.skills) ? r.skills : [];
                  const pet = readPet(r); // ✅ 펫 읽기

                  return (
                    <div key={r.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                              <Crown size={14} strokeWidth={2.6} />#{rankIdx + 1}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[12px] font-extrabold text-amber-800">
                              {Number(r.defense_count) || 0}회
                            </span>
                          </div>

                          <div className="mt-2 text-[16px] font-black text-slate-900 truncate">
                            {r.nickname || "(닉네임 없음)"}
                          </div>
                          <div className="mt-1 text-[12px] font-semibold text-slate-500">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                          </div>
                        </div>

                        {mine ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => goEdit(r.id)}
                              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                            >
                              <Pencil size={14} />
                              수정
                            </button>

                            <button
                              type="button"
                              disabled={!!deleting[r.id]}
                              onClick={() => remove(r.id)}
                              className={[
                                "inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold border",
                                deleting[r.id]
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50",
                              ].join(" ")}
                            >
                              <Trash2 size={14} />
                              삭제
                            </button>
                          </div>
                        ) : null}
                      </div>

                      {actionErr[r.id] ? (
                        <div className="mt-2 text-[12px] font-semibold text-rose-600 break-all">
                          {actionErr[r.id]}
                        </div>
                      ) : null}

                     

                      {/* ✅ 영웅(클릭 = DB 세팅 모달) */}
                      {teamArr.length > 0 ? (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-[12px] font-extrabold text-slate-600">영웅</div>
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            {teamArr.slice(0, 3).map((h, i) => {
                              const title = h?.name || `슬롯 ${i + 1}`;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setOpenBuild({ entry: r, hero: h, title, slotIndex: i })}
                                  className="rounded-3xl border border-slate-200 bg-white hover:bg-slate-50 hover:ring-2 hover:ring-slate-200 p-3 text-left transition"
                                >
                                  <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                                    {h?.image ? (
                                      <img src={heroImg(h.image)} alt={title} className="w-full h-full object-contain" />
                                    ) : (
                                      <div className="text-[12px] font-extrabold text-slate-400">선택</div>
                                    )}
                                  </div>
                                  <div className="mt-2 text-[12px] font-black text-slate-900 truncate">{title}</div>
                                  <div className="text-[11px] font-semibold text-slate-500">클릭: 세팅 보기</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
 {/* ✅ 펫 (있을 때만 표시) */}
                      {pet ? (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-[12px] font-extrabold text-slate-600">펫</div>
                          <div className="mt-3 flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                              <img
                                src={petImg(pet.image || pet.key)}
                                alt={pet.name || pet.key}
                                className="w-full h-full object-contain"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-black text-slate-900 truncate">
                                {pet.name || pet.key}
                              </div>
                              <div className="text-[11px] font-semibold text-slate-500 truncate">
                                {pet.key || "-"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {/* ✅ 스킬 */}
                      {skillsArr.length > 0 ? (
                        <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-[12px] font-extrabold text-slate-600">스킬</div>
                          <div className="mt-3 flex items-center gap-2">
                            {skillsArr.slice(0, 3).map((s, i) => (
                              <div
                                key={i}
                                className="h-11 w-11 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center"
                                title={s}
                              >
                                <img
                                  src={skillImg(s)}
                                  alt={s}
                                  className="w-full h-full object-contain"
                                  onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {String(r.note || "").trim() ? (
                        <div className="mt-4 text-[12px] font-semibold text-slate-600 whitespace-pre-wrap">
                          ※ {r.note}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ DB 세팅 모달 */}
      {openBuild ? (
        <DbBuildModal
          open
          title={openBuild.title}
          hero={openBuild.hero}
          entry={openBuild.entry}
          slotIndex={openBuild.slotIndex}
          onClose={() => setOpenBuild(null)}
        />
      ) : null}
    </>
  );
}

// =========================
// ✅ DB 세팅 모달: “내가 등록한 DB(team jsonb)”에서 그대로 표시
// =========================
function DbBuildModal({ open, title, hero, entry, slotIndex = 0, onClose }) {
  if (!open) return null;

  const h = hero || {};
  const equipArr = Array.isArray(entry?.equipment) ? entry.equipment : [];
  const build = equipArr[slotIndex] || {};
  const weapon = build.weapon || {};
  const armor = build.armor || {};

  const ringKey = h.ring_key || null;
  const engraveKey = h.engrave_key || null;

  const Row = ({ label, value, mono = false }) => (
    <div className="grid grid-cols-[80px_1fr] gap-2 py-1.5">
      <div className="text-[11px] font-extrabold text-slate-500">{label}</div>
      <div className={["text-[12px] font-extrabold text-slate-900 break-words", mono ? "font-mono" : ""].join(" ")}>
        {value}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-end lg:items-center justify-center p-3">
      <div className="w-full max-w-[360px] sm:max-w-md lg:max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[80vh] lg:max-h-none flex flex-col lg:block">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[12px] font-extrabold text-slate-500">방어왕 세팅</div>
            <div className="text-[16px] font-black text-slate-900 truncate">{title}</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-600 truncate">
              {entry?.nickname || ""} · {Number(entry?.defense_count || 0)}회
            </div>
          </div>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
            type="button"
            aria-label="close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 bg-slate-50 overflow-y-auto lg:overflow-visible">
          {/* 반지/세공 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-[12px] font-extrabold text-slate-600">반지 / 세공</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                  {ringKey ? <img src={ringImg(ringKey)} alt="" className="w-full h-full object-contain" /> : null}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-extrabold text-slate-700">반지</div>
                  <div className="text-[12px] font-semibold text-slate-500 truncate">{ringKey || "-"}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                  {engraveKey ? <img src={engraveImg(engraveKey)} alt="" className="w-full h-full object-contain" /> : null}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-extrabold text-slate-700">세공</div>
                  <div className="text-[12px] font-semibold text-slate-500 truncate">{engraveKey || "-"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 장비/옵션 */}
          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-[12px] font-extrabold text-slate-600">장비</div>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <Row label="세트" value={(build.set && String(build.set).trim()) || "-"} />
              <Row label="속공" value={Number.isFinite(build.speed) ? String(build.speed) : "-"} />
              <div className="my-2 h-px bg-slate-200" />
              <Row label="무기1" value={(weapon.main1 && String(weapon.main1).trim()) || "-"} />
              <Row label="무기2" value={(weapon.main2 && String(weapon.main2).trim()) || "-"} />
              <Row label="방어1" value={(armor.main1 && String(armor.main1).trim()) || "-"} />
              <Row label="방어2" value={(armor.main2 && String(armor.main2).trim()) || "-"} />
              <div className="my-2 h-px bg-slate-200" />
              <Row label="부옵" value={(build.subOption && String(build.subOption).trim()) || "-"} mono />
              <Row label="메모" value={(build.note && String(build.note).trim()) || "-"} />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="rounded-2xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
            type="button"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
