import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";
import { SiegeDayPanel } from "./SiegeDayPage";



const dayOrder = [
  "수호자의 성 (월요일)",
  "포디나의 성 (화요일)",
  "불멸의 성 (수요일)",
  "죽음의 성 (목요일)",
  "고대용의 성 (금요일)",
  "흑한의 성 (토요일)",
  "지옥의 성 (일요일)",
];

const menu = dayOrder.map((d) => ({
  key: d,
  label: d,
 
  
  to: `/siege/${encodeURIComponent(d)}`,
}));

export default function SiegePage() {
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState(dayOrder[0]);
  

  return (
    <PageShell
      title="공성전"
      right={<div className="text-xs text-slate-500">요일별 추천 팀/스킬</div>}
    >
      {/* 모바일: 요일 리스트만 */}
      <div className="lg:hidden space-y-3">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="text-[12px] font-extrabold text-slate-500">
              요일 선택
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {menu.map((m) => (
              <button
                key={m.key}
                onClick={() => navigate(m.to)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
              >
                <div className="shrink-0 text-[20px] leading-none">{m.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-extrabold text-slate-900 truncate">
                    {m.label}
                  </div>
                  <div className="mt-0.5 text-[12px] font-semibold text-slate-500 truncate">
                    {m.desc}
                  </div>
                </div>
                <div className="shrink-0 text-slate-300 text-[18px] font-black">›</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PC: 좌측 요일 + 우측 패널 */}
      <div className="hidden lg:grid mt-6 lg:grid-cols-12 lg:gap-6">
        <aside className="lg:col-span-3">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="text-[12px] font-extrabold text-slate-500">메뉴</div>
              <div className="mt-1 text-[15px] font-black text-slate-900">요일</div>
            </div>

            <div className="p-2">
              {dayOrder.map((d) => {
                const on = activeDay === d;
                return (
                  <button
                    key={d}
                    onClick={() => setActiveDay(d)}
                    className={`w-full text-left rounded-2xl px-3 py-3 border transition flex items-center gap-3 ${
                      on
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-900 border-transparent hover:bg-slate-50"
                    }`}
                  >
                    
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-extrabold truncate">{d}</div>
                      
                    </div>
                    <div className={`${on ? "text-white/70" : "text-slate-300"} font-black`}>→</div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          

            <div className="p-5">
              <SiegeDayPanel selectedDay={activeDay} />
            </div>
          </div>
        </main>
      </div>
    </PageShell>
  );
}
