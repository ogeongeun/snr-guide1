import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageShell from "../components/PageShell";
import { supabase } from "../lib/supabaseClient";
import { getRaidBossLabel } from "../data/raidBossOptions";

export default function RaidTeamSkillPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [title, setTitle] = useState("");
  const [bossKey, setBossKey] = useState("");
  const [skillOrder, setSkillOrder] = useState({ images: [] });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr("");

      try {
        const { data, error } = await supabase
          .from("raid_team_posts")
          .select("id,boss_key,title,skill_order")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("팀을 찾을 수 없습니다.");

        setBossKey(data.boss_key || "");
        setTitle(data.title || "");
        setSkillOrder(
          data.skill_order && Array.isArray(data.skill_order.images)
            ? data.skill_order
            : { images: [] }
        );
      } catch (e) {
        setErr(e?.message || "불러오기 실패");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id]);

  return (
    <PageShell
      title="레이드 스킬 순서"
      right={
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl px-3 py-2 text-sm font-extrabold bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
        >
          ← 뒤로
        </button>
      }
    >
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="text-[12px] font-extrabold text-slate-500">
            {getRaidBossLabel(bossKey)}
          </div>
          <div className="mt-1 text-[18px] font-black text-slate-900">
            {title || "제목 없음"}
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-[13px] font-black text-slate-900">불러오는 중...</div>
          ) : err ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="text-[12px] font-extrabold text-rose-700">오류</div>
              <div className="mt-1 text-[12px] font-semibold text-rose-700/90">
                {err}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center bg-gray-100 p-4 rounded-xl shadow-sm">
              <div className="w-full">
                <p className="text-lg font-semibold text-blue-600 mb-3 text-center">
                  스킬 순서
                </p>

                <div className="flex flex-wrap justify-center gap-4 mb-4">
                  {(skillOrder?.images || []).map((img, i) => (
                    <div key={i} className="flex flex-col items-center max-w-[80px]">
                      <img
                        src={`/images/skills/${img}`}
                        alt={`Skill ${i + 1}`}
                        title={img}
                        className="w-10 h-10 object-contain border rounded-md"
                      />
                      <span className="text-xs text-gray-600 mt-1">#{i + 1}</span>
                    </div>
                  ))}
                </div>

                {!(skillOrder?.images || []).length ? (
                  <div className="text-[12px] font-semibold text-slate-400">
                    등록된 스킬 순서가 없습니다.
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}