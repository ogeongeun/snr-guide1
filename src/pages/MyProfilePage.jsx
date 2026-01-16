import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageShell from "../../components/PageShell";
import { supabase } from "../../lib/supabaseClient";

export default function MyProfilePage() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);

  const [nickname, setNickname] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  const [myPosts, setMyPosts] = useState([]);
  const [myComments, setMyComments] = useState([]);

  // (미래용) 방어팀 제출 폼 - UI만
  const [defenseTitle, setDefenseTitle] = useState("");
  const [defensePayload, setDefensePayload] = useState("");

  const canSaveNickname = useMemo(() => {
    const v = nicknameInput.trim();
    return v.length >= 2 && v.length <= 12 && v !== nickname;
  }, [nicknameInput, nickname]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setProfileLoading(true);
      setListLoading(true);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user ?? null;

      if (!user?.id) {
        navigate("/login", { replace: true });
        return;
      }
      setMe(user);

      // 1) 내 프로필(닉네임)
      const { data: prof, error: pe } = await supabase
        .from("profiles")
        .select("user_id,nickname,created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      // profiles row가 없으면(드물게) 기본값으로 만들어둠
      if (pe) console.error(pe);

      const currentNick = prof?.nickname ?? "익명";
      setNickname(currentNick);
      setNicknameInput(currentNick);
      setProfileLoading(false);

      // 2) 내가 쓴 글
      const { data: posts, error: postErr } = await supabase
        .from("community_posts")
        .select(
          `
          id,
          title,
          category,
          pinned,
          created_at,
          view_count,
          author_id,
          profiles!community_posts_author_id_fkey (
            nickname
          )
        `
        )
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (postErr) {
        console.error(postErr);
        setMyPosts([]);
      } else {
        setMyPosts(posts || []);
      }

      // 3) 내가 쓴 댓글 (post_id 같이 가져오고, 글 제목은 별도 조회 없이 링크만)
      const { data: comments, error: cErr } = await supabase
        .from("community_comments")
        .select(
          `
          id,
          post_id,
          content,
          created_at,
          author_id,
          profiles!community_comments_author_id_fkey (
            nickname
          )
        `
        )
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(80);

      if (cErr) {
        console.error(cErr);
        setMyComments([]);
      } else {
        setMyComments(comments || []);
      }

      setListLoading(false);
      setLoading(false);
    };

    run();
  }, [navigate]);

  const saveNickname = async () => {
    if (!me?.id) return;
    if (!canSaveNickname || savingNickname) return;

    try {
      setSavingNickname(true);
      const nextNick = nicknameInput.trim();

      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: me.id, nickname: nextNick }, { onConflict: "user_id" });

      if (error) {
        alert(error.message);
        return;
      }

      setNickname(nextNick);
      alert("닉네임 저장 완료");
    } finally {
      setSavingNickname(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <PageShell
      title="내 프로필"
      right={
        <div className="flex items-center gap-2">
          <Link
            to="/community"
            className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
          >
            커뮤니티
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-200 text-slate-900 hover:bg-slate-300"
          >
            로그아웃
          </button>
        </div>
      }
    >
      {loading ? (
        <Card>불러오는중...</Card>
      ) : (
        <div className="grid gap-4">
          {/* 닉네임 */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-slate-900">닉네임</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">
                  커뮤니티에 표시되는 이름
                </div>
              </div>
              {profileLoading ? (
                <span className="text-xs font-semibold text-slate-500">로딩...</span>
              ) : (
                <span className="text-xs font-extrabold text-slate-700">
                  현재: {nickname || "익명"}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="2~12자"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200"
              />
              <button
                type="button"
                onClick={saveNickname}
                disabled={!canSaveNickname || savingNickname}
                className="shrink-0 rounded-xl px-4 py-2 text-sm font-extrabold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingNickname ? "저장중..." : "저장"}
              </button>
            </div>
          </div>

          {/* 내가 쓴 글 */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-sm font-black text-slate-900">
              내가 쓴 글 <span className="text-slate-500">({myPosts.length})</span>
            </div>

            {listLoading ? (
              <div className="px-4 py-6 text-sm font-semibold text-slate-600">불러오는중...</div>
            ) : myPosts.length === 0 ? (
              <div className="px-4 py-6 text-sm font-semibold text-slate-600">작성한 글이 없습니다.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myPosts.map((p) => (
                  <Link
                    key={p.id}
                    to={`/community/posts/${p.id}`}
                    className="block px-4 py-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag category={p.category} pinned={p.pinned} />
                      <div className="text-sm font-extrabold text-slate-900 truncate">{p.title}</div>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500 flex items-center justify-between">
                      <span>{formatTime(p.created_at)}</span>
                      <span>조회 {Number(p.view_count || 0).toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 내가 쓴 댓글 */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-sm font-black text-slate-900">
              내가 쓴 댓글 <span className="text-slate-500">({myComments.length})</span>
            </div>

            {listLoading ? (
              <div className="px-4 py-6 text-sm font-semibold text-slate-600">불러오는중...</div>
            ) : myComments.length === 0 ? (
              <div className="px-4 py-6 text-sm font-semibold text-slate-600">작성한 댓글이 없습니다.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myComments.map((c) => (
                  <div key={c.id} className="px-4 py-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>{formatTime(c.created_at)}</span>
                      <Link to={`/community/posts/${c.post_id}`} className="font-extrabold text-indigo-600 hover:underline">
                        원문 이동
                      </Link>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-800 whitespace-pre-wrap">
                      {c.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* (미래용) 방어팀 제출 */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="text-sm font-black text-slate-900">방어팀 제출 (준비중)</div>
            <div className="mt-1 text-xs font-semibold text-slate-500">
              나중에 여기서 방어팀 세팅을 제출할 수 있게 만들 예정 (지금은 UI만)
            </div>

            <div className="mt-3 grid gap-2">
              <input
                value={defenseTitle}
                onChange={(e) => setDefenseTitle(e.target.value)}
                placeholder="제목(예: 겔리두스 방덱 1)"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200"
              />

              <textarea
                value={defensePayload}
                onChange={(e) => setDefensePayload(e.target.value)}
                rows={4}
                placeholder="제출 데이터(JSON) 자리 (예: 영웅/장비/스킬순서 등) - 아직 저장 안 함"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200 resize-none"
              />

              <button
                type="button"
                disabled
                className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-300 text-slate-700 cursor-not-allowed"
                title="준비중"
              >
                제출(준비중)
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function Card({ children }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 text-sm font-semibold text-slate-600">
      {children}
    </div>
  );
}

function Tag({ category, pinned }) {
  const base = "shrink-0 rounded-md px-2 py-1 text-[11px] font-extrabold border";
  if (pinned) return <span className={`${base} bg-rose-50 text-rose-600 border-rose-200`}>공지</span>;
  if (category === "공략") return <span className={`${base} bg-blue-50 text-blue-600 border-blue-200`}>공략</span>;
  if (category === "질문") return <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>질문</span>;
  if (category === "자유") return <span className={`${base} bg-slate-50 text-slate-700 border-slate-200`}>자유</span>;
  return <span className={`${base} bg-slate-50 text-slate-700 border-slate-200`}>{category}</span>;
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return "";
  }
}
