// src/pages/GuildOffenseListPage.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import data from '../data/guildCounter.json';

export default function GuildOffenseListPage() {
  const navigate = useNavigate();
  const categories = Object.keys(data.categories || {});
  const [openLabel, setOpenLabel] = useState(null);

  // 🔍 영웅 검색
  const [heroFilter, setHeroFilter] = useState(['', '', '']);

  // =========================
  // ✅ 모든 카테고리 통합 (검색용)
  // =========================
  const allEntries = useMemo(() => {
    const list = [];
    categories.forEach((cat) => {
      const arr = data.categories[cat];
      if (!Array.isArray(arr)) return;

      arr.forEach((entry, idx) => {
        list.push({
          category: cat,
          idx,
          entry,
        });
      });
    });
    return list;
  }, [categories]);

  // =========================
  // 🔍 부분 검색 + 순서 무관
  // =========================
  const normalizedFilter = heroFilter
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  const filteredEntries = useMemo(() => {
    if (normalizedFilter.length === 0) return allEntries;

    return allEntries.filter(({ entry }) => {
      if (!Array.isArray(entry.defenseTeam)) return false;

      const defenseNames = entry.defenseTeam.map((h) =>
        h.name.toLowerCase()
      );

      return normalizedFilter.every((input) =>
        defenseNames.some((dn) => dn.includes(input))
      );
    });
  }, [allEntries, normalizedFilter]);

  // =========================
  // 라벨 기준 그룹핑
  // =========================
  const groupedByLabel = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((item) => {
      const key = item.entry.label || '라벨없음';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [filteredEntries]);

  // =========================
  // 공통 렌더러
  // =========================
  const heroImg = (src) =>
    src?.startsWith('/images/') ? src : `/images/heroes/${src || ''}`;

  const SkillStrip = ({ skills, size = 'w-9 h-9' }) => {
    if (!Array.isArray(skills) || skills.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
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

  const renderHeroCard = (hero) => (
    <div
      key={`${hero.name}-${hero.image}`}
      className="flex flex-col items-center bg-white border rounded-lg p-1 shadow-sm"
    >
      <img
        src={heroImg(hero.image)}
        alt={hero.name}
        className="w-14 h-14 object-contain"
      />
      <p className="text-[10px] mt-1">{hero.name}</p>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">공격팀 추천</h1>

      {/* 공격 구성 팁 */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-sm text-gray-800 mb-8">
        <p className="font-semibold mb-1">공격팀 구성 팁</p>
        <ul className="list-disc list-inside leading-relaxed">
          <li>정보없는곳 공격할때는 방덱으로가는게 승률 좋음</li>
          <li className="text-red-500">상대 속공높은곳은 방덱(막기주고)</li>
          <li className="text-red-500">속공낮은곳은 공덱으로 cc넣고 시작</li>
        </ul>
      </div>

      {/* 검색 */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <p className="text-sm font-semibold mb-2 text-gray-700">
          방어 영웅 입력 (통합, 부분 검색)
        </p>

        <div className="flex gap-2 flex-wrap">
          {heroFilter.map((v, i) => (
            <input
              key={i}
              value={v}
              onChange={(e) => {
                const next = [...heroFilter];
                next[i] = e.target.value;
                setHeroFilter(next);
              }}
              placeholder={`영웅 ${i + 1}`}
              className="border rounded px-3 py-2 text-sm w-32"
            />
          ))}
        </div>
      </div>

      {/* 라벨 아코디언 */}
      <div className="space-y-3">
        {Array.from(groupedByLabel.entries()).map(([label, items]) => (
          <div key={label} className="w-full border rounded-xl bg-gray-50">
            <button
              onClick={() => setOpenLabel(openLabel === label ? null : label)}
              className="w-full text-left px-4 py-3 font-semibold flex justify-between"
            >
              <span>{label}</span>
              <span className="text-xs text-gray-500">
                {items.length}개 덱
              </span>
            </button>

            {openLabel === label && (
              <div className="px-4 pb-4 space-y-4 border-t">
                {items.map(({ category, idx, entry }, i) => (
                  <div
                    key={`${category}-${idx}-${i}`}
                    className="border rounded-lg p-4 bg-white shadow"
                  >
                    <h2 className="text-lg font-semibold mb-2">
                      [{category}] #{idx + 1} {entry.label}
                    </h2>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {entry.defenseTeam?.map(renderHeroCard)}
                    </div>

                    {entry.defenseVariants?.map((v, vIdx) => (
                      <div
                        key={vIdx}
                        className="border rounded-md p-3 bg-gray-50 mb-3"
                      >
                        <p className="text-sm font-semibold mb-1">
                          패턴 #{vIdx + 1}
                        </p>
                        <SkillStrip skills={v.defenseSkills} />

                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/guild-offense-detail/${encodeURIComponent(
                                  category
                                )}/${idx}?variant=${vIdx}`
                              )
                            }
                            className="px-3 py-1.5 text-sm rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            카운터덱 보기
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
