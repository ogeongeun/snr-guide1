import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/PageShell";
import { supabase } from "../../lib/supabaseClient";

export default function CommunityPostPage() {
  const { id } = useParams();
  const postId = Number(id);
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const isMine = useMemo(() => {
    if (!me || !post) return false;
    return post.author_id === me.id;
  }, [me, post]);

  useEffect(() => {
    if (!supabase || !Number.isFinite(postId)) return;

    const run = async () => {
      setLoading(true);

      const { data: user } = await supabase.auth.getUser();
      setMe(user?.user ?? null);

      // 조회수 증가 (실패해도 무시)
      try {
        await supabase.rpc("community_inc_view", { p_post_id: postId });
      } catch {}

      // ✅ 게시글 + 작성자 닉네임 (FK 강제 조인)
      const { data: p, error: pe } = await supabase
        .from("community_posts")
        .select(
          `
          id,
          title,
          content,
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
        .eq("id", postId)
        .single();

      // ✅ 디버깅: 실제로 profiles가 내려오는지 확인
      console.log("POST RAW:", p);
      console.log("POST NICK:", p?.profiles?.nickname);

      if (pe) {
        console.error(pe);
        setPost(null);
        setComments([]);
        setLoading(false);
        return;
      }

      setPost(p);

      // ✅ 댓글 + 작성자 닉네임 (FK 강제 조인)
      const { data: c, error: ce } = await supabase
        .from("community_comments")
        .select(
          `
          id,
          created_at,
          content,
          author_id,
          profiles!community_comments_author_id_fkey (
            nickname
          )
        `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      // ✅ 디버깅: 댓글에서도 profiles가 내려오는지 확인
      console.log("COMMENTS RAW:", c);

      if (ce) {
        console.error(ce);
        setComments([]);
      } else {
        setComments(c || []);
      }

      setLoading(false);
    };

    run();
  }, [postId]);

  const addComment = async () => {
    const text = commentText.trim();
    if (!text || postingComment || !supabase) return;

    try {
      setPostingComment(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        alert("로그인이 필요합니다.");
        navigate("/login", { replace: true });
        return;
      }

      // ✅ 댓글 등록 + 작성자 닉네임 (FK 강제 조인)
      const { data, error } = await supabase
        .from("community_comments")
        .insert({ post_id: postId, content: text })
        .select(
          `
          id,
          created_at,
          content,
          author_id,
          profiles!community_comments_author_id_fkey (
            nickname
          )
        `
        )
        .single();

      // ✅ 디버깅
      console.log("COMMENT INSERT RAW:", data);

      if (error) {
        alert(`댓글 등록 실패: ${error.message}`);
        return;
      }

      setComments((prev) => [...prev, data]);
      setCommentText("");
    } finally {
      setPostingComment(false);
    }
  };

  const deletePost = async () => {
    if (!post || !supabase) return;
    if (!window.confirm("정말 삭제할까?")) return;

    const { error } = await supabase.from("community_posts").delete().eq("id", postId);
    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }
    navigate("/community", { replace: true });
  };

  const deleteComment = async (commentId) => {
    if (!supabase) return;
    if (!window.confirm("댓글 삭제할까?")) return;

    const { error } = await supabase.from("community_comments").delete().eq("id", commentId);
    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }
    setComments((prev) => prev.filter((x) => x.id !== commentId));
  };

  return (
    <PageShell
      title="게시글"
      right={
        <Link
          to="/community"
          className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
        >
          목록
        </Link>
      }
    >
      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 text-sm font-semibold text-slate-600">
          불러오는중...
        </div>
      ) : !post ? (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 text-sm font-semibold text-slate-600">
          게시글이 없습니다.
        </div>
      ) : (
        <>
          {/* 게시글 */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Tag category={post.category} pinned={post.pinned} />
                <div className="text-[16px] font-black text-slate-900 truncate">{post.title}</div>
              </div>

              {isMine && (
                <button
                  type="button"
                  onClick={deletePost}
                  className="rounded-xl px-3 py-2 text-xs font-extrabold bg-rose-600 text-white hover:bg-rose-500"
                >
                  삭제
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                {post.profiles?.nickname ?? "익명"} · {formatTime(post.created_at)}
              </span>
              <span>조회 {Number(post.view_count || 0).toLocaleString()}</span>
            </div>

            <div className="mt-4 whitespace-pre-wrap text-sm font-semibold text-slate-800 leading-relaxed">
              {post.content}
            </div>
          </div>

          {/* 댓글 */}
          <div className="mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-sm font-black text-slate-900">
              댓글 {comments.length.toLocaleString()}개
            </div>

            <div className="divide-y divide-slate-100">
              {comments.map((c) => {
                const mine = me?.id && c.author_id === me.id;
                return (
                  <div key={c.id} className="px-4 py-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>
                        {c.profiles?.nickname ?? "익명"} · {formatTime(c.created_at)}
                      </span>
                      {mine && (
                        <button
                          type="button"
                          onClick={() => deleteComment(c.id)}
                          className="font-extrabold text-rose-600 hover:underline"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-800 whitespace-pre-wrap">
                      {c.content}
                    </div>
                  </div>
                );
              })}

              {comments.length === 0 && (
                <div className="px-4 py-6 text-sm font-semibold text-slate-600">첫 댓글을 남겨봐.</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder="댓글 입력"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200 resize-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={addComment}
                  disabled={postingComment || commentText.trim().length === 0}
                  className="rounded-xl px-4 py-2 text-sm font-extrabold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {postingComment ? "등록중..." : "댓글 등록"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PageShell>
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
