// src/pages/GuildDefenseCreatePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Plus, X, ShieldCheck } from "lucide-react";

import heroesList from "../data/heroes.json";
import skillImages from "../data/skillImages.json";
import { supabase } from "../lib/supabaseClient";

const emptySlot = () => ({ hero_key: "", name: "", image: "" });

function filenameFromImagePath(p) {
  if (!p) return "";
  const s = String(p);
  const parts = s.split("/");
  return parts[parts.length - 1] || "";
}

export default function GuildDefenseCreatePage() {
  const navigate = useNavigate();
 

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // ✅ 입력값
  const [label, setLabel] = useState("");
  const [tagText, setTagText] = useState("");
  const [note, setNote] = useState("");

  const [anonymous, setAnonymous] = useState(false);

  // ✅ 영웅 3명
  const [slots, setSlots] = useState([emptySlot(), emptySlot(), emptySlot()]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState(0);

  // ✅ 스킬 3개 (파일명)
  const [skills, setSkills] = useState(["", "", ""]);
  const [skillQ, setSkillQ] = useState("");

  // =========================
  // 이미지 유틸
  // =========================
  const heroImg = (src) =>
    src?.startsWith("/images/") ? src : `/images/heroes/${src || ""}`;

  // -----------------------------
  

  // -----------------------------
  // 로그인 확인
  // -----------------------------
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

  const tags = useMemo(() => {
    const raw = (tagText || "").trim();
    if (!raw) return [];
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [tagText]);

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

  const validate = () => {
    if (!me?.id) return "로그인이 필요합니다.";
    for (let i = 0; i < 3; i++) {
      if (!String(slots[i]?.name || "").trim()) {
        return `상대 영웅 ${i + 1}번이 비어있습니다.`;
      }
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
      // 1) posts insert
      const { data: postRow, error: postErr } = await supabase
        .from("guild_defense_posts")
        .insert([
          {
            label: (label || "").trim(),
            tags,
            note: note || "",
            skills: skills
              .map((x) => String(x || ""))
              .filter((x) => x.trim())
              .slice(0, 3),
            created_by: me.id,
            anonymous: !!anonymous,
          },
        ])
        .select("id")
        .single();

      if (postErr) throw postErr;
      const postId = postRow.id;

      // 2) members 3개 insert
      const payload = slots.slice(0, 3).map((x, i) => ({
        post_id: postId,
        slot: i + 1,
        hero_key: x.hero_key || "",
        hero_name: x.name || "",
        hero_image: x.image || "",
      }));

      const { error: memErr } = await supabase
        .from("guild_defense_members")
        .insert(payload);

      if (memErr) {
        await supabase.from("guild_defense_posts").delete().eq("id", postId);
        throw memErr;
      }

      // ✅ 저장 후: 방어팀 목록으로 이동(추가된 거 바로 보이게)
     navigate(-1);
    } catch (e) {
      setErr(e?.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        {/* 헤더 */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            className="h-28 lg:h-32 w-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(16,185,129,0.12), rgba(251,191,36,0.10))",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-5 lg:px-8">
            <div className="min-w-0">
              <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-slate-900">
                상대 방어팀 정보 추가
              </h1>
              <p className="mt-1 text-xs lg:text-sm font-semibold text-slate-700/70">
                상대 영웅 3명 + 스킬(최대 3개)만 등록합니다.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[12px] font-extrabold text-slate-700">
                  <ShieldCheck size={14} strokeWidth={2.6} />
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
              <div className="text-[13px] font-extrabold text-rose-700">
                오류
              </div>
              <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">
                {err}
              </div>
            </div>
          ) : null}

          {/* 저장 바 */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[12px] font-extrabold text-slate-500">
                  입력 후 저장
                </div>
                <div className="mt-1 text-[15px] font-black text-slate-900 truncate">
                  상대 방어팀 등록
                </div>
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
              {/* LEFT: 메타 */}
              <div className="lg:col-span-5 space-y-4">
                {/* 라벨 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">
                    라벨(선택)
                  </div>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="예) 카일 공덱,연희 마덱 등"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
                  />
                  <div className="mt-2 text-[12px] font-semibold text-slate-500">
                    목록에서 제목처럼 보임
                  </div>
                </div>

              

              

                {/* 메모 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">
                    메모(선택)
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder=""
                    className="mt-2 w-full min-h-[90px] rounded-2xl border border-slate-200 px-3 py-2 text-[13px] font-semibold"
                  />
                </div>
              </div>

              {/* RIGHT: 영웅/스킬 */}
              <div className="lg:col-span-7 space-y-4">
                {/* 영웅 3명 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] font-extrabold text-slate-600">
                        상대 영웅 3명
                      </div>
                      <div className="mt-1 text-[12px] font-semibold text-slate-500">
                        클릭해서 영웅 선택/변경
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {slots.map((x, idx) => {
                      const filled = !!String(x?.name || "").trim();
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPickerSlot(idx);
                            setPickerOpen(true);
                          }}
                          className={[
                            "rounded-3xl border p-3 text-left transition shadow-sm",
                            filled
                              ? "bg-white border-slate-200 hover:bg-slate-50"
                              : "bg-slate-50 border-slate-200 hover:bg-white",
                          ].join(" ")}
                        >
                          <div className="text-[11px] font-extrabold text-slate-500">
                            슬롯 {idx + 1}
                          </div>

                          <div className="mt-2 w-full aspect-square rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                            {x?.image ? (
                              <img
                                src={heroImg(x.image)}
                                alt={x.name || "hero"}
                                className="w-full h-full object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <div className="text-[12px] font-extrabold text-slate-400">
                                선택
                              </div>
                            )}
                          </div>

                          <div className="mt-2 text-[12px] font-black text-slate-900 truncate">
                            {x?.name || "영웅 미선택"}
                          </div>
                          <div className="mt-2 text-[11px] font-extrabold text-slate-400">
                            탭해서 변경 →
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 스킬 3개 */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-[12px] font-extrabold text-slate-600">
                    스킬 (최대 3개)
                  </div>
                  <div className="mt-1 text-[12px] font-semibold text-slate-500">
                    아래에서 클릭하면 빈 칸부터 채워짐 (클릭하면 제거)
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {skills.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSkillAt(i, "")}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-3 hover:bg-white transition text-left"
                        title="클릭하면 비우기"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] font-extrabold text-slate-500">
                            {i + 1}번
                          </div>
                          <X size={14} className="text-slate-300" />
                        </div>

                        <div className="mt-2 w-full h-16 rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                          {s ? (
                            <img
                              src={`/images/skills/${s}`}
                              alt={s}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <div className="text-[12px] font-extrabold text-slate-400">
                              비어있음
                            </div>
                          )}
                        </div>

                        <div className="mt-2 text-[11px] font-semibold text-slate-500 truncate">
                          {s || "-"}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 스킬 검색 */}
                  <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12px] font-extrabold text-slate-700">
                        스킬 선택
                      </div>
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

          {/* 안내 */}
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
            <div className="text-[13px] font-black text-slate-900">주의</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-600">
              이 페이지는 “상대 방어팀 정보”를 DB에 쌓는 용도입니다. 카운터는 다음
              단계에서 붙이면 됩니다.
            </div>
          </div>
        </div>
      </div>

      {pickerOpen ? (
        <HeroPickerModal
          heroesList={heroesList}
          heroImg={heroImg}
          onClose={() => setPickerOpen(false)}
          onPick={(hero) => {
            setSlots((prev) => {
              const next = [...prev];
              next[pickerSlot] = {
                hero_key: hero.key || "",
                name: hero.name || "",
                image: hero.image || "",
              };
              return next;
            });
            setPickerOpen(false);
          }}
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
                className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 p-3 text-left"
              >
                <img
                  src={heroImg(h.image)}
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
