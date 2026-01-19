import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import PageShell from "../components/PageShell";

import siegeTeamsData from "../data/siege-teams.json";
import equipmentData from "../data/equipmentRecommend.json";
import EquipmentModal from "../components/EquipmentModal";

const dayOrder = [
  "수호자의 성 (월요일)",
  "포디나의 성 (화요일)",
  "불멸의 성 (수요일)",
  "죽음의 성 (목요일)",
  "고대용의 성 (금요일)",
  "흑한의 성 (토요일)",
  "지옥의 성 (일요일)",
];

// ✅ 모바일 상세 페이지: /siege/:day
export default function SiegeDayPage() {
  const navigate = useNavigate();
  const { day } = useParams();

  const selectedDay = useMemo(() => {
    if (!day) return "";
    try {
      return decodeURIComponent(day);
    } catch {
      return "";
    }
  }, [day]);

  const isValid = selectedDay && dayOrder.includes(selectedDay);

  return (
    <PageShell
      title="공성전"
      right={
        <button
          onClick={() => navigate("/siege")}
          className="rounded-xl px-3 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
        >
          ← 요일 목록
        </button>
      }
    >
      {isValid ? (
        <SiegeDayPanel selectedDay={selectedDay} />
      ) : (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div className="text-[13px] font-extrabold text-rose-700">
            요일 정보를 찾을 수 없음
          </div>
          <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">
            현재 경로: /siege/{day || "(empty)"}
          </div>
          <button
            onClick={() => navigate("/siege")}
            className="mt-3 rounded-xl px-3 py-2 text-sm font-extrabold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            요일 목록으로
          </button>
        </div>
      )}
    </PageShell>
  );
}

// ✅ PC 우측 패널에서 재사용할 컴포넌트 (named export)
export function SiegeDayPanel({ selectedDay }) {
  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);
  const [openTextBuild, setOpenTextBuild] = useState(null);

  const teams = useMemo(
    () => siegeTeamsData?.siegeTeams?.[selectedDay] ?? [],
    [selectedDay]
  );

  const handleHeroClick = (hero) => {
    const heroKey = Object.keys(equipmentData).find(
      (key) => equipmentData[key]?.name === hero.name
    );
    if (heroKey) {
      setSelectedHeroKey(heroKey);
      setPresetTag(hero.preset || null);
    }
  };

  // ✅ 팀 하나당 영웅 "한 줄"
  const renderHeroes = (heroes = []) => (
    <div className="mt-3 flex gap-2 overflow-x-auto">
      {heroes.map((hero, idx) => (
        <button
          key={`${hero.name}-${idx}`}
          onClick={() => handleHeroClick(hero)}
          className="
            flex flex-col items-center
            bg-white border border-slate-200 rounded-2xl
            p-2 shadow-sm
            hover:bg-slate-50 hover:shadow transition
            min-w-[64px]
          "
        >
          <img
            src={
              hero.image?.startsWith("/images/")
                ? hero.image
                : `/images/heroes/${hero.image}`
            }
            alt={hero.name}
            className="w-14 h-14 object-contain"
            loading="lazy"
          />

          {hero.note ? (
            <p className="text-[10px] text-rose-600 mt-1 text-center">
              {hero.note}
            </p>
          ) : (
            <div className="h-[16px]" />
          )}

          <p className="text-[11px] mt-1 text-center text-slate-900">
            {hero.name}
          </p>

          {hero.preset && (
            <span
              className="
                mt-1 text-[10px] px-2 py-0.5 rounded-full
                bg-slate-50 text-slate-700
                border border-slate-200
                whitespace-nowrap max-w-[92px] overflow-hidden text-ellipsis
              "
              title={hero.preset}
            >
              {hero.preset}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* ✅ 여기서는 요일 제목 싫다 했으니까 헤더 최소화 */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-[12px] font-extrabold text-slate-500">
            팀 {teams.length}개
          </div>
        </div>

        <div className="p-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[12px] font-extrabold text-slate-600">안내</div>
            <div className="mt-1 text-[12px] font-semibold text-slate-600">
              영웅 클릭 시 장비 추천이 열립니다.
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {teams.map((team, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 hover:shadow transition"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-slate-900">
                    팀 {i + 1}
                  </div>
                  {team.tags?.length ? (
                    <span className="text-[11px] px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                      {team.tags[0]}
                    </span>
                  ) : null}
                </div>

                {renderHeroes(team.team)}

                {team.tags?.length ? (
                  <div className="mt-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">설명:</span>{" "}
                    {team.tags.join(", ")}
                  </div>
                ) : null}

                {team.note ? (
                  <div className="mt-2 text-xs text-rose-600">
                    <span className="font-semibold">※</span> {team.note}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/siege-skill/${encodeURIComponent(selectedDay)}/${i}`}
                    className="
                      inline-flex items-center justify-center
                      px-3 py-2 rounded-2xl
                      bg-slate-900 text-white
                      text-sm font-extrabold
                      hover:bg-slate-800 transition
                    "
                  >
                    스킬 순서
                  </Link>

                  {team.textBuild ? (
                    <button
                      onClick={() => setOpenTextBuild(team.textBuild)}
                      className="
                        inline-flex items-center justify-center
                        px-3 py-2 rounded-2xl
                        border border-slate-200 bg-white
                        text-sm font-extrabold text-slate-700
                        hover:bg-slate-50 transition
                      "
                    >
                      텍스트
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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

      {openTextBuild ? (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-200">
              <div className="font-black text-slate-900">
                {openTextBuild.title}
              </div>
              <button
                onClick={() => setOpenTextBuild(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <div className="whitespace-pre-line text-sm text-slate-800 leading-relaxed space-y-1">
                {openTextBuild.content?.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setOpenTextBuild(null)}
                className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-extrabold hover:bg-slate-800 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
