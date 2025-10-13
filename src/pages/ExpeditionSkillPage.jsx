import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import expeditionSkills from '../data/expedition-skills.json';

export default function ExpeditionSkillPage() {
  // ✅ teamIdx도 받아오기
  const { heroId, teamIdx } = useParams();
  const decodedHeroId = decodeURIComponent(heroId);

  const heroSkillSets = expeditionSkills.expeditionSkills?.[decodedHeroId];
  const teams = heroSkillSets?.[0]?.teams || [];

  // ✅ URL에서 받은 teamIdx를 숫자로 변환
  const initialTeamIndex = Number.parseInt(teamIdx, 10) || 0;

  // ✅ teamIdx에 따라 초기화
  const [activeTeam, setActiveTeam] = useState(initialTeamIndex);
  const [activeSkillSet, setActiveSkillSet] = useState('skills');

  // ✅ URL이 바뀔 때마다 activeTeam 동기화
  useEffect(() => {
    setActiveTeam(initialTeamIndex);
    setActiveSkillSet('skills');
  }, [initialTeamIndex, heroId]);

  if (!teams.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        ⚠️ 스킬 순서 데이터를 찾을 수 없습니다.
      </div>
    );
  }

  const imgPath = (img) =>
    img?.startsWith?.('/images/') ? img : `/images/skills/${img}`;

  const selectedTeam = teams[activeTeam];

  // ✅ skills / skills1 / skills2 모두 감지
  const skillEntries = Object.entries(selectedTeam).filter(([key]) =>
    key.startsWith('skills')
  );

  let skillSets = [];

  if (skillEntries.length > 0) {
    skillSets = skillEntries.map(([key, val]) => ({
      key,
      tag: val?.tag || '기본컷',
      sequence: val?.sequence || [],
    }));
  } else if (Array.isArray(selectedTeam.skills)) {
    skillSets = [
      {
        key: 'skills',
        tag: '기본세팅',
        sequence: selectedTeam.skills,
      },
    ];
  } else if (selectedTeam.skills?.sequence) {
    skillSets = [
      {
        key: 'skills',
        tag: selectedTeam.skills.tag || '기본세팅',
        sequence: selectedTeam.skills.sequence,
      },
    ];
  }

  const currentSet =
    skillSets.find((set) => set.key === activeSkillSet) || skillSets[0];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          ⚔️ {decodedHeroId.toUpperCase()} - {selectedTeam.teamName} 스킬 순서
        </h1>

        {/* 🔹 팀 전환 탭 */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          {teams.map((team, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveTeam(idx);
                setActiveSkillSet('skills');
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                activeTeam === idx
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {team.teamName}
            </button>
          ))}
        </div>

        {/* 🔹 세트 전환 버튼 */}
        {skillSets.length > 1 && (
          <div className="flex justify-center gap-2 mb-6 flex-wrap">
            {skillSets.map((set) => (
              <button
                key={set.key}
                onClick={() => setActiveSkillSet(set.key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                  activeSkillSet === set.key
                    ? 'bg-yellow-400 border-yellow-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {set.tag}
              </button>
            ))}
          </div>
        )}

        {/* 🔹 스킬 리스트 */}
        <div className="flex flex-wrap justify-center gap-3">
          {currentSet.sequence.map((item, i) => {
            const isObj = typeof item === 'object';
            const src = isObj ? item.image : item;
            const label = isObj ? item.label : null;

            return (
              <div
                key={i}
                className="flex flex-col items-center w-[70px] bg-gray-50 rounded-xl p-2 shadow-sm"
              >
                <img
                  src={imgPath(src)}
                  alt={`skill-${i}`}
                  className="w-12 h-12 border rounded-lg object-contain"
                />
                <p className="text-[11px] text-gray-600 mt-1">#{i + 1}</p>
                {label && (
                  <p className="text-[10px] text-red-500 mt-1 text-center leading-snug">
                    {label}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* 🔹 뒤로가기 */}
        <div className="text-center mt-8">
          <Link
            to={`/expedition/${heroId}`}
            className="text-blue-500 text-sm hover:underline"
          >
            ← 팀 목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
