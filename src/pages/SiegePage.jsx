import { useState } from 'react';
import siegeTeamsData from '../data/siege-teams.json';
import siegeSkills from '../data/siege-skills.json';
import { Link } from 'react-router-dom';

const dayOrder = [
  "수호자의 성 (월요일)",
  "포디나의 성 (화요일)",
  "불멸의 성 (수요일)",
  "죽음의 성 (목요일)",
  "고대용의 성 (금요일)",
  "흑한의 성 (토요일)",
  "지옥의 성 (일요일)",
];

const SiegePage = () => {
  const [selectedDay, setSelectedDay] = useState(dayOrder[0]);
  const [viewMode, setViewMode] = useState('heroes');

  const renderHeroes = (heroes) => (
    <div className="grid grid-cols-5 gap-2 mt-4">
      {heroes.map((hero, idx) => {
        const imagePath = hero.image?.startsWith('/images/')
          ? hero.image
          : `/images/heroes/${hero.image}`;

        return (
          <div
            key={idx}
            className="flex flex-col items-center justify-start bg-white border rounded-lg p-1 shadow-sm h-[110px]"
          >
            <img
              src={imagePath}
              alt={hero.name}
              className="w-14 h-14 object-contain"
            />
            <p className="text-[10px] mt-1 text-center">{hero.name}</p>
            {hero.note ? (
              <p className="text-[9px] text-red-500 text-center italic mt-0.5">
                {hero.note}
              </p>
            ) : (
              <div className="h-[14px]" /> // 빈 공간 확보용
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">🏰 공성전 필수 정보</h1>

        {/* 요일 버튼 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {dayOrder.map((day) => (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(day);
                setViewMode('heroes');
              }}
              className={`text-sm px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition ${
                selectedDay === day ? 'ring-2 ring-purple-400' : ''
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* 콘텐츠 영역 */}
        <div className="mt-4">
          <h3 className="text-xl font-bold text-gray-700 mb-4">{selectedDay}</h3>

          <p className="text-sm font-semibold text-red-500 mb-4">
            팀을 클릭하세여! 스킬순서 화면으로 넘어갑니다
          </p>

          {viewMode === 'skills' ? (
            <div className="space-y-6">
              {siegeSkills[selectedDay]?.skills?.length > 0 ? (
                siegeSkills[selectedDay].skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center text-center bg-gray-100 p-4 rounded-xl shadow-sm"
                  >
                    <img
                      src={`/images/skills/${skill.image}`}
                      alt={`Skill ${idx + 1}`}
                      className="w-24 h-24 object-contain mb-3"
                    />
                    <p className="text-base sm:text-lg text-gray-800 leading-relaxed">
                      {skill.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm italic text-gray-500">스킬 정보 없음</p>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {siegeTeamsData.siegeTeams[selectedDay]?.map((team, i) => (
                <li
                  key={i}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-md transition"
                >
                  <Link to={`/siege-skill/${encodeURIComponent(selectedDay)}/${i}`}>
                    <p className="font-semibold text-gray-700 mb-2">팀 {i + 1} 클릭하세요!</p>
                    {renderHeroes(team.team)}
                    {team.tags && (
                      <p className="mt-2 text-xs text-gray-500">설명: {team.tags.join(', ')}</p>
                    )}
                    {team.note && (
                      <p className="text-[11px] text-red-500 mt-1 italic">※ {team.note}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiegePage;
