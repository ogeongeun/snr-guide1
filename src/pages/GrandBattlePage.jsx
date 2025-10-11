import { useState } from 'react';
import grandBattleData from '../data/grand_battle_recommendations.json';

export default function GrandBattlePage() {
  const [selectedCategory, setSelectedCategory] = useState(Object.keys(grandBattleData.categories)[0]);

  const categoryData = grandBattleData.categories[selectedCategory];
  const selectedTeams = categoryData?.teams.slice(0, 5) || [];
  const categoryDesc = categoryData?.desc || '';

  const renderHeroes = (heroes) => (
    <div className={`grid gap-2 mt-2 ${heroes.length === 3 ? 'grid-cols-3' : 'grid-cols-5'}`}>
      {heroes.map((hero, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center bg-white border rounded-lg p-1 shadow-sm"
        >
          <img
            src={hero.image?.startsWith('/images/') ? hero.image : `/images/heroes/${hero.image}`}
            alt={hero.name}
            className="w-14 h-14 object-contain"
          />
          <p className="text-[10px] mt-1 text-center">{hero.name}</p>
          {hero.note && (
            <p className="text-[10px] text-red-500 italic text-center mt-0.5">{hero.note}</p>
          )}
        </div>
      ))}
    </div>
  );

  const renderSkillOrder = (skillOrder) => (
    <div className="mt-2">
      <p className="text-xs font-semibold text-gray-600 mb-1">스킬 순서</p>
      <div className="flex flex-wrap gap-2">
        {skillOrder.map((img, idx) => (
          <img
            key={idx}
            src={`/images/skills/${img}`}
            alt={`Skill ${idx + 1}`}
            className="w-10 h-10 border rounded"
          />
        ))}
      </div>
    </div>
  );

  const renderMultipleSkillOrders = (skillOrders) => (
    <div className="mt-2 space-y-3">
      {skillOrders.map((order, idx) => (
        <div key={idx}>
          {order.title && (
            <p className="text-xs font-semibold text-gray-600 mb-1">{order.title}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {order.sequence.map((img, i) => (
              <img
                key={i}
                src={`/images/skills/${img}`}
                alt={`Skill ${i + 1}`}
                className="w-10 h-10 border rounded"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">⚔️ 총력전 팀 추천</h1>

        {/* 카테고리 선택 탭 */}
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {Object.keys(grandBattleData.categories).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full border text-sm ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 카테고리 설명 */}
        {categoryDesc && (
          <div className="text-sm text-gray-700 italic text-center mb-6 whitespace-pre-line">
            ※ {categoryDesc}
          </div>
        )}

        {/* 팀 카드 목록 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {selectedTeams.map((team, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
            >
              <p className="font-semibold text-gray-700 mb-2">{team.name || `팀 ${index + 1}`}</p>
              {team.note && (
                <p className="text-[11px] text-red-500 mt-1 italic">※ {team.note}</p>
              )}
              {renderHeroes(team.heroes)}

              {/* ✅ skillOrders가 있으면 복수 출력, 없으면 기본 출력 */}
              {team.skillOrders
                ? renderMultipleSkillOrders(team.skillOrders)
                : team.skillOrder && renderSkillOrder(team.skillOrder)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
