import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sword, Zap, Target } from 'lucide-react';

export default function GuildDefensePage() {
  const navigate = useNavigate();

  const features = [
    {
      label: '방어팀 편성',
      path: '/guild-defense/build',
      bg: 'from-indigo-500 to-indigo-700',
      icon: Shield,
      description: '길드 방어팀 설정 및 관리',
      category: '방어 관련',
    },
    {
      label: '카운터덱 추천',
      path: '/guild-offense-finder',
      bg: 'from-rose-500 to-pink-500',
      icon: Target,
      description: '내 6초월 영웅으로 가능한 카운터덱 추천',
      category: '공격 관련',
    },
    {
      label: '속공 계산기',
      path: '/guild-offense/setup',
      bg: 'from-amber-400 to-orange-500',
      icon: Zap,
      description: '턴 순서를 기반으로 속공을 유추',
      category: '공격 관련',
    },
    {
      label: '카운터덱 편성',
      path: '/guild-offense',
      bg: 'from-rose-300 to-pink-400',
      icon: Sword,
      description: '방어팀별 추천 카운터 조합 확인',
      category: '공격 관련',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800">
          ⚔️ 길드전 기능 선택
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          방어와 공격 관련 주요 기능을 빠르게 선택하세요.
        </p>
      </div>

      {/* 카드 영역 */}
      <div className="space-y-8 max-w-5xl mx-auto">
        {['방어 관련', '공격 관련'].map((category) => (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-l-4 border-blue-500 pl-3">
              {category}
            </h2>

            {/* ✅ 카드 가로 길이 조정: 더 작고 컴팩트하게 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {features
                .filter((f) => f.category === category)
                .map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(feature.path)}
                      className={`relative group h-32 w-full flex flex-col items-start justify-center px-4 py-3 text-left rounded-xl shadow-md hover:shadow-lg transition-all bg-gradient-to-br ${feature.bg} text-white overflow-hidden`}
                    >
                      {/* 배경 효과 */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity"></div>

                      {/* 아이콘 + 제목 */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                          <Icon size={22} strokeWidth={2.2} />
                        </div>
                        <h3 className="text-lg font-semibold">
                          {feature.label}
                        </h3>
                      </div>

                      {/* 설명문 */}
                      <p className="text-[13px] text-white/90 leading-snug">
                        {feature.description}
                      </p>

                      {/* 화살표 애니메이션 */}
                      <div className="absolute right-4 bottom-3 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all text-white/70">
                        ➜
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

     
    </div>
  );
}
