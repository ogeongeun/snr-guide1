import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import expeditionTeams from '../data/expedition-teams.json';
import equipmentData from '../data/equipmentRecommend.json';
import EquipmentModal from '../components/EquipmentModal';

export default function ExpeditionTeamPage() {
  const { heroId } = useParams();
  const teamSets = expeditionTeams.expeditionTeams?.[heroId];
  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);

  if (!teamSets) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        데이터를 찾을 수 없습니다.
      </div>
    );
  }

  // 🔹 영웅 클릭 시 장비 모달 열기
  const handleHeroClick = (hero) => {
    const heroKey = Object.keys(equipmentData).find(
      (key) => equipmentData[key].name === hero.name
    );
    if (heroKey) {
      setSelectedHeroKey(heroKey);
      setPresetTag(hero.preset || null);
    } else {
      alert('장비 정보가 없습니다.');
    }
  };

  // 🔹 영웅 카드 렌더링
  const renderHeroes = (heroes) => (
    <div className="grid grid-cols-5 gap-3 mt-2">
      {heroes.map((hero, idx) => {
        const imagePath = hero.image?.startsWith('/images/')
          ? hero.image
          : `/images/heroes/${hero.image}`;
        return (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              handleHeroClick(hero);
            }}
            className="flex flex-col items-center bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-300 rounded-xl p-2 shadow-md hover:shadow-lg hover:scale-105 hover:border-indigo-400 transition-all duration-300"
          >
            <div className="relative">
              <img
                src={imagePath}
                alt={hero.name}
                className="w-14 h-14 object-contain rounded-md"
              />
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition bg-indigo-500/20 rounded-md"></div>
            </div>
            <p className="text-[11px] mt-1 text-gray-800 font-medium">
              {hero.name}
            </p>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f7fb] to-[#eceef6] py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-md shadow-xl rounded-3xl p-8 border border-gray-200 relative">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow">
          ⚔️ {heroId.toUpperCase()} - 팀 선택
        </h1>

        {teamSets.map((set, setIdx) => (
          <div key={setIdx} className="mb-12">
            <h2 className="text-2xl font-semibold text-center text-indigo-700 mb-6 tracking-tight">
              {set.setName}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {set.teams.map((team, teamIdx) => (
                <div
                  key={teamIdx}
                  className="bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 flex flex-col justify-between group"
                >
                  {/* 팀명 */}
                  <h3 className="font-bold text-gray-800 text-center mb-3 text-lg">
                    🧩 {team.teamName}
                  </h3>

                  {/* 영웅들 */}
                  {renderHeroes(team.heroes)}

                  {/* 메모 */}
                  {team.note && (
                    <p className="text-xs text-red-500 text-center mt-3 italic">
                      ※ {team.note}
                    </p>
                  )}

                  {/* 버튼 — 카드 아래 정렬 */}
                  <div className="flex justify-end mt-5">
                    <Link
                      to={`/expedition/${heroId}/${teamIdx}`}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-transform backdrop-blur-md bg-opacity-90"
                    >
                      ⚡ 스킬순서 보기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 메인으로 돌아가기 */}
        <div className="text-center mt-8">
          <Link
            to="/expedition"
            className="text-sm font-medium text-indigo-500 hover:underline hover:text-indigo-600 transition"
          >
            ← 강림원정대 메인으로
          </Link>
        </div>
      </div>

      {/* 장비 모달 */}
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
    </div>
  );
}
