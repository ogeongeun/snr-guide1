import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function GuildDefensePage() {
  const navigate = useNavigate();

  const features = [
    {
      label: '방어팀 편성',
      path: '/guild-defense/build',
      bg: 'bg-indigo-600',
      description: '길드 방어팀을 설정하고 관리합니다.',
      category: '방어 관련'
    },
    {
      label: '공격팀 배치',
      path: '/guild-offense/setup',
      bg: 'bg-rose-500',
      description: '길드원별 본성,내성,외성을 배치합니다.',
      category: '공격 관련'
    },
     {
      label: '카운터덱 편성',
      path: '/guild-offense',
      bg: 'bg-rose-400',
      description: '방어팀에 대한 추천 카운터팀을 확인합니다.',
      category: '공격 관련',
    },
    
    
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-10">길드전 기능 선택</h1>

      <div className="space-y-10 max-w-2xl mx-auto">
        {['방어 관련', '공격 관련'].map((category) => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-4 text-gray-700">{category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features
                .filter((f) => f.category === category)
                .map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(feature.path)}
                    className={`h-36 flex flex-col items-start justify-center px-6 py-4 text-left rounded-xl shadow-md transition transform hover:scale-[1.03] active:scale-[0.97] ${feature.bg} text-white`}
                  >
                    <div className="text-xl font-semibold mb-2">{feature.label}</div>
                    <div className="text-sm text-white/80">{feature.description}</div>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
