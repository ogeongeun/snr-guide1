import { useState } from 'react';
import { Link } from 'react-router-dom';
import data from '../data/adventure_teams.json';

const Adventure = () => {
  const grouped = groupStages(Object.keys(data));
  const [openGroup, setOpenGroup] = useState(null);

  // 그룹화 로직
  function groupStages(stageKeys) {
    const groups = {};

    // ⭐ 3별작을 먼저 추가
    if (stageKeys.includes('3별작')) {
      groups['⭐ 3별작'] = ['3별작'];
    }

    // 나머지 악몽 단계들
    stageKeys.forEach((stage) => {
      const match = stage.match(/악몽(\d+)-/);
      if (match) {
        const groupKey = `악몽${match[1]}단계`;
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(stage);
      }
    });

    // 정렬 (각 그룹 내에서)
    Object.entries(groups).forEach(([key, group]) => {
      if (key !== '⭐ 3별작') group.sort();
    });

    return groups;
  }

  return (
    <div className="p-6 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        📘 모험 덱 목록
      </h2>
      <p className="text-sm font-semibold text-center text-red-500 mb-4">
        스테이지를 클릭하세여! 팀구성 화면으로 넘어갑니다
      </p>

      <div className="space-y-4 max-w-3xl mx-auto">
        {Object.entries(grouped).map(([group, stages]) => (
          <div key={group} className="border rounded-xl bg-white shadow-sm">
            <button
              onClick={() => setOpenGroup(openGroup === group ? null : group)}
              className="w-full text-left px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50 rounded-t-xl"
            >
              {group} {openGroup === group ? '▲' : '▼'}
            </button>
            {openGroup === group && (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                {stages.map((stage) => (
                  <li key={stage}>
                    <Link
                      to={`/adventure/${encodeURIComponent(stage)}`}
                      className="block bg-gray-100 hover:bg-blue-100 text-center rounded-lg py-2 font-medium text-gray-800 transition"
                    >
                      {stage}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Adventure;
