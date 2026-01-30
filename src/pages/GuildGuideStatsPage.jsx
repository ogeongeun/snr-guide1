// src/pages/GuildGuideStatsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const sourceLabel = (src) => {
    
  if (src === "guild_counter_posts") return "길드전(카운터글)";
  if (src === "guild_defense_posts") return "길드전(방덱글)";
  if (src === "siege_team_posts") return "공성전(팀글)";
  return src || "";
};

export default function GuildGuideStatsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  // ✅ 상세 모달
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailGuild, setDetailGuild] = useState("");
  const [detailKind, setDetailKind] = useState(""); // '길드전' | '공성전'
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailItems, setDetailItems] = useState([]);
  const [detailErr, setDetailErr] = useState("");

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      setErr("");

      const { data, error } = await supabase
        .from("guild_guide_counts")
        .select("guild, summary");

      if (!alive) return;

      if (error) {
        setErr(error.message || "불러오기 실패");
        setRows([]);
      } else {
        setRows(Array.isArray(data) ? data : []);
      }

      setLoading(false);
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  const normalized = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const filtered = !kw
      ? rows
      : rows.filter((r) => (r.guild || "").toLowerCase().includes(kw));

    return filtered
      .map((r) => {
        const s = r.summary || {};
        const gw = num(s["길드전"]);
        const siege = num(s["공성전"]);
        return {
          guild: r.guild || "(이름없음)",
          guildWar: gw,
          siege,
          total: gw + siege,
        };
      })
      .sort((a, b) => b.total - a.total || a.guild.localeCompare(b.guild, "ko"));
  }, [rows, q]);

  const totals = useMemo(() => {
    return normalized.reduce(
      (acc, r) => {
        acc.guildWar += r.guildWar;
        acc.siege += r.siege;
        acc.total += r.total;
        return acc;
      },
      { guildWar: 0, siege: 0, total: 0 }
    );
  }, [normalized]);

  const openDetail = async (guild, kind) => {
    setDetailOpen(true);
    setDetailGuild(guild);
    setDetailKind(kind);
    setDetailItems([]);
    setDetailErr("");
    setDetailLoading(true);

    // ✅ 상세 목록 view: guild_guide_items
    const { data, error } = await supabase
      .from("guild_guide_items")
      .select("guild, kind, source, item_id, title, created_at")
      .eq("guild", guild)
      .eq("kind", kind)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setDetailErr(error.message || "상세 불러오기 실패");
      setDetailItems([]);
    } else {
      setDetailItems(Array.isArray(data) ? data : []);
    }

    setDetailLoading(false);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailGuild("");
    setDetailKind("");
    setDetailItems([]);
    setDetailErr("");
    setDetailLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        {/* 헤더 카드 */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div
            className="h-36 lg:h-44 w-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(16,185,129,0.18), rgba(251,191,36,0.18))",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-5 lg:px-7">
            <div>
              <h1 className="text-[20px] lg:text-[28px] font-black tracking-tight text-slate-900">
                길드별 공략 통계
              </h1>
              <p className="mt-1 text-[12px] lg:text-[14px] font-semibold text-slate-700/70">
                숫자 클릭하면 해당 공략 목록을 볼 수 있음
              </p>
            </div>

            <Link
              to="/"
              className="shrink-0 rounded-2xl bg-white/90 border border-slate-200 px-4 py-2 text-[13px] font-extrabold text-slate-900 hover:bg-white"
            >
              홈 →
            </Link>
          </div>
        </div>

        {/* 요약 */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatBox label="길드전 합계" icon="🛡️" value={totals.guildWar} />
          <StatBox label="공성전 합계" icon="🏰" value={totals.siege} />
          <StatBox label="전체 합계" icon="📊" value={totals.total} />
        </div>

        {/* 검색 + 상태 */}
        <div className="mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="길드 이름 검색"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="text-sm font-semibold text-slate-600">
              {loading ? "불러오는 중..." : `${normalized.length}개`}
            </div>
          </div>
          {err ? (
            <div className="mt-2 text-sm font-semibold text-rose-600">에러: {err}</div>
          ) : null}
        </div>

        {/* 리스트 */}
        <div className="mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-[12px] font-extrabold text-slate-700 flex justify-between">
            <div>길드</div>
            <div className="flex gap-6">
              <div className="w-20 text-right">길드전</div>
              <div className="w-20 text-right">공성전</div>
              <div className="w-20 text-right">합계</div>
            </div>
          </div>

          {loading ? (
            <div className="px-4 py-6 text-sm font-semibold text-slate-600">불러오는 중...</div>
          ) : normalized.length === 0 ? (
            <div className="px-4 py-6 text-sm font-semibold text-slate-600">데이터가 없습니다.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {normalized.map((r) => (
                <div
                  key={r.guild}
                  className="px-4 py-3 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-extrabold text-slate-900">{r.guild}</div>
                    <div className="text-[12px] font-semibold text-slate-600">총 {r.total}개</div>
                  </div>

                  <div className="flex gap-6 text-[13px] font-extrabold text-slate-900">
                    <button
                      onClick={() => openDetail(r.guild, "길드전")}
                      className="w-20 text-right hover:underline"
                      title="클릭해서 목록 보기"
                    >
                      {r.guildWar}
                    </button>
                    <button
                      onClick={() => openDetail(r.guild, "공성전")}
                      className="w-20 text-right hover:underline"
                      title="클릭해서 목록 보기"
                    >
                      {r.siege}
                    </button>
                    <div className="w-20 text-right">{r.total}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 text-[12px] font-semibold text-slate-500">
          * 길드 공략추가 참여율이 저조하면 공유 중지할 예정
        </div>
      </div>

      {/* 상세 모달 */}
      {detailOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDetail}
          />
          <div className="absolute inset-x-0 top-10 mx-auto w-[92%] max-w-3xl">
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-[15px] font-black text-slate-900">
                    {detailGuild} · {detailKind} 목록
                  </div>
                  <div className="text-[12px] font-semibold text-slate-600">
                    {detailLoading ? "불러오는 중..." : `${detailItems.length}개`}
                  </div>
                </div>
                <button
                  onClick={closeDetail}
                  className="rounded-xl px-3 py-2 text-sm font-extrabold bg-slate-900 text-white"
                >
                  닫기
                </button>
              </div>

              {detailErr ? (
                <div className="px-5 py-4 text-sm font-semibold text-rose-600">
                  에러: {detailErr}
                </div>
              ) : detailLoading ? (
                <div className="px-5 py-6 text-sm font-semibold text-slate-600">
                  불러오는 중...
                </div>
              ) : detailItems.length === 0 ? (
                <div className="px-5 py-6 text-sm font-semibold text-slate-600">
                  항목이 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[70vh] overflow-auto">
                  {detailItems.map((it) => (
                    <div key={`${it.source}-${it.item_id}`} className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-indigo-50 text-indigo-700 px-2 py-1 text-[11px] font-extrabold">
                          {sourceLabel(it.source)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {fmtDate(it.created_at)}
                        </span>
                      </div>
                      <div className="mt-1 text-[14px] font-bold text-slate-900">
                        {it.title}
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-slate-500">
                        id: {it.item_id}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, icon, value }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-4 py-3 flex items-center gap-3">
      <div className="text-2xl">{icon}</div>
      <div className="leading-tight">
        <p className="text-[12px] text-slate-500 font-semibold">{label}</p>
        <p className="text-[18px] font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
