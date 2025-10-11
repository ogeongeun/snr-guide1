import { useState } from 'react';
import { Link } from 'react-router-dom';
import rawData from '../data/infinity_tower_teams.json';

const InfinityTowerPage = () => {
  const data = rawData;
  const grouped = groupFloorsByFixedRanges(data);
  const [openGroup, setOpenGroup] = useState(null);

  function groupFloorsByFixedRanges(data) {
    const groups = {};

    // ✅ 일반층은 항상 가장 위 그룹으로 추가
    if (data['일반층']) {
      groups['일반층'] = ['일반층'];
    }

    // ✅ 100~200층 중 존재하는 층만 필터링하여 그룹화
    const keys = Object.keys(data).filter(k => /^\d+층$/.test(k));
    const numericFloors = keys.map(k => parseInt(k)).filter(n => n >= 100 && n <= 250);

    for (let start = 100; start <= 240; start += 10) {
  const end = start + 9;
      const groupKey = `${start}~${end}`;
      const floors = numericFloors
        .filter(num => num >= start && num <= end)
        .sort((a, b) => a - b) // ✅ 올림차순 정렬
        .map(num => `${num}층`);

      if (floors.length > 0) {
        groups[groupKey] = floors;
      }
    }

    // ✅ 그룹 자체를 내림차순 정렬 (일반층 제외)
    const sortedKeys = Object.keys(groups).filter(k => k !== '일반층').sort((a, b) => {
      const aStart = parseInt(a.split('~')[0]);
      const bStart = parseInt(b.split('~')[0]);
      return bStart - aStart;
    });

    const sortedGroups = {};
    if (groups['일반층']) {
      sortedGroups['일반층'] = groups['일반층'];
    }
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }

  // ✅ 행 우선 배치 + 열 방향 추출 (왼쪽 아래 → 오른쪽 위)
  function formatForColumnByRowPriority(floors, columns = 2) {
    const rows = Math.ceil(floors.length / columns);
    const grid = Array.from({ length: rows }, () => []);

    floors.forEach((floor, idx) => {
      const row = Math.floor(idx / columns);
      grid[row].push(floor);
    });

    const result = Array.from({ length: columns }, () => []);
    for (let col = 0; col < columns; col++) {
      for (let row = rows - 1; row >= 0; row--) {
        const item = grid[row][col];
        if (item) result[col].push(item);
      }
    }

    return result;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🗼 무한의 탑 공략</h1>
       <p className="text-[15px] text-red-500 text-center mb-6">
          최소조건 : 3스테이지까지 다 살고, 최소 속공 넘기
        </p>
      <div className="space-y-4">
        {Object.entries(grouped).map(([range, floors]) => (
          <div key={range} className="border rounded-xl shadow-sm bg-white">
            <button
              onClick={() => setOpenGroup(openGroup === range ? null : range)}
              className="w-full text-left px-4 py-2 font-semibold text-purple-700 hover:bg-purple-50 rounded-t-xl"
            >
              {range} {openGroup === range ? '▲' : '▼'}
            </button>

            {openGroup === range && (
              <div className="flex gap-4 p-4">
                {formatForColumnByRowPriority(floors).map((col, idx) => (
                  <ul key={idx} className="flex flex-col gap-2 flex-1">
                    {col.map(floor => (
                      <li key={floor}>
                        <Link
                          to={`/infinity-tower/${encodeURIComponent(floor)}`}
                          className="block bg-gray-100 rounded-lg text-center py-2 hover:bg-purple-100"
                        >
                          {floor}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfinityTowerPage;
