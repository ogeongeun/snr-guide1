import React from 'react';
import farmingEfficiencyData from '../data/farmingEfficiency.json';

const FarmingEfficiency = () => {
  const chapters = [...new Set(farmingEfficiencyData.map(item => item.챕터))];

  const getBoxData = (chapter, plan) =>
    farmingEfficiencyData
      .filter(item => item.챕터 === chapter && item.월정액 === plan)
      .map(item => ({
        box: item.상자종류,
        invest: item.총투자루비,
        keys: item.총사용열쇠,
        earn: item.총획득루비,
        profit: item.총손익,
      }));

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">쫄작 효율 비교 (월정액 O vs X)</h2>

      {chapters.map((chapter, index) => {
        const dataO = getBoxData(chapter, 'O');
        const dataX = getBoxData(chapter, 'X');

        return (
          <div key={index} className="mb-10">
            <h3 className="text-lg font-semibold mb-3">{chapter}</h3>

            <div className="grid grid-cols-1 gap-6">
              {/* 월정액 O */}
              <div className="bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400 rounded-2xl shadow-xl p-6">
                <h4 className="text-green-800 font-bold text-xl text-center mb-4 drop-shadow">월정액 O</h4>
                <div className="space-y-3">
                  {dataO.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg shadow-md px-4 py-3 border-l-4 border-green-500 hover:scale-[1.01] transition-all duration-150"
                    >
                      <div className="font-bold mb-2 text-green-700">{item.box}</div>
                      <div className="text-sm text-gray-700">
                        <div className="flex justify-between"><span>투자 루비</span><span>{item.invest}</span></div>
                        <div className="flex justify-between"><span>열쇠 사용</span><span>{item.keys}</span></div>
                        <div className="flex justify-between"><span>획득 루비</span><span>{item.earn}</span></div>
                        <div className={`flex justify-between font-semibold ${item.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          <span>손익</span><span>{item.profit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 월정액 X */}
              <div className="bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-400 rounded-2xl shadow-xl p-6">
                <h4 className="text-red-800 font-bold text-xl text-center mb-4 drop-shadow">월정액 X</h4>
                <div className="space-y-3">
                  {dataX.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg shadow-md px-4 py-3 border-l-4 border-red-500 hover:scale-[1.01] transition-all duration-150"
                    >
                      <div className="font-bold mb-2 text-red-700">{item.box}</div>
                      <div className="text-sm text-gray-700">
                        <div className="flex justify-between"><span>투자 루비</span><span>{item.invest}</span></div>
                        <div className="flex justify-between"><span>열쇠 사용</span><span>{item.keys}</span></div>
                        <div className="flex justify-between"><span>획득 루비</span><span>{item.earn}</span></div>
                        <div className={`flex justify-between font-semibold ${item.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          <span>손익</span><span>{item.profit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default FarmingEfficiency;
