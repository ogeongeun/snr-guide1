// src/pages/DefenseSubmitPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function DefenseSubmitPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [guild, setGuild] = useState(null);
  const [myRole, setMyRole] = useState(null); // ✅ FIX: setMyRole 함수 제대로 받기

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErrMsg("");

      try {
        const { data: userRes, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;

        const uid = userRes?.user?.id;
        if (!uid) {
          navigate("/login", { replace: true });
          return;
        }

        // 1) 내 멤버십
        const { data: memRows, error: memErr } = await supabase
          .from("guild_members")
          .select("guild_id, role, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(1);

        if (memErr) throw memErr;

        const mem = (memRows ?? [])[0] ?? null;
        if (!mem?.guild_id) {
          setErrMsg("길드 소속 정보가 없습니다.");
          return;
        }

        setMyRole(mem.role ?? "member");

        // 2) 길드 정보
        const { data: gRows, error: gErr } = await supabase
          .from("guilds")
          .select("id, name, leader_user_id")
          .eq("id", mem.guild_id)
          .limit(1);

        if (gErr) throw gErr;

        const g = (gRows ?? [])[0] ?? null;
        setGuild(g);
      } catch (e) {
        console.error("DefenseSubmitPage error:", e);
        setErrMsg(e?.message ? String(e.message) : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate]);

  const roleLabel =
    myRole === "leader" ? "길드장" : myRole === "member" ? "길드원" : "-";

  const badgeClass =
    myRole === "leader"
      ? "bg-amber-50 text-amber-700 border border-amber-200"
      : "bg-slate-50 text-slate-700 border border-slate-200";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 lg:py-10">
        {/* 상단 바 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="hidden lg:inline-flex rounded-xl px-3 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
          >
            ← 뒤로
          </button>

          <div className="min-w-0">
            <div className="text-[12px] font-extrabold text-slate-500">
              길드관리
            </div>
            <h1 className="text-[18px] lg:text-[20px] font-black text-slate-900">
              방어팀 제출
            </h1>
          </div>

          <div className="flex-1 h-px bg-slate-200 ml-2" />

          {!loading && !errMsg ? (
            <div
              className={`hidden lg:inline-flex shrink-0 rounded-full px-3 py-1 text-[12px] font-extrabold border ${badgeClass}`}
            >
              {roleLabel}
            </div>
          ) : null}
        </div>

        {/* 본문 */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          {loading ? (
            <div className="text-sm font-semibold text-slate-600">
              불러오는중...
            </div>
          ) : errMsg ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-[13px] font-extrabold text-rose-700">
                오류
              </div>
              <div className="mt-1 text-[12px] font-semibold text-rose-700/90 break-all">
                {errMsg}
              </div>
            </div>
          ) : (
            <>
              {/* 길드 정보 */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[12px] font-extrabold text-slate-600">
                      길드
                    </div>
                    <div className="mt-1 text-[16px] font-black text-slate-900">
                      {guild?.name || "(길드명 없음)"}
                    </div>
                  </div>

                  <div
                    className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold border ${badgeClass}`}
                  >
                    {roleLabel}
                  </div>
                </div>

                <div className="mt-2 text-[12px] font-semibold text-slate-600">
                  이 페이지에서 방어 덱 세팅을 제출하도록 만들면 됨.
                </div>
              </div>

              {/* 제출 폼 자리 */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="text-[15px] font-black text-slate-900">
                  제출 폼(추후)
                </div>
                <div className="mt-2 text-[12px] font-semibold text-slate-600">
                  영웅 5명 + 장비/장신구/펫/스킬순서 등을 입력받고 저장하는 UI를
                  여기에 넣으면 됨.
                </div>

                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <div className="text-[12px] font-extrabold text-slate-700">
                    아직 저장 구조가 없어서 폼은 틀만 만들어둠
                  </div>
                  <div className="mt-1 text-[12px] font-semibold text-slate-600">
                    (어떤 DB 테이블에 어떤 컬럼으로 저장할지 정해지면 바로 붙여줌)
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
