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

  // 🔹 영웅 카드 렌더링 (균형 잡힌 사이즈)
  const renderHeroes = (heroes) => (
    <div className="grid grid-cols-5 gap-2 mt-3">
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
            className="flex flex-col items-center bg-gradient-to-b from-white to-gray-100 border border-gray-300 rounded-xl p-1.5 shadow-sm hover:shadow-md hover:scale-105 hover:border-indigo-400 transition-all duration-300"
          >
            <img
              src={imagePath}
              alt={hero.name}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-md"
            />
            <p className="text-[11px] sm:text-[12px] mt-1 text-gray-800 font-medium text-center">
              {hero.name}
            </p>
            {hero.preset && (
              <span className="text-[9px] sm:text-[10px] text-white bg-indigo-500/80 px-1.5 py-0.5 rounded-full mt-1">
                {hero.preset}
              </span>
            )}
            {hero.note && (
              <p className="text-[9px] text-red-500 italic mt-0.5 text-center">
                {hero.note}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f7fb] to-[#eceef6] py-10 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-md shadow-xl rounded-3xl p-6 sm:p-8 border border-gray-200">
        <h1 className="text-4xl font-extrabold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 drop-shadow">
          ⚔️ {heroId.toUpperCase()} - 팀 선택
        </h1>

        {teamSets.map((set, setIdx) => (
          <div key={setIdx} className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-center text-indigo-700 mb-6">
              {set.setName}
            </h2>

            {/* 🔹 팀 카드 영역 (가로 넓고 세로 얕게) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
              {set.teams.map((team, teamIdx) => (
                <div
                  key={teamIdx}
                  className="bg-gradient-to-b from-white to-gray-50 border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5 flex flex-col justify-between group"
                >
                  <h3 className="font-bold text-gray-800 text-center mb-3 text-lg sm:text-xl">
                    🧩 {team.teamName}
                  </h3>

                  {renderHeroes(team.heroes)}

                  {team.note && (
                    <p className="text-xs sm:text-sm text-red-500 text-center mt-2 italic">
                      ※ {team.note}
                    </p>
                  )}

                  <div className="flex justify-end mt-4">
                    <Link
                      to={`/expedition/${heroId}/${teamIdx}`}
                      className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-transform"
                    >
                      ⚡ 스킬순서 보기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="text-center mt-8">
          <Link
            to="/expedition"
            className="text-sm sm:text-base font-medium text-indigo-500 hover:underline hover:text-indigo-600 transition"
          >
            ← 강림원정대 메인으로
          </Link>
        </div>
      </div>

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
