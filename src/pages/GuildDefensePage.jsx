import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Sword, Zap, Target } from "lucide-react";

export default function GuildDefensePage() {
  const navigate = useNavigate();

  const features = [
    {
      label: "방어팀 편성",
      path: "/guild-defense/build",
      icon: Shield,
      description: "길드 방어팀 설정 및 관리",
      category: "방어 관련",
      badge: "방어",
      tone: "indigo",
    },
    {
      label: "카운터덱 추천",
      path: "/guild-offense-finder",
      icon: Target,
      description: "내 6초월 영웅으로 가능한 카운터덱 추천",
      category: "공격 관련",
      badge: "추천",
      tone: "rose",
    },
    {
      label: "카운터덱 편성",
      path: "/guild-offense",
      icon: Sword,
      description: "방어팀별 추천 카운터 조합 확인",
      category: "공격 관련",
      badge: "편성",
      tone: "pink",
    },
    {
      label: "속공 계산기",
      path: "/guild-offense/setup",
      icon: Zap,
      description: "턴 순서를 기반으로 속공을 유추",
      category: "공격 관련",
      badge: "계산",
      tone: "amber",
    },
  ];

  const grouped = {
    "방어 관련": features.filter((f) => f.category === "방어 관련"),
    "공격 관련": features.filter((f) => f.category === "공격 관련"),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        {/* 헤더(홈이랑 비슷한 톤) */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            className="h-28 lg:h-32 w-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.16), rgba(251,191,36,0.14))",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-5 lg:px-8">
            <div>
              <h1 className="text-[22px] lg:text-[28px] font-black tracking-tight text-slate-900">
                길드전
              </h1>
              <p className="mt-1 text-xs lg:text-sm font-semibold text-slate-700/70">
                방어/공격 기능을 빠르게 선택하세요.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
              >
                홈
              </Link>
            </div>
          </div>
        </div>

        {/* 섹션 */}
        <div className="mt-6 grid gap-6">
          <CategorySection
            title="방어 관련"
            subtitle="방어팀 세팅/관리"
            items={grouped["방어 관련"]}
            onClick={(path) => navigate(path)}
          />

          <CategorySection
            title="공격 관련"
            subtitle="카운터/속공 관련 도구"
            items={grouped["공격 관련"]}
            onClick={(path) => navigate(path)}
          />
        </div>
      </div>
    </div>
  );
}

function CategorySection({ title, subtitle, items, onClick }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-end justify-between gap-3">
        <div>
          <div className="text-[16px] lg:text-[18px] font-black text-slate-900">{title}</div>
          <div className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</div>
        </div>
        <div className="text-xs font-semibold text-slate-400">{items.length}개</div>
      </div>

      <div className="p-4 lg:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((f) => (
            <FeatureCard key={f.path} feature={f} onClick={() => onClick(f.path)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ feature, onClick }) {
  const Icon = feature.icon;

  const tone = feature.tone; // indigo / rose / pink / amber
  const toneMap = {
    indigo: {
      ring: "hover:ring-indigo-200",
      pill: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: "bg-indigo-600",
      glow: "from-indigo-500/15 via-transparent to-transparent",
    },
    rose: {
      ring: "hover:ring-rose-200",
      pill: "bg-rose-50 text-rose-700 border-rose-200",
      icon: "bg-rose-600",
      glow: "from-rose-500/15 via-transparent to-transparent",
    },
    pink: {
      ring: "hover:ring-pink-200",
      pill: "bg-pink-50 text-pink-700 border-pink-200",
      icon: "bg-pink-600",
      glow: "from-pink-500/15 via-transparent to-transparent",
    },
    amber: {
      ring: "hover:ring-amber-200",
      pill: "bg-amber-50 text-amber-800 border-amber-200",
      icon: "bg-amber-500",
      glow: "from-amber-500/18 via-transparent to-transparent",
    },
  };

  const t = toneMap[tone] || toneMap.indigo;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full text-left rounded-2xl border border-slate-200 bg-white shadow-sm",
        "hover:shadow-md transition transform hover:-translate-y-[1px]",
        "p-4 relative overflow-hidden",
        "ring-0 hover:ring-2",
        t.ring,
      ].join(" ")}
    >
      {/* 은은한 그라데이션 */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.glow}`} />

      <div className="relative flex items-start gap-3">
        <div className={`shrink-0 rounded-xl ${t.icon} text-white p-2 shadow-sm`}>
          <Icon size={20} strokeWidth={2.4} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-[15px] font-black text-slate-900 truncate">{feature.label}</div>
            <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-extrabold border ${t.pill}`}>
              {feature.badge}
            </span>
          </div>

          <div className="mt-1 text-[12px] font-semibold text-slate-600 leading-snug line-clamp-2">
            {feature.description}
          </div>

          <div className="mt-3 text-xs font-extrabold text-slate-400 group-hover:text-slate-600 transition">
            열기 →
          </div>
        </div>
      </div>
    </button>
  );
}
