// src/pages/ExpeditionPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function ExpeditionPage() {
  const heroes = [
    {
      id: 'darkteo',
      name: '테오',
      role: '딜러',
      image: 'darkteo.png',
      attackers: [
       
      ]
    },
    {
      id: 'darkkile',
      name: '카일',
      role: '딜러',
      image: 'darkkile.png',
      attackers: [
     
      ]
    },
    {
      id: 'darkyeonhee',
      name: '연희',
      role: '버퍼',
      image: 'darkYeonhee.png',
      attackers: []
    },
    {
      id: 'darkcarma',
      name: '카르마',
      role: '탱커',
      image: 'darkcarma.png',
      attackers: [
       
      ]
    },
    {
      id: 'bosss',
      name: '파괴신',
      role: '딜러',
      image: 'bosss.png',
      // attackers가 없더라도 안전하게 처리됨
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-3">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6">
          ⚔️ 강림원정대 공격 인원 현황
        </h1>
        <p className="text-center text-gray-600 mb-8 text-sm sm:text-base">
          각 영웅 이미지를 클릭하면 세트 조합과 장비 추천 페이지로 이동합니다.
        </p>

        {/* 🔹 카드 레이아웃 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {heroes.map((hero) => (
            <div
              key={hero.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1 p-3 sm:p-4"
            >
              <Link to={`/expedition/${hero.id}`}>
                <div className="flex flex-col items-center text-center">
                  <img
                    src={`/images/heroes/${hero.image}`}
                    alt={hero.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain mb-2"
                  />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                    {hero.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3">
                    {hero.role}
                  </p>
                </div>
              </Link>

              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs sm:text-sm font-semibold text-indigo-700 mb-1">
                  공격 인원 ({hero.attackers?.length || 0}명)
                </p>
                <div className="flex flex-wrap justify-center gap-1">
                  {hero.attackers?.length > 0 ? (
                    hero.attackers.map((name, idx) => (
                      <span
                        key={idx}
                        className="bg-indigo-100 text-indigo-700 text-[10px] sm:text-xs px-2 py-0.5 rounded-md"
                      >
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-[10px] sm:text-xs">
                      등록된 인원이 없습니다
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 표시 */}
      <div className="absolute bottom-2 right-4 text-[10px] sm:text-xs text-gray-400">
        sj
      </div>
    </div>
  );
}
