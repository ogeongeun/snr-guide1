import { useState } from 'react';
import { Link } from 'react-router-dom';

import data from '../data/essential-heroes.json';
import equipmentData from '../data/equipmentRecommend.json';
import EquipmentModal from '../components/EquipmentModal';

/**
 * siegeTeams JSON 기준 원소 목록
 */
const elementOrder = [
  { label: '불의 원소', key: '불의원소' },
  { label: '물의 원소', key: '물의원소' },
  { label: '땅의 원소', key: '땅의원소' },
  { label: '빛의 원소', key: '빛의원소' },
  { label: '암흑의 원소', key: '암흑원소' },
];

const EssentialHeroesPage = () => {
  const [selectedElement, setSelectedElement] = useState(elementOrder[0]);

  // 장비 모달 상태
  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);

  // ✅ siegeTeams 반드시 거친다
  const teams = data?.siegeTeams?.[selectedElement.key] || [];

  /**
   * 영웅 클릭 → 장비 모달
   */
  const handleHeroClick = (hero) => {
    const heroKey = Object.keys(equipmentData).find(
      (key) => equipmentData[key].name === hero.name
    );

    if (heroKey) {
      setSelectedHeroKey(heroKey);
      setPresetTag(hero.preset || null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          📋 성장던전 핵심 영웅 정리
        </h1>

        {/* 원소 선택 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
          {elementOrder.map((el) => (
            <button
              key={el.key}
              onClick={() => setSelectedElement(el)}
              className={`text-sm px-3 py-2 rounded border bg-white hover:bg-gray-100 transition ${
                selectedElement.key === el.key ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              {el.label}
            </button>
          ))}
        </div>

        {/* 팀 목록 */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {teams.map((teamData, idx) => (
            <li
              key={idx}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col"
            >
              <p className="font-semibold text-gray-700 mb-2">
                추천 조합 {idx + 1}
              </p>

              {/* 영웅 목록 */}
              <div className="grid grid-cols-5 gap-2">
                {teamData.team.map((hero, i) => (
                  <button
                    key={i}
                    onClick={() => handleHeroClick(hero)}
                    className="flex flex-col items-center bg-white border rounded-md p-1 hover:scale-105 transition"
                  >
                    <img
                      src={
                        hero.image?.startsWith('/images/')
                          ? hero.image
                          : `/images/heroes/${hero.image}`
                      }
                      alt={hero.name}
                      className="w-12 h-12 object-contain"
                      loading="lazy"
                    />
                    <p className="text-[10px] mt-1 text-center">
                      {hero.name}
                    </p>
                    {hero.note && (
                      <p className="text-[9px] text-red-500 text-center mt-0.5">
                        {hero.note}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {/* 태그 */}
              {teamData.tags && teamData.tags.length > 0 && (
                <p className="mt-2 text-[11px] text-gray-600">
                  💡 {teamData.tags.join(', ')}
                </p>
              )}

              {/* 팀 노트 */}
              {teamData.note && (
                <p className="mt-1 text-[11px] text-red-500 italic">
                  ※ {teamData.note}
                </p>
              )}

              {/* ✅ 스킬 순서 이동 (정답 링크) */}
              <div className="mt-3 flex justify-center">
                <Link
                  to={`/essential-skill/${encodeURIComponent(
                    selectedElement.key
                  )}/${idx}`}
                  className="px-3 py-1.5 text-sm rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  ⚔️ 스킬 순서 보러가기
                </Link>
              </div>
            </li>
          ))}
        </ul>
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
};

export default EssentialHeroesPage;
