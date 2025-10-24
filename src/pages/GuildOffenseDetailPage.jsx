// src/pages/GuildOffenseDetailPage.jsx
import { useParams, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import data from '../data/guildCounter.json';
import equipmentData from '../data/equipmentRecommend.json';
import EquipmentModal from '../components/EquipmentModal';

export default function GuildOffenseDetailPage() {
  const { category, teamIndex } = useParams();
  const [searchParams] = useSearchParams();

  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);

  const decodedCategory = decodeURIComponent(category || '');
  const idx = Number.parseInt(teamIndex, 10);
  const entry = data?.categories?.[decodedCategory]?.[idx];

  const variantParam = searchParams.get('variant');
  const variantIdx =
    variantParam !== null ? Number.parseInt(variantParam, 10) : null;

  if (!entry) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-red-500 text-center text-lg mt-10">
          해당 팀 데이터를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  const heroImg = (src) =>
    src?.startsWith('/images/') ? src : `/images/heroes/${src || ''}`;
  const petImg = (src) =>
    src?.startsWith('/images/') ? src : `/images/pet/${src || ''}`;

  const handleHeroClick = (hero) => {
    const heroKey = Object.keys(equipmentData).find(
      (key) => equipmentData[key].name === hero.name
    );
    if (heroKey) {
      const detectedPreset =
        hero.preset ||
        (hero.note && hero.note.includes('프리셋') ? hero.note : null);
      setSelectedHeroKey(heroKey);
      setPresetTag(detectedPreset);
    }
  };

  const renderHeroCard = (hero) => (
    <div
      key={`${hero.name}-${hero.image}`}
      onClick={() => handleHeroClick(hero)}
      className="flex flex-col items-center bg-white border rounded-lg p-1 shadow-sm hover:bg-blue-50 cursor-pointer transition"
    >
      <div className="w-14 h-14 flex items-center justify-center">
        <img
          src={heroImg(hero.image)}
          alt={hero.name}
          className="w-14 h-14 object-contain"
        />
      </div>
      {hero.note ? (
        <p className="text-[9px] text-red-500 italic mt-0.5 text-center">
          {hero.note}
        </p>
      ) : (
        <div className="h-[14px]" />
      )}
      <p className="text-[10px] mt-1 text-center">{hero.name}</p>
      {(hero.preset || (hero.note && hero.note.includes('프리셋'))) && (
        <span className="mt-1 text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
          {hero.preset || hero.note}
        </span>
      )}
    </div>
  );

  const renderPetIcons = (pets) => {
    if (!Array.isArray(pets) || pets.length === 0) return null;
    return (
      <div
        className={`ml-3 flex ${
          pets.length > 1 ? 'flex-col gap-2' : 'flex-row'
        } items-center justify-center`}
      >
        {pets.map((p, i) => (
          <div
            key={`${p}-${i}`}
            className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-xl shadow-sm flex items-center justify-center"
          >
            <img
              src={petImg(p)}
              alt={`Pet ${i + 1}`}
              className="w-8 h-8 object-contain opacity-95"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  };

  const SkillStrip = ({ skills, size = 'w-10 h-10' }) => {
    if (!Array.isArray(skills) || skills.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {skills.map((img, i) => (
          <img
            key={`${img}-${i}`}
            src={`/images/skills/${img}`}
            alt={`Skill ${i + 1}`}
            className={`${size} border rounded`}
          />
        ))}
      </div>
    );
  };

  const defenseNotes = Array.isArray(entry.defenseNotes)
    ? entry.defenseNotes.filter(Boolean)
    : [];
  const variants = Array.isArray(entry.defenseVariants)
    ? entry.defenseVariants
    : [];

  const renderCounterCard = (recommended, j) => {
    const grouped = Array.isArray(recommended.skillOrders)
      ? recommended.skillOrders
      : null;
    const legacy = Array.isArray(recommended.skillOrder)
      ? recommended.skillOrder
      : null;

    return (
      <div
        key={j}
        className="mb-6 border border-gray-300 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
      >
        {/* 추천도 */}
        {recommended.recommendation && (
          <div className="text-center mb-2">
            <span className="text-yellow-500 text-sm font-bold">
              {'★'.repeat(Number(recommended.recommendation))}
            </span>
            <span className="text-gray-300 text-sm font-bold">
              {'☆'.repeat(3 - Number(recommended.recommendation))}
            </span>
            <p className="text-[11px] text-gray-600 mt-1">
              추천도 {recommended.recommendation}/3
            </p>
          </div>
        )}

        {/* 팀 + 펫 */}
        <div className="flex justify-center items-start">
          <div
            className={`grid gap-2 ${
              recommended.team.length === 3 ? 'grid-cols-3' : 'grid-cols-5'
            }`}
          >
            {recommended.team.map(renderHeroCard)}
          </div>

          {renderPetIcons(recommended.pet)}
        </div>

        {recommended.note && (
          <p className="text-sm text-gray-600 mt-2 italic">
            ※ {recommended.note}
          </p>
        )}

        {grouped && grouped.length > 0 ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm font-semibold text-gray-700">스킬 순서</p>
            {grouped.map((g, gi) => (
              <div
                key={`grp-${gi}`}
                className="border rounded-md p-2 bg-gray-50"
              >
                {g.label && (
                  <p className="text-xs font-semibold text-red-600 mb-1">
                    {g.label}
                  </p>
                )}
                <SkillStrip skills={g.skills} size="w-9 h-9" />
              </div>
            ))}
          </div>
        ) : legacy ? (
          <div className="mt-3">
            <p className="text-sm font-semibold text-gray-700">스킬 순서</p>
            <SkillStrip skills={legacy} size="w-9 h-9" />
          </div>
        ) : null}
      </div>
    );
  };

  // ✅ variant 렌더러 (추천도 높은 순으로 정렬)
  const renderVariant = (variant, index) => {
    // 🔹 정렬 로직 추가
    const sortedCounters = Array.isArray(variant.counters)
      ? [...variant.counters].sort((a, b) => {
          const ra = Number(a.recommendation) || 0;
          const rb = Number(b.recommendation) || 0;
          return rb - ra; // 높은 값이 위로
        })
      : [];

    return (
      <div
        key={`variant-${index}`}
        className="mb-2 border border-gray-300 rounded-xl p-4 bg-white shadow-sm"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">패턴 #{index + 1}</h3>
          <span className="text-xs text-gray-500">
            카운터 {sortedCounters.length}개
          </span>
        </div>

        <div className="mt-2">
          {sortedCounters.length > 0 ? (
            sortedCounters.map((rc, j) => renderCounterCard(rc, j))
          ) : (
            <p className="text-sm text-gray-500">등록된 카운터덱이 없습니다.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-center">카운터덱 상세</h1>

      <div className="mb-3 text-center">
        <span className="text-sm text-gray-500">카테고리</span>{' '}
        <span className="text-sm font-semibold">[{decodedCategory}]</span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="text-sm text-gray-500">라벨</span>{' '}
        <span className="text-sm font-semibold">
          {entry.label || '라벨없음'}
        </span>
      </div>

      {Array.isArray(entry.defenseTeam) && entry.defenseTeam.length > 0 && (
        <div className="mb-6 border border-blue-200 rounded-xl p-4 bg-blue-50/40">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            상대 방어팀 (요약)
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {entry.defenseTeam.map(renderHeroCard)}
          </div>

          {variantIdx !== null &&
            variants[variantIdx] &&
            Array.isArray(variants[variantIdx].defenseSkills) && (
              <>
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  방어팀 스킬 순서
                </p>
                <SkillStrip
                  skills={variants[variantIdx].defenseSkills}
                  size="w-8 h-8"
                />
              </>
            )}
        </div>
      )}

      {defenseNotes.length > 0 && (
        <div className="mb-4">
          {defenseNotes.map((n, i) => (
            <p key={i} className="text-[12px] text-red-500 italic">
              ※ {n}
            </p>
          ))}
        </div>
      )}

      {variants.length > 0 ? (
        typeof variantIdx === 'number' &&
        !Number.isNaN(variantIdx) &&
        variantIdx >= 0 &&
        variantIdx < variants.length ? (
          renderVariant(variants[variantIdx], variantIdx)
        ) : (
          variants.map((v, vIdx) => renderVariant(v, vIdx))
        )
      ) : (
        <p className="text-sm text-gray-500">등록된 defenseVariants가 없습니다.</p>
      )}

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
