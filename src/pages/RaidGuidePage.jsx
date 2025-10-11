// src/pages/RaidGuidePage.jsx
import { useNavigate } from 'react-router-dom';
import raidTeamsData from '../data/raid_teams.json';

const RaidGuidePage = () => {
  const navigate = useNavigate();

  const goDetail = (bossKey, teamIndex) => {
    const encoded = encodeURIComponent(bossKey);
    navigate(`/raid-skill/${encoded}/${teamIndex}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">⚔️ 레이드 공략</h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          🧙 팀을 클릭하면 스킬 순서가 표시됩니다.
        </p>

        {/* 보스별 팀 리스트 */}
        <div className="space-y-10">
          {Object.entries(raidTeamsData).map(([bossKey, teams]) => (
            <div key={bossKey}>
              <h2 className="text-xl font-bold text-gray-800 mb-4">{bossKey}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {teams.map((team, teamIndex) => (
                  <button
                    key={teamIndex}
                    onClick={() => goDetail(bossKey, teamIndex)}
                    className="bg-white border rounded-lg p-4 shadow hover:shadow-lg transition text-left"
                  >
                    <p className="font-semibold text-gray-800 mb-3">팀 {teamIndex + 1}</p>

                    {/* ✅ 영웅들을 스크롤 없이 grid로 */}
                    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${team.team.length}, minmax(0,1fr))` }}>
                      {team.team.map((hero, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center justify-start bg-white border rounded-lg p-1 shadow-sm h-[95px]"
                        >
                          {/* 이미지 크기 줄임 */}
                          <div className="w-12 h-12 flex items-center justify-center">
                            <img
                              src={`/images/heroes/${hero.image}`}
                              alt={hero.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>

                          <p className="text-[9px] mt-1 text-center">{hero.name}</p>
                          {hero.note ? (
                            <p className="text-[8px] text-red-500 text-center italic mt-0.5">
                              {hero.note}
                            </p>
                          ) : (
                            <div className="h-[12px]" /> // 빈 공간 확보
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 팀 전체 note */}
                    {team.note && (
                      <p className="mt-3 text-xs text-gray-600 leading-5">{team.note}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RaidGuidePage;
