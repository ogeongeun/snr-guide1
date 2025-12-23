import { useState } from 'react';
import data from '../data/essential-heroes.json';

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

  const teams = data?.siegeTeams?.[selectedElement.key] || [];

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
              className={`text-sm px-3 py-2 rounded border bg-white hover:bg-gray-100 transition
                ${
                  selectedElement.key === el.key
                    ? 'ring-2 ring-blue-400'
                    : ''
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

              {/* 영웅들 */}
              <div className="grid grid-cols-5 gap-2">
                {teamData.team.map((hero, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center bg-white border rounded-md p-1"
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
                  </div>
                ))}
              </div>

              {/* 태그 */}
              {teamData.tags && (
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EssentialHeroesPage;
