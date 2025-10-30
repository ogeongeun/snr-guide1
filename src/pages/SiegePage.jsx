import { useState } from 'react';
import { Link } from 'react-router-dom';
import siegeTeamsData from '../data/siege-teams.json';
import siegeSkills from '../data/siege-skills.json';
import equipmentData from '../data/equipmentRecommend.json';
import EquipmentModal from '../components/EquipmentModal';

const dayOrder = [
  '수호자의 성 (월요일)',
  '포디나의 성 (화요일)',
  '불멸의 성 (수요일)',
  '죽음의 성 (목요일)',
  '고대용의 성 (금요일)',
  '흑한의 성 (토요일)',
  '지옥의 성 (일요일)',
];

export default function SiegePage() {
  const [selectedDay, setSelectedDay] = useState(dayOrder[0]);
  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);
  const [openTextBuild, setOpenTextBuild] = useState(null); // ✅ 텍스트 팝업용 상태

  // ✅ 영웅 클릭 시 장비 모달 열기
  const handleHeroClick = (hero) => {
    const heroKey = Object.keys(equipmentData).find(
      (key) => equipmentData[key].name === hero.name
    );
    if (heroKey) {
      setSelectedHeroKey(heroKey);
      setPresetTag(hero.preset || null);
    }
  };

  // ✅ 영웅 카드 렌더러
  const renderHeroes = (heroes = []) => (
    <div
      className={`grid gap-2 mt-3 ${
        heroes.length === 3 ? 'grid-cols-3 justify-center' : 'grid-cols-5'
      }`}
    >
      {heroes.map((hero, idx) => (
        <button
          key={`${hero.name}-${idx}`}
          onClick={() => handleHeroClick(hero)}
          className="flex flex-col items-center bg-white border rounded-lg p-1 shadow-sm hover:scale-105 transition"
        >
          <img
            src={
              hero.image?.startsWith('/images/')
                ? hero.image
                : `/images/heroes/${hero.image}`
            }
            alt={hero.name}
            className="w-14 h-14 object-contain"
            loading="lazy"
          />
          {hero.note ? (
            <p className="text-[9px] text-red-500 italic mt-0.5 text-center">
              {hero.note}
            </p>
          ) : (
            <div className="h-[14px]" />
          )}
          <p className="text-[10px] mt-1 text-center">{hero.name}</p>
          {hero.preset && (
            <span className="mt-1 text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap max-w-[70px] overflow-hidden text-ellipsis">
              {hero.preset}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // ✅ 텍스트 빌드 팝업 열기
  const handleShowTextBuild = (textBuild) => {
    setOpenTextBuild(textBuild);
  };

  // ✅ 팝업 닫기
  const handleClosePopup = () => {
    setOpenTextBuild(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 relative">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          🏰 공성전 필수 정보
        </h1>

        {/* ✅ 요일 버튼 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {dayOrder.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`text-sm px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition ${
                selectedDay === day ? 'ring-2 ring-purple-400' : ''
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* ✅ 본문 */}
        <div className="mt-4">
          <h3 className="text-xl font-bold text-gray-700 mb-4">
            {selectedDay}
          </h3>
          <p className="text-sm font-semibold text-red-500 mb-4">
            각 영웅 클릭 시 장비 추천이 열립니다.
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {siegeTeamsData.siegeTeams[selectedDay]?.map((team, i) => (
              <li
                key={i}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition flex flex-col"
              >
                <p className="font-semibold text-gray-700 mb-2">팀 {i + 1}</p>

                {renderHeroes(team.team)}

                {team.tags && (
                  <p className="mt-2 text-xs text-gray-500">
                    설명: {team.tags.join(', ')}
                  </p>
                )}
                {team.note && (
                  <p className="text-[11px] text-red-500 mt-1 italic">
                    ※ {team.note}
                  </p>
                )}

                {/* ✅ 버튼 2개 */}
                <div className="mt-3 flex justify-center gap-2">
                  <Link
                    to={`/siege-skill/${encodeURIComponent(selectedDay)}/${i}`}
                    className="px-3 py-1.5 text-sm rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    ⚔️ 스킬 순서 보러가기
                  </Link>
                  {team.textBuild && (
                    <button
                      onClick={() => handleShowTextBuild(team.textBuild)}
                      className="px-2 py-1 text-[11px] rounded-md border border-gray-400 text-gray-600 hover:bg-gray-100"
                    >
                      📖 텍스트로 보기
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ✅ 장비 모달 */}
      {selectedHeroKey && (
        <EquipmentModal
          heroKey={selectedHeroKey}
          presetTag={presetTag}
          onClose={() => {
            setSelectedHeroKey(null);
            setPresetTag(null);
          }}
        />
      )}

      {/* ✅ 커스텀 텍스트 팝업 */}
      {openTextBuild && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white max-w-lg w-[90%] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative animate-fade-in">
            <h2 className="text-lg font-bold text-purple-700 text-center mb-4">
              {openTextBuild.title}
            </h2>
            <div className="whitespace-pre-line text-sm text-gray-800 leading-relaxed space-y-1">
              {openTextBuild.content.map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
            <button
              onClick={handleClosePopup}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-lg font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
