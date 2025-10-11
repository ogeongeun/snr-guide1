import { useParams } from 'react-router-dom';
import data from '../data/adventure_teams.json';

const AdventureDetailPage = () => {
  const { stage } = useParams();
  const stageData = data[decodeURIComponent(stage)];

  if (!stageData) {
    return <div className="p-6">해당 스테이지 정보를 찾을 수 없습니다.</div>;
  }

  const renderHeroes = (heroes) => (
    <div className="grid grid-cols-5 gap-2 mt-2">
      {heroes.map((hero, idx) => (
        <div
          key={idx}
          className="flex flex-col items-center bg-white border rounded-lg p-1 shadow-sm"
        >
          <img
            src={hero.image}
            alt={hero.name}
            className="w-14 h-14 object-contain"
          />
          <p className="text-[10px] mt-1 text-center">{hero.name}</p>
          {hero.subText && (
            <p className="text-[10px] text-red-500 font-semibold mt-0.5 text-center">
              {hero.subText}
            </p>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">🗺️ {stage} 모험 덱</h1>

        {Object.entries(stageData).map(([mainKey, teamGroup]) => (
          <div
            key={mainKey}
            className="mb-8 bg-gray-100 border border-gray-200 rounded-xl p-4 shadow-sm"
          >
            <h2 className="text-xl font-bold text-blue-700 mb-3">
              {/* ✅ "일반맵", "보스맵" 같은 key 그대로 보여주기 */}
              {mainKey}
            </h2>

            {Object.entries(teamGroup).map(([subKey, teamData]) => (
              <div key={subKey} className="mb-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  {subKey} {/* team1, team2 그대로 출력 */}
                </p>
                {teamData.description && (
                  <p className="text-xs text-gray-500 italic mb-1">
                    {teamData.description}
                  </p>
                )}
                {renderHeroes(teamData.heroes)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdventureDetailPage;
