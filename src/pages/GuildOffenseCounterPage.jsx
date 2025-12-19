// src/pages/GuildOffenseListPage.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import data from '../data/guildCounter.json';

// ✅ ESLint 의존성 경고 방지를 위한 고정 빈 배열 참조
const EMPTY_LIST = Object.freeze([]);

export default function GuildOffenseListPage() {
  const navigate = useNavigate();
  const categories = Object.keys(data.categories || {});
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || '공덱');
  const [openLabel, setOpenLabel] = useState(null);

  // ✅ 영웅 3명 필터 상태
  const [heroFilter, setHeroFilter] = useState(['', '', '']);

  const entries = Array.isArray(data.categories[selectedCategory])
    ? data.categories[selectedCategory]
    : EMPTY_LIST;

  // =========================
  // 영웅 3명 순서 무관 필터
  // =========================
  const normalizedFilter = heroFilter.filter(Boolean);

  const filteredEntries = useMemo(() => {
    if (normalizedFilter.length === 0) return entries;

    return entries.filter((entry) => {
      if (!Array.isArray(entry.defenseTeam)) return false;

      const defenseNames = entry.defenseTeam.map((h) => h.name);
      return normalizedFilter.every((name) =>
        defenseNames.includes(name)
      );
    });
  }, [entries, normalizedFilter]);

  // 이미지 경로 보정
  const heroImg = (src) =>
    src?.startsWith('/images/') ? src : `/images/heroes/${src || ''}`;

  // 공통 스킬 렌더러
  const SkillStrip = ({ skills, size = 'w-9 h-9' }) => {
    if (!Array.isArray(skills) || skills.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((img, idx) => (
          <img
            key={`${img}-${idx}`}
            src={`/images/skills/${img}`}
            alt={`Skill ${idx + 1}`}
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
      <div className="w-14 h-14 flex items-center justify-center">
        <img
          src={heroImg(hero.image)}
          alt={hero.name}
          className="w-14 h-14 object-contain block"
        />
      </div>
      {hero.note ? (
        <p className="text-[9px] text-red-500 italic mt-0.5 text-center">
          {hero.note}
        </p>
      ) : (
        <div className="h-[14px]" />
      )}
      <p className="text-[10px] mt-1 mb-0 text-center">{hero.name}</p>
    </div>
  );

  // =========================
  // 라벨 기준 그룹핑 (필터 적용된 entries 사용)
  // =========================
  const groupedByLabel = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((entry, idx) => {
      const key = entry.label || '라벨없음';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ idx, entry });
    });
    return map;
  }, [filteredEntries]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">공격팀 추천</h1>

      {/* 팁 박스 */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-sm text-gray-800 mb-8">
        <p className="font-semibold mb-1">공격팀 구성 팁</p>
        <ul className="list-disc list-inside leading-relaxed">
          <li>정보없는곳 공격할때는 방덱으로가는게 승률 좋음</li>
          <li className="text-red-500">상대 속공높은곳은 방덱(막기주고)</li>
          <li className="text-red-500">속공낮은곳은 공덱으로 cc넣고 시작</li>
        </ul>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex gap-2 mb-6 justify-center flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setOpenLabel(null);
            }}
            className={`px-4 py-2 rounded-full border text-sm ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-800 border-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* =========================
          영웅 3명 입력 필터
         ========================= */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <p className="text-sm font-semibold mb-2 text-gray-700">
          방어 영웅 3명 입력 (순서 무관)
        </p>

        <div className="flex gap-2 flex-wrap">
          {heroFilter.map((v, i) => (
            <input
              key={i}
              value={v}
              onChange={(e) => {
                const next = [...heroFilter];
                next[i] = e.target.value.trim();
                setHeroFilter(next);
              }}
              placeholder={`영웅 ${i + 1}`}
              className="border rounded px-3 py-2 text-sm w-32"
            />
          ))}
        </div>
      </div>

      <p className="text-sm font-semibold text-red-500 mb-4">
        라벨 클릭 없이 바로 필터링됩니다
      </p>

      {/* 라벨 아코디언 */}
      <div className="space-y-3">
        {Array.from(groupedByLabel.entries()).map(([label, items]) => (
          <div key={label} className="w-full border rounded-xl bg-gray-50">
            <button
              onClick={() => setOpenLabel(openLabel === label ? null : label)}
              className="w-full text-left px-4 py-3 font-semibold text-gray-800 hover:bg-gray-100 rounded-xl flex items-center justify-between"
            >
              <span>{label}</span>
              <span className="text-xs text-gray-500">{items.length}개 덱</span>
            </button>

            {openLabel === label && (
              <div className="px-4 pb-4 space-y-4 border-t">
                {items.map(({ idx, entry }, i) => {
                  const hasVariants =
                    Array.isArray(entry.defenseVariants) &&
                    entry.defenseVariants.length > 0;

                  return (
                    <div
                      key={`${label}-${idx}-${i}`}
                      className="w-full border rounded-lg p-4 shadow bg-white"
                    >
                      <h2 className="text-lg font-semibold mb-2">
                        [{selectedCategory}] #{idx + 1} {entry.label}
                      </h2>

                      {/* 상대 방어팀 */}
                      {Array.isArray(entry.defenseTeam) && (
                        <>
                          <p className="text-xs font-semibold text-gray-600 mb-1">
                            상대팀
                          </p>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {entry.defenseTeam.map(renderHeroCard)}
                          </div>
                        </>
                      )}

                      {hasVariants ? (
                        <div className="space-y-4">
                          {entry.defenseVariants.map((v, vIdx) => (
                            <div
                              key={vIdx}
                              className="border rounded-md p-3 bg-gray-50"
                            >
                              <p className="text-sm font-semibold mb-2">
                                패턴 #{vIdx + 1}
                              </p>

                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                방어팀 스킬 순서
                              </p>
                              <SkillStrip skills={v.defenseSkills} />

                              <div className="flex justify-end mt-2">
                                <button
                                  onClick={() =>
                                    navigate(
                                      `/guild-offense-detail/${encodeURIComponent(
                                        selectedCategory
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
                      ) : (
                        <div className="flex justify-end">
                          <button
                            onClick={() =>
                              navigate(
                                `/guild-offense-detail/${encodeURIComponent(
                                  selectedCategory
                                )}/${idx}`
                              )
                            }
                            className="px-3 py-1.5 text-sm rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            카운터덱 보기
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
