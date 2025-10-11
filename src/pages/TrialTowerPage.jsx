import { useState } from 'react';
import { Link } from 'react-router-dom';
import rawData from '../data/trial_tower_teams.json';

const TrialTowerPage = () => {
  const data = rawData;
  const grouped = groupFloorsByFixedRanges(data);
  const [openGroup, setOpenGroup] = useState(null);

  function groupFloorsByFixedRanges(data) {
    const groups = {};

    // ✅ "일반층" 별도 처리
    if (data['일반층']) {
      groups['일반층'] = ['일반층'];
    }

    // ✅ 숫자층만 추출 (1층, 2층 등 포함)
    const keys = Object.keys(data).filter(k => /^\d+층$/.test(k));
    const numericFloors = keys.map(k => parseInt(k)).filter(n => !isNaN(n));

    // ✅ 10층 단위 그룹 (1~10, 11~20, ..., 191~200)
    for (let start = 1; start <= 200; start += 10) {
      const end = Math.min(start + 9, 200);
      const groupKey = `${start}~${end}`;
      const floors = numericFloors
        .filter(num => num >= start && num <= end)
        .sort((a, b) => a - b)
        .map(num => `${num}층`);
      if (floors.length > 0) {
        groups[groupKey] = floors;
      }
    }

    // ✅ 그룹 순서: 일반층 → 나머지는 내림차순
    const sortedKeys = Object.keys(groups).filter(k => k !== '일반층').sort((a, b) => {
      const aStart = parseInt(a.split('~')[0]);
      const bStart = parseInt(b.split('~')[0]);
      return bStart - aStart;
    });

    const sortedGroups = {};
    if (groups['일반층']) sortedGroups['일반층'] = groups['일반층'];
    sortedKeys.forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }

  // ✅ 2열로 열 우선 배치 (왼쪽 아래 → 오른쪽 위)
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
      <h1 className="text-3xl font-bold mb-6 text-center">🔥 시련의 탑 공략</h1>
      <p className="text-[15px] text-red-500 text-center mb-6">
         6메달 기준
      </p>
      <div className="space-y-4">
        {Object.entries(grouped).map(([range, floors]) => (
          <div key={range} className="border rounded-xl shadow-sm bg-white">
            <button
              onClick={() => setOpenGroup(openGroup === range ? null : range)}
              className="w-full text-left px-4 py-2 font-semibold text-red-700 hover:bg-red-50 rounded-t-xl"
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
                          to={`/trial-tower/${encodeURIComponent(floor)}`}
                          className="block bg-gray-100 rounded-lg text-center py-2 hover:bg-red-100"
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

export default TrialTowerPage;
