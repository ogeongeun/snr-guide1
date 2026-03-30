import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import raidBossOptions from "../data/raidBossOptions";
import RaidBossPage from "./RaidBossPage";

export default function RaidPage() {
  const navigate = useNavigate();
  const [activeBossKey, setActiveBossKey] = useState(
    raidBossOptions[0]?.key || ""
  );

  const activeBoss = useMemo(
    () => raidBossOptions.find((x) => x.key === activeBossKey),
    [activeBossKey]
  );

  return (
    <PageShell
      title="레이드 공략"
      right={<div className="text-xs text-slate-500">보스별 추천 팀 / 스킬 순서</div>}
    >
      {/* 모바일 */}
      <div className="lg:hidden space-y-3">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="text-[12px] font-extrabold text-slate-500">
              보스 선택
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {raidBossOptions.map((boss) => (
              <button
                key={boss.key}
                onClick={() => navigate(`/raid/${encodeURIComponent(boss.key)}`)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-extrabold text-slate-900 truncate">
                    {boss.label}
                  </div>
                  <div className="mt-0.5 text-[12px] font-semibold text-slate-500 truncate">
                    팀 목록 보기
                  </div>
                </div>
                <div className="shrink-0 text-slate-300 text-[18px] font-black">›</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PC */}
      <div className="hidden lg:grid mt-6 lg:grid-cols-12 lg:gap-6">
        <aside className="lg:col-span-3">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="text-[12px] font-extrabold text-slate-500">메뉴</div>
              <div className="mt-1 text-[15px] font-black text-slate-900">보스</div>
            </div>

            <div className="p-2">
              {raidBossOptions.map((boss) => {
                const on = activeBossKey === boss.key;
                return (
                  <button
                    key={boss.key}
                    onClick={() => setActiveBossKey(boss.key)}
                    className={`w-full text-left rounded-2xl px-3 py-3 border transition flex items-center gap-3 ${
                      on
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-900 border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-extrabold truncate">
                        {boss.label}
                      </div>
                    </div>
                    <div className={`${on ? "text-white/70" : "text-slate-300"} font-black`}>
                      →
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5">
              <RaidBossPage bossKey={activeBoss?.key || ""} embedded />
            </div>
          </div>
        </main>
      </div>
    </PageShell>
  );
}