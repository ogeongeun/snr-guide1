// src/pages/GuildManagePage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";

export default function GuildManagePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [guild, setGuild] = useState(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { data: userRes, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;

        const uid = userRes?.user?.id;
        if (!uid) {
          navigate("/login", { replace: true });
          return;
        }

        // ✅ 길마인지 서버에서 다시 확인
        const { data, error } = await supabase
          .from("guilds")
          .select("id, name, leader_user_id")
          .eq("leader_user_id", uid)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          // 길마 아니면 홈으로
          navigate("/", { replace: true });
          return;
        }

        setGuild(data);
      } catch (e) {
        console.error("GuildManagePage error:", e?.message || e);
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="rounded-xl px-3 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
          >
            ← 홈
          </Link>

          <h1 className="text-[20px] font-black text-slate-900">길드관리</h1>
          <div className="flex-1 h-px bg-slate-200 ml-2" />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          {loading ? (
            <div className="text-sm font-semibold text-slate-600">불러오는중...</div>
          ) : (
            <>
              <div className="text-sm font-semibold text-slate-600">내 길드</div>
              <div className="mt-1 text-[18px] font-black text-slate-900">
                {guild?.name || "(길드명 없음)"}
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="text-[13px] font-semibold text-slate-700">
                  (여기부터 길드원 리스트/기능 붙이면 됨)
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
