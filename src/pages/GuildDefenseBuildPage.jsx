// src/pages/GuildDefenseBuildPage.jsx
import { useState, useMemo } from 'react';
import guildData from '../data/guild_defense_recommendations.json';
import equipmentData from '../data/equipmentRecommend.json';
import EquipmentModal from '../components/EquipmentModal';

const EMPTY_TEAMS = Object.freeze([]);
const EMPTY_OBJ = Object.freeze({});

export default function GuildDefenseBuildPage() {
  const categoryNames = Object.keys(guildData.categories || {});
  const [selectedCategory, setSelectedCategory] = useState(categoryNames[0] || '공덱');
  const [openGroupName, setOpenGroupName] = useState(null);

  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);

  const currentCategory = guildData.categories[selectedCategory] || {};
  const categoryDesc = currentCategory.desc || '';
  const teamsRef = Array.isArray(currentCategory.teams) ? currentCategory.teams : EMPTY_TEAMS;

  // 🔹 같은 이름(덱명)끼리 묶기
  const groupedByName = useMemo(() => {
    const map = new Map();
    teamsRef.forEach((team) => {
      const key = team.name || '이름없음';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(team);
    });
    return map;
  }, [teamsRef]);

  const imgPath = (file, base) =>
    file?.startsWith?.('/images/') ? file : `${base}/${file}`;

  // 🔹 영웅 클릭 시 장비 모달 열기
  const handleHeroClick = (hero) => {
    const heroKey = Object.keys(equipmentData).find(
      (key) => equipmentData[key].name === hero.name
    );
    if (heroKey) {
      setSelectedHeroKey(heroKey);
      setPresetTag(hero.preset || null);
    }
  };

  // 🔹 영웅 표시
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
            src={imgPath(hero.image, '/images/heroes')}
            alt={hero.name}
            className="w-14 h-14 object-contain"
            loading="lazy"
          />
          {hero.note ? (
            <p className="text-[9px] text-red-500 italic mt-0.5 text-center">{hero.note}</p>
          ) : (
            <div className="h-[14px]" />
          )}
          <p className="text-[10px] mt-1 text-center">{hero.name}</p>

          {hero.preset && (
            <span className="mt-1 text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {hero.preset}
            </span>
          )}
        </button>
      ))}
    </div>
  );

  // 🔹 스킬 순서 표시 (속공덱1, 속공덱2 등 자동 처리)
  const renderSkillOrdersBlock = (team) => {
    const orders = team.skillOrders || EMPTY_OBJ;
    const threshold = typeof orders.threshold === 'number' ? orders.threshold : null;

    const keys = Object.keys(orders).filter(
      (key) =>
        Array.isArray(orders[key]) &&
        key !== 'threshold' &&
        orders[key].length > 0
    );

    if (keys.length === 0) {
      return <p className="text-[12px] text-gray-500 mt-3">등록된 스킬 순서가 없습니다.</p>;
    }

    const block = (label, list, tone = 'slate') => (
      <div key={label} className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-700">스킬 순서</span>
          {label && (
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] border bg-${tone}-50 text-${tone}-700`}
            >
              {label}
            </span>
          )}
          {threshold != null && label.startsWith('속공덱') && (
            <span className="px-2 py-0.5 rounded-full text-[11px] border bg-amber-50 text-amber-700">
              참고 임계값: 속공 {threshold}+
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {list.map((img, idx) => (
            <img
              key={`${label}-${idx}`}
              src={imgPath(img, '/images/skills')}
              alt={`${label} ${idx + 1}`}
              className="w-10 h-10 border rounded"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    );

    return (
      <div className="mt-3 space-y-4">
        {keys.map((key) => {
          const tone =
            key.startsWith('속공덱') ? 'indigo' :
            key.startsWith('내실덱') ? 'slate' :
            key === '공통' ? 'gray' : 'blue';
          return block(key, orders[key], tone);
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">🛡️ 방어팀 필수 조합</h1>

        {/* 설명 */}
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-sm text-red-800 mb-6">
          <p className="font-semibold mb-1">속공덱 / 내실덱 개념</p>
          <ul className="list-disc list-inside leading-relaxed">
            <li>속공덱: 속공220↑ / 메인딜러 속공 / 앞라인 효적·속공</li>
            <li>내실덱: 공덱-약공80↑ / 앞라인 조율자(효적60%, 효저100%)</li>
            <li>내실덱: 방덱-받받 + 부옵 막기(80↑)</li>
            <li>콜플파·연바로 우선 배치</li>
          </ul>
        </div>

        {/* 카테고리 선택 */}
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {categoryNames.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setOpenGroupName(null);
              }}
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

        {/* 설명문 */}
        {categoryDesc && (
          <div className="text-sm text-gray-700 italic mb-4 text-center whitespace-pre-line">
            ※ {categoryDesc}
          </div>
        )}

        {/* 덱 리스트 */}
        <div className="space-y-2">
          {Array.from(groupedByName.entries()).map(([groupName, groupTeams]) => (
            <div key={groupName} className="border border-gray-200 rounded-lg bg-gray-50">
              <button
                className="w-full text-left px-3 py-2 font-semibold text-gray-700 hover:bg-gray-100 rounded-lg flex items-center justify-between"
                onClick={() => setOpenGroupName(openGroupName === groupName ? null : groupName)}
              >
                <span>{groupName}</span>
                <span className="text-xs text-gray-500">{groupTeams.length}개 덱</span>
              </button>

              {openGroupName === groupName && (
                <div className="p-3 border-t border-gray-200 space-y-3">
                  {groupTeams.map((team, idx) => (
                    <div
                      key={`${groupName}-${idx}`}
                      className="bg-white border border-gray-200 rounded-lg p-3"
                    >
                      {team.note && (
                        <p className="text-[15px] text-red-500 mb-2 italic">※ {team.note}</p>
                      )}

                      {/* ✅ 영웅 + 펫 */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">{renderHeroes(team.heroes)}</div>

                        {/* ✅ 펫 여러 개 → 위아래로 표시 */}
                        {team.pet && (
                          <div
                            className={`ml-3 flex ${
                              Array.isArray(team.pet) && team.pet.length > 1
                                ? 'flex-col gap-2'
                                : 'flex-row'
                            } items-center justify-center`}
                          >
                            {(Array.isArray(team.pet) ? team.pet : [team.pet]).map((pet, i) => (
                              <div
                                key={`${pet}-${i}`}
                                className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-xl shadow-sm flex items-center justify-center"
                              >
                                <img
                                  src={`/images/pet/${pet}`}
                                  alt={`pet-${i}`}
                                  className="w-8 h-8 object-contain opacity-95"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {renderSkillOrdersBlock(team)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
