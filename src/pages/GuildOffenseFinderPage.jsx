import React, { useMemo, useState } from 'react';

import data from '../data/guildCounter.json';
import equipmentData from '../data/equipmentRecommend.json';
import EquipmentModal from '../components/EquipmentModal';

// 공용: 이미지 경로 보정
const heroImg = (src) => (src?.startsWith('/images/') ? src : `/images/heroes/${src || ''}`);

export default function GuildOffenseFinderPage() {

  const [selectedHeroKey, setSelectedHeroKey] = useState(null);
  const [presetTag, setPresetTag] = useState(null);
  const [openLabel, setOpenLabel] = useState(null); // 🔹 아코디언 열림 상태

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

  // JSON 평탄화
  const flatCounters = useMemo(() => {
    const out = [];
    const categories = Object.entries(data.categories || {});
    for (const [category, entries] of categories) {
      if (!Array.isArray(entries)) continue;
      entries.forEach((entry, entryIdx) => {
        const entryLabel = entry.label || '라벨없음';
        const defenseTeam = entry.defenseTeam || [];
        const variants = Array.isArray(entry.defenseVariants)
          ? entry.defenseVariants
          : [];
        variants.forEach((v, vIdx) => {
          const defenseSkills = v.defenseSkills || [];
          const counters = Array.isArray(v.counters) ? v.counters : [];
          counters.forEach((c, cIdx) => {
            const team = Array.isArray(c.team) ? c.team : [];
            out.push({
              category,
              entryLabel,
              entryIdx,
              variantIdx: vIdx,
              counterIdx: cIdx,
              defenseTeam,
              defenseSkills,
              counter: c,
              counterHeroNames: team.map((h) => (h?.name || '').trim()),
            });
          });
        });
      });
    }
    return out;
  }, []);

  // 전체 영웅 목록
  const allHeroNames = useMemo(() => {
    const s = new Set();
    flatCounters.forEach((x) => x.counterHeroNames.forEach((n) => n && s.add(n)));
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [flatCounters]);

  const [owned, setOwned] = useState([]);
  const [query, setQuery] = useState('');
  const filteredOptions = useMemo(
    () =>
      allHeroNames.filter(
        (n) =>
          n.toLowerCase().includes(query.toLowerCase()) && !owned.includes(n)
      ),
    [allHeroNames, query, owned]
  );

  const toggleOwned = (name) => {
    setOwned((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  // 완전 매칭 카운터덱
  const matched = useMemo(() => {
    const ownedSet = new Set(owned);
    return flatCounters.filter((x) =>
      x.counterHeroNames.every((h) => ownedSet.has(h))
    );
  }, [flatCounters, owned]);

  // 🔹 라벨별로 그룹화
  const groupedByLabel = useMemo(() => {
    const map = new Map();
    matched.forEach((m) => {
      const key = `${m.entryLabel} (${m.category})`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    return map;
  }, [matched]);

  // 보조 컴포넌트들
  const SkillStrip = ({ skills }) => {
    if (!Array.isArray(skills) || skills.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 justify-center">
        {skills.map((img, i) => (
          <img
            key={`${img}-${i}`}
            src={`/images/skills/${img}`}
            alt={`skill-${i + 1}`}
            className="w-8 h-8 border rounded"
          />
        ))}
      </div>
    );
  };

  const HeroRow = ({ team }) => (
    <div className="grid grid-cols-3 gap-2">
      {team.map((h, i) => (
        <div
          key={`${h.name}-${i}`}
          onClick={() => handleHeroClick(h)}
          className="flex flex-col items-center bg-white border rounded-lg p-1 shadow-sm hover:bg-blue-50 cursor-pointer transition"
        >
          <div className="w-14 h-14 flex items-center justify-center">
            <img
              src={heroImg(h.image)}
              alt={h.name}
              className="w-14 h-14 object-contain"
            />
          </div>
          <p className="text-[10px] mt-1 text-center font-semibold">
            {h.name}
          </p>
          {(h.preset || (h.note && h.note.includes('프리셋'))) && (
            <span className="mt-1 text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {h.preset || h.note}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">공격 가능 카운터덱 찾기</h1>
       
        </div>

        {/* 입력 패널 */}
        <div className="border rounded-2xl p-4 shadow-sm bg-white mb-5">
          <p className="text-sm text-gray-700 mb-2">
            내 6초월 보유 영웅을 추가하세요. 보유한 3명이 정확히 들어맞는 카운터덱만 결과에 표시됩니다.
          </p>

          {/* 선택된 영웅 */}
          <div className="flex flex-wrap gap-2 mb-3">
            {owned.map((n) => (
              <button
                key={n}
                onClick={() => toggleOwned(n)}
                className="px-2.5 py-1 rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700"
              >
                {n} ✕
              </button>
            ))}
            {owned.length === 0 && (
              <span className="text-sm text-gray-400">선택된 영웅 없음</span>
            )}
          </div>

          {/* 검색 */}
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded-md text-sm"
              placeholder="영웅 이름 검색 (예: 바네사, 루디, 연희...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              onClick={() => {
                setOwned([]);
                setQuery('');
              }}
              className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
            >
              초기화
            </button>
          </div>

          {/* 검색 결과 */}
          <div className="mt-3 max-h-56 overflow-auto border rounded-md p-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {filteredOptions.map((name) => (
                <button
                  key={name}
                  onClick={() => toggleOwned(name)}
                  className="px-2 py-1.5 border rounded-md text-sm hover:bg-gray-50 text-left"
                >
                  {name}
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <div className="text-sm text-gray-400 px-2 py-1.5">
                  검색 결과 없음
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 상단 요약 */}
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b z-10">
          <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-semibold">선택 영웅 수:</span> {owned.length} 명
            </div>
            <div className="text-sm">
              <span className="font-semibold">매칭된 카운터덱:</span> {matched.length} 개
            </div>
          </div>
        </div>

        {/* 결과: 라벨별 그룹 */}
        <div className="mt-4 space-y-3">
          {Array.from(groupedByLabel.entries()).map(([label, items]) => (
            <div key={label} className="border rounded-xl bg-gray-50">
              <button
                onClick={() =>
                  setOpenLabel(openLabel === label ? null : label)
                }
                className="w-full flex items-center justify-between px-4 py-3 font-semibold text-gray-800 hover:bg-gray-100 rounded-xl transition"
              >
                <span>{label}</span>
                <span className="text-xs text-gray-500">
                  {items.length}개 덱
                </span>
              </button>

              {openLabel === label && (
                <div className="px-4 pb-4 space-y-3 border-t">
                  {items.map((m, idx) => (
                    <div
                      key={`${m.category}-${m.entryIdx}-${m.variantIdx}-${m.counterIdx}`}
                      className="border rounded-lg p-3 bg-white shadow-sm"
                    >
                      {/* 상대 */}
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">
                            상대팀
                          </p>
                          <HeroRow team={m.defenseTeam} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">
                            방어 스킬 순서
                          </p>
                          <SkillStrip skills={m.defenseSkills} />
                        </div>
                      </div>

                      {/* 내 카운터 */}
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">
                          내 카운터덱
                        </p>
                        <HeroRow team={m.counter.team || []} />
                        {Array.isArray(m.counter.skillOrders) &&
                          m.counter.skillOrders.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                스킬 순서
                              </p>
                              <SkillStrip
                                skills={m.counter.skillOrders[0].skills || []}
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {groupedByLabel.size === 0 && (
            <div className="text-center text-sm text-gray-500 border rounded-xl p-8">
              선택한 영웅 3명이 모두 들어맞는 카운터덱이 없습니다.
            </div>
          )}
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
