import { useEffect,  useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageShell from "../components/PageShell";
import { supabase } from "../lib/supabaseClient";
import { getRaidBossLabel } from "../data/raidBossOptions";

const heroImg = (src) =>
  src?.startsWith("/images/") ? src : `/images/heroes/${src || ""}`;

function SkillStrip({ skills, size = "w-9 h-9" }) {
  if (!Array.isArray(skills) || skills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((img, i) => (
        <img
          key={`${img}-${i}`}
          src={`/images/skills/${img}`}
          alt={`Skill ${i + 1}`}
          className={`${size} border border-slate-200 rounded-lg bg-white shadow-sm`}
          loading="lazy"
        />
      ))}
    </div>
  );
}

function flattenSkillImages(skillOrder) {
  if (!skillOrder || typeof skillOrder !== "object") return [];
  const stages = Array.isArray(skillOrder.skills) ? skillOrder.skills : [];
  return stages.flatMap((stage) =>
    Array.isArray(stage?.images) ? stage.images : []
  );
}

function RaidBossPanel({ bossKey }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const run = async () => {
      if (!bossKey) {
        setTeams([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr("");

      try {
        const { data: posts, error: postErr } = await supabase
          .from("raid_team_posts")
          .select("id,boss_key,title,note,tags,skill_order,created_by,anonymous,created_at")
          .eq("boss_key", bossKey)
          .order("created_at", { ascending: false });

        if (postErr) throw postErr;

        const ids = (posts || []).map((p) => p.id);

        if (ids.length === 0) {
          setTeams([]);
          setLoading(false);
          return;
        }

        const { data: members, error: memErr } = await supabase
          .from("raid_team_members")
          .select("post_id,slot,hero_key,hero_name,hero_image,build")
          .in("post_id", ids);

        if (memErr) throw memErr;

        const memberMap = new Map();

        (members || []).forEach((m) => {
          if (!memberMap.has(m.post_id)) memberMap.set(m.post_id, []);
          memberMap.get(m.post_id).push(m);
        });

        const normalized = (posts || []).map((post) => {
          const list = (memberMap.get(post.id) || [])
            .slice()
            .sort((a, b) => (a.slot || 0) - (b.slot || 0));

          return {
            ...post,
            members: [1, 2, 3, 4, 5].map((slot) => {
              const found = list.find((x) => x.slot === slot);
              return {
                hero_key: found?.hero_key || "",
                hero_name: found?.hero_name || "",
                hero_image: found?.hero_image || "",
                build: found?.build || {},
              };
            }),
          };
        });

        setTeams(normalized);
      } catch (e) {
        setErr(e?.message || "불러오기 실패");
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [bossKey]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="text-[13px] font-black text-slate-900">불러오는 중...</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <div className="text-[13px] font-black text-rose-700">오류</div>
        <div className="mt-1 text-[12px] font-semibold text-rose-700/90">
          {err}
        </div>
      </div>
    );
  }

  if (!teams.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[12px] font-extrabold text-slate-500">보스</div>
            <div className="mt-1 text-[18px] font-black text-slate-900">
              {getRaidBossLabel(bossKey)}
            </div>
          </div>

          <button
            onClick={() => navigate(`/raid/new?boss=${encodeURIComponent(bossKey)}`)}
            className="rounded-2xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
          >
            팀 추가
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="text-[13px] font-black text-slate-900">등록된 팀이 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[12px] font-extrabold text-slate-500">보스</div>
          <div className="mt-1 text-[18px] font-black text-slate-900">
            {getRaidBossLabel(bossKey)}
          </div>
        </div>

        <button
          onClick={() => navigate(`/raid/new?boss=${encodeURIComponent(bossKey)}`)}
          className="rounded-2xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
        >
          팀 추가
        </button>
      </div>

      {teams.map((team) => {
        const skillImages = flattenSkillImages(team.skill_order);

        return (
          <div
            key={team.id}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[15px] font-black text-slate-900">
                    {team.title || "제목 없음"}
                  </div>
                  {team.note ? (
                    <div className="mt-1 text-[12px] font-semibold text-slate-600">
                      {team.note}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/raid/team/${team.id}/skills`}
                    className="rounded-xl px-3 py-2 text-xs font-extrabold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    스킬 보기
                  </Link>
                  <Link
                    to={`/raid/edit/${team.id}`}
                    className="rounded-xl px-3 py-2 text-xs font-extrabold bg-slate-900 text-white hover:bg-slate-800"
                  >
                    수정
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {team.members.map((hero, idx) => (
                  <div
                    key={`${team.id}-${idx}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="w-full aspect-square rounded-2xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                      {hero.hero_image ? (
                        <img
                          src={heroImg(hero.hero_image)}
                          alt={hero.hero_name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-[11px] font-extrabold text-slate-400">
                          없음
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-[12px] font-black text-slate-900 text-center truncate">
                      {hero.hero_name || "-"}
                    </div>

                    {hero.build?.note ? (
                      <div className="mt-1 text-[11px] font-semibold text-rose-600 text-center leading-tight">
                        {hero.build.note}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {skillImages.length > 0 ? (
                <div className="mt-4">
                  <div className="text-[12px] font-extrabold text-slate-500 mb-2">
                    스킬 순서 미리보기
                  </div>
                  <SkillStrip skills={skillImages} size="w-8 h-8" />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RaidBossPage({ bossKey: propBossKey, embedded = false }) {
  const { bossKey: paramBossKey } = useParams();
  const bossKey = propBossKey || decodeURIComponent(paramBossKey || "");

  if (embedded) {
    return <RaidBossPanel bossKey={bossKey} />;
  }

  return (
    <PageShell
      title="레이드 팀 목록"
      right={<div className="text-xs text-slate-500">{getRaidBossLabel(bossKey)}</div>}
    >
      <RaidBossPanel bossKey={bossKey} />
    </PageShell>
  );
}