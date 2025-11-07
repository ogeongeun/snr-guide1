import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Sword, Zap, Target } from 'lucide-react'; // lucide 아이콘 추가

export default function GuildDefensePage() {
  const navigate = useNavigate();

  const features = [
    {
      label: '방어팀 편성',
      path: '/guild-defense/build',
      bg: 'from-indigo-500 to-indigo-700',
      icon: Shield,
      description: '길드 방어팀을 설정하고 관리합니다.',
      category: '방어 관련',
    },
    {
      label: '카운터덱 추천',
      path: '/guild-offense-finder',
      bg: 'from-rose-500 to-pink-500',
      icon: Target,
      description: '내 6초월 영웅으로 공격 가능한 카운터덱을 추천합니다.',
      category: '공격 관련',
    },
    {
      label: '속공 계산기',
      path: '/guild-offense/setup',
      bg: 'from-amber-400 to-orange-500',
      icon: Zap,
      description: '턴 순서를 기반으로 상대 속공을 유추합니다.',
      category: '공격 관련',
    },
    {
      label: '카운터덱 편성',
      path: '/guild-offense',
      bg: 'from-rose-300 to-pink-400',
      icon: Sword,
      description: '방어팀에 맞는 최적의 카운터 조합을 확인합니다.',
      category: '공격 관련',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
      {/* 상단 헤더 */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-3">
          ⚔️ 길드전 기능 선택
        </h1>
        <p className="text-gray-600 text-sm">
          방어와 공격 관련 기능을 선택하여 빠르게 관리하세요.
        </p>
      </div>

      <div className="space-y-10 max-w-4xl mx-auto">
        {['방어 관련', '공격 관련'].map((category) => (
          <div key={category}>
            <h2 className="text-2xl font-semibold mb-5 text-gray-700 border-l-4 border-blue-500 pl-3">
              {category}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features
                .filter((f) => f.category === category)
                .map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(feature.path)}
                      className={`relative group h-40 flex flex-col items-start justify-center px-6 py-4 text-left rounded-2xl shadow-md hover:shadow-xl transition-all bg-gradient-to-br ${feature.bg} text-white overflow-hidden`}
                    >
                      {/* 배경 효과 */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity"></div>

                      {/* 아이콘 */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <Icon size={28} strokeWidth={2.2} />
                        </div>
                        <h3 className="text-xl font-bold">{feature.label}</h3>
                      </div>

                      <p className="text-sm text-white/90 leading-snug">
                        {feature.description}
                      </p>

                      {/* 호버 시 화살표 애니메이션 */}
                      <div className="absolute right-5 bottom-5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all text-white/70">
                        ➜
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 문구 */}
      
    </div>
  );
}
