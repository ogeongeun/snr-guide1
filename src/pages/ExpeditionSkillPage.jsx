import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import expeditionSkills from '../data/expedition-skills.json';

export default function ExpeditionSkillPage() {
  const { heroId } = useParams();
  const decodedHeroId = decodeURIComponent(heroId);

  const heroSkillSets = expeditionSkills.expeditionSkills?.[decodedHeroId];
  const teams = heroSkillSets?.[0]?.teams || [];

  const [activeTeam, setActiveTeam] = useState(0);

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
  const skills = selectedTeam.skills || [];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          ⚔️ {decodedHeroId.toUpperCase()} - {selectedTeam.teamName} 스킬 순서
        </h1>

        {/* 🔹 팀 전환 탭 */}
        <div className="flex justify-center gap-4 mb-6">
          {teams.map((team, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTeam(idx)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeTeam === idx
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {team.teamName}
            </button>
          ))}
        </div>

        {/* 🔹 스킬 리스트 */}
        <div className="flex flex-wrap justify-center gap-3">
          {skills.map((item, i) => {
            const isObj = typeof item === 'object';
            const src = isObj ? item.image : item;
            const label = isObj ? item.label : null;

            return (
              <div key={i} className="flex flex-col items-center w-[70px]">
                <img
                  src={imgPath(src)}
                  alt={`skill-${i}`}
                  className="w-12 h-12 border rounded object-contain"
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
