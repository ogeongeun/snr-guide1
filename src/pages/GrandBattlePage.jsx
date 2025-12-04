// src/pages/GrandBattlePage.jsx
import { useState } from 'react';
import grandBattleData from '../data/grand_battle_recommendations.json';
import equipmentData from '../data/equipmentRecommend.json';
import EquipmentModal from '../components/EquipmentModal';

export default function GrandBattlePage() {
  const [selectedCategory, setSelectedCategory] = useState(Object.keys(grandBattleData.categories)[0]);
  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);

  const categoryData = grandBattleData.categories[selectedCategory];
  const selectedTeams = categoryData?.teams.slice(0, 5) || [];
  const categoryDesc = categoryData?.desc || '';

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
    
    <div
      className={`grid gap-2 mt-2 ${
        heroes.length === 3 ? 'grid-cols-3' : 'grid-cols-5'
      }`}
    >
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
            className="flex flex-col items-center bg-white border rounded-lg p-1 shadow-sm hover:shadow-md hover:scale-105 hover:border-indigo-400 transition-all duration-300"
          >
            <img
              src={imagePath}
              alt={hero.name}
              className="w-14 h-14 object-contain rounded-md"
            />
            <p className="text-[10px] mt-1 text-center font-semibold text-gray-800">
              {hero.name}
            </p>
            {hero.preset && (
              <span className="text-[9px] text-white bg-indigo-500/80 px-1.5 py-0.5 rounded-full mt-1 leading-tight">
                {hero.preset}
              </span>
            )}
            {hero.note && (
              <p className="text-[9px] text-red-500 italic text-center mt-0.5">
                {hero.note}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );

  // 단일 스킬 순서
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

  // 복수 스킬 순서
  const renderMultipleSkillOrders = (skillOrders) => (
    <div className="mt-2 space-y-3">
      {skillOrders.map((order, idx) => (
        <div key={idx}>
          {order.title && (
            <p className="text-xs font-semibold text-gray-600 mb-1">
              {order.title}
            </p>
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
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
  ⚔️ 총력전 팀 추천
</h1>

<p className="text-[13px] text-center text-gray-600 leading-relaxed mb-6">
  🔹 트루드는 공덱·방덱·플마덱 중 <span className="font-semibold text-gray-700">승률이 낮은 덱에 배치하는 것을 추천</span>합니다.<br/>
  도움을 주신 <span className="font-semibold text-blue-600">머선님</span> 감사합니다.
</p>


        {/* 🔹 카테고리 탭 */}
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

        {/* 🔹 카테고리 설명 */}
        {categoryDesc && (
          <div className="text-sm text-gray-700 italic text-center mb-6 whitespace-pre-line">
            ※ {categoryDesc}
          </div>
        )}

        {/* 🔹 팀 카드 목록 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {selectedTeams.map((team, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
            >
              <p className="font-semibold text-gray-700 mb-2">
                {team.name || `팀 ${index + 1}`}
              </p>

              {team.note && (
                <p className="text-[11px] text-red-500 mt-1 italic">
                  ※ {team.note}
                </p>
              )}

              {renderHeroes(team.heroes)}

              {/* ✅ 스킬 순서 */}
              {team.skillOrders
                ? renderMultipleSkillOrders(team.skillOrders)
                : team.skillOrder && renderSkillOrder(team.skillOrder)}
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 장비 모달 */}
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
