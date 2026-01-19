import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/PageShell";
import { supabase } from "../../lib/supabaseClient";

export default function CommunityPostPage() {
  const { id } = useParams();
  const postId = Number(id);
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // ✅ 게시글 수정 상태
  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [savingPost, setSavingPost] = useState(false);

  // ✅ 댓글 수정 상태 (commentId -> text)
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [savingCommentId, setSavingCommentId] = useState(null);

  // ✅ 추천(좋아요)
  const [liked, setLiked] = useState(false);
  const [togglingLike, setTogglingLike] = useState(false);

  const isMine = useMemo(() => {
    if (!me || !post) return false;
    return post.author_id === me.id;
  }, [me, post]);

  const canDeletePost = useMemo(() => isMine || isAdmin, [isMine, isAdmin]);
  const canEditPost = useMemo(() => isMine || isAdmin, [isMine, isAdmin]);

  useEffect(() => {
    if (!supabase || !Number.isFinite(postId)) return;

    const run = async () => {
      setLoading(true);

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user ?? null;
      setMe(user);

      // ✅ 관리자 여부
      if (user?.id) {
        const { data: adminRow } = await supabase
          .from("admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        setIsAdmin(!!adminRow);
      } else {
        setIsAdmin(false);
      }

      // 조회수 증가(실패 무시)
      try {
        await supabase.rpc("community_inc_view", { p_post_id: postId });
      } catch {}

      // 게시글 + 작성자 닉/길드 (+ like_count)
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
          like_count,
          author_id,
          profiles!community_posts_author_id_fkey (
            nickname,
            guild
          )
        `
        )
        .eq("id", postId)
        .single();

      if (pe) {
        console.error(pe);
        setPost(null);
        setComments([]);
        setLoading(false);
        return;
      }

      setPost(p);

      // ✅ 내 추천 여부
      if (user?.id) {
        const { data: likeRow, error: le } = await supabase
          .from("community_post_likes")
          .select("post_id")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (le) {
          console.error(le);
          setLiked(false);
        } else {
          setLiked(!!likeRow);
        }
      } else {
        setLiked(false);
      }

      // 댓글 + 작성자 닉/길드
      const { data: c, error: ce } = await supabase
        .from("community_comments")
        .select(
          `
          id,
          created_at,
          content,
          author_id,
          profiles!community_comments_author_id_fkey (
            nickname,
            guild
          )
        `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (ce) {
        console.error(ce);
        setComments([]);
      } else {
        setComments(c || []);
      }

      // 편집 중이었으면 초기화
      setEditingPost(false);
      setEditingCommentId(null);
      setEditCommentText("");

      setLoading(false);
    };

    run();
  }, [postId]);

  const toggleLike = async () => {
    if (togglingLike || !supabase) return;

    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;
    if (!uid) {
      alert("로그인이 필요합니다.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      setTogglingLike(true);

      const { data, error } = await supabase.rpc("community_toggle_like", {
        p_post_id: postId,
      });

      if (error) {
        alert(`추천 처리 실패: ${error.message}`);
        return;
      }

      // data는 [{ liked, like_count }] 형태로 오는 경우가 많음 (RPC 반환 특성)
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return;

      setLiked(!!row.liked);
      setPost((prev) =>
        prev ? { ...prev, like_count: Number(row.like_count || 0) } : prev
      );
    } finally {
      setTogglingLike(false);
    }
  };

  const addComment = async () => {
    const text = commentText.trim();
    if (!text || postingComment || !supabase) return;

    try {
      setPostingComment(true);

      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user?.id) {
        alert("로그인이 필요합니다.");
        navigate("/login", { replace: true });
        return;
      }

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
            nickname,
            guild
          )
        `
        )
        .single();

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

  // ✅ 게시글 편집 시작/취소/저장
  const startEditPost = () => {
    if (!post) return;
    setEditingPost(true);
    setEditTitle(post.title ?? "");
    setEditContent(post.content ?? "");
  };

  const cancelEditPost = () => {
    setEditingPost(false);
    setEditTitle("");
    setEditContent("");
  };

  const savePost = async () => {
    if (!post || savingPost) return;

    const nextTitle = editTitle.trim();
    const nextContent = editContent.trim();

    if (nextTitle.length === 0) return alert("제목을 입력해줘");
    if (nextContent.length === 0) return alert("내용을 입력해줘");

    try {
      setSavingPost(true);

      const { data, error } = await supabase
        .from("community_posts")
        .update({ title: nextTitle, content: nextContent })
        .eq("id", postId)
        .select(
          `
          id,
          title,
          content,
          category,
          pinned,
          created_at,
          view_count,
          like_count,
          author_id,
          profiles!community_posts_author_id_fkey (
            nickname,
            guild
          )
        `
        )
        .single();

      if (error) {
        alert(`수정 실패: ${error.message}`);
        return;
      }

      setPost(data);
      setEditingPost(false);
    } finally {
      setSavingPost(false);
    }
  };

  const deletePost = async () => {
    if (!post || !supabase) return;
    if (!window.confirm("정말 삭제할까?")) return;

    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }
    navigate("/community", { replace: true });
  };

  // ✅ 댓글 편집 시작/취소/저장
  const startEditComment = (c) => {
    setEditingCommentId(c.id);
    setEditCommentText(c.content ?? "");
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentText("");
  };

  const saveComment = async (commentId) => {
    if (savingCommentId) return;
    const next = editCommentText.trim();
    if (!next) return alert("댓글 내용을 입력해줘");

    try {
      setSavingCommentId(commentId);

      const { data, error } = await supabase
        .from("community_comments")
        .update({ content: next })
        .eq("id", commentId)
        .select(
          `
          id,
          created_at,
          content,
          author_id,
          profiles!community_comments_author_id_fkey (
            nickname,
            guild
          )
        `
        )
        .single();

      if (error) {
        alert(`댓글 수정 실패: ${error.message}`);
        return;
      }

      setComments((prev) => prev.map((x) => (x.id === commentId ? data : x)));
      setEditingCommentId(null);
      setEditCommentText("");
    } finally {
      setSavingCommentId(null);
    }
  };

  const deleteComment = async (commentId) => {
    if (!supabase) return;
    if (!window.confirm("댓글 삭제할까?")) return;

    const { error } = await supabase
      .from("community_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }

    // 편집중이던 댓글이 삭제되면 편집 종료
    if (editingCommentId === commentId) cancelEditComment();

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

                {!editingPost ? (
                  <div className="text-[16px] font-black text-slate-900 truncate">
                    {post.title}
                  </div>
                ) : (
                  <div className="min-w-0 flex-1">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold outline-none focus:ring-2 focus:ring-slate-200"
                      placeholder="제목"
                    />
                  </div>
                )}

                {isAdmin && (
                  <span className="shrink-0 ml-2 rounded-md px-2 py-1 text-[11px] font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-200">
                    관리자
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!editingPost ? (
                  <>
                    {canEditPost && (
                      <button
                        type="button"
                        onClick={startEditPost}
                        className="rounded-xl px-3 py-2 text-xs font-extrabold bg-slate-200 text-slate-900 hover:bg-slate-300"
                      >
                        수정
                      </button>
                    )}
                    {canDeletePost && (
                      <button
                        type="button"
                        onClick={deletePost}
                        className="rounded-xl px-3 py-2 text-xs font-extrabold bg-rose-600 text-white hover:bg-rose-500"
                      >
                        삭제
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={savePost}
                      disabled={savingPost}
                      className="rounded-xl px-3 py-2 text-xs font-extrabold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingPost ? "저장중..." : "저장"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditPost}
                      disabled={savingPost}
                      className="rounded-xl px-3 py-2 text-xs font-extrabold bg-slate-200 text-slate-900 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      취소
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 작성자/시간/조회수 */}
            <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                {formatDisplayName(post.profiles)} · {formatTime(post.created_at)}
              </span>
              <span>조회 {Number(post.view_count || 0).toLocaleString()}</span>
            </div>

            {!editingPost ? (
              <>
                <div className="mt-4 whitespace-pre-wrap text-sm font-semibold text-slate-800 leading-relaxed">
                  {post.content}
                </div>

                {/* ✅ 추천 버튼: 게시글 내용 밑 / 아이콘 색만 변경 */}
                <div className="mt-4 flex items-center justify-left">
                  <button
                    type="button"
                    onClick={toggleLike}
                    disabled={togglingLike}
                    className={[
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold",
                      "border border-slate-200 bg-white transition select-none",
                      "hover:bg-slate-50",
                      togglingLike ? "opacity-50 cursor-not-allowed" : "",
                    ].join(" ")}
                    aria-pressed={liked}
                    title="추천"
                  >
                    <ThumbIcon filled={liked} />
                    <span className="text-slate-800">추천</span>
                    <span className="text-slate-500">
                      {Number(post.like_count || 0).toLocaleString()}
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200 resize-none"
                  placeholder="내용"
                />
              </div>
            )}
          </div>

          {/* 댓글 */}
          <div className="mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 text-sm font-black text-slate-900">
              댓글 {comments.length.toLocaleString()}개
            </div>

            <div className="divide-y divide-slate-100">
              {comments.map((c) => {
                const mine = me?.id && c.author_id === me.id;
                const canDelete = mine || isAdmin;
                const canEdit = mine || isAdmin;
                const isEditing = editingCommentId === c.id;

                return (
                  <div key={c.id} className="px-4 py-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>
                        {formatDisplayName(c.profiles)} · {formatTime(c.created_at)}
                      </span>

                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => startEditComment(c)}
                                className="font-extrabold text-slate-700 hover:underline"
                              >
                                수정
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => deleteComment(c.id)}
                                className="font-extrabold text-rose-600 hover:underline"
                              >
                                삭제
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => saveComment(c.id)}
                              disabled={savingCommentId === c.id}
                              className="font-extrabold text-indigo-600 hover:underline disabled:opacity-50"
                            >
                              {savingCommentId === c.id ? "저장중..." : "저장"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditComment}
                              disabled={savingCommentId === c.id}
                              className="font-extrabold text-slate-600 hover:underline disabled:opacity-50"
                            >
                              취소
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {!isEditing ? (
                      <div className="mt-2 text-sm font-semibold text-slate-800 whitespace-pre-wrap">
                        {c.content}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <textarea
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200 resize-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {comments.length === 0 && (
                <div className="px-4 py-6 text-sm font-semibold text-slate-600">
                  첫 댓글을 남겨봐.
                </div>
              )}
            </div>

            {/* 댓글 작성 */}
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
  if (pinned)
    return (
      <span className={`${base} bg-rose-50 text-rose-600 border-rose-200`}>
        공지
      </span>
    );
  if (category === "공략")
    return (
      <span className={`${base} bg-blue-50 text-blue-600 border-blue-200`}>
        공략
      </span>
    );
  if (category === "질문")
    return (
      <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>
        질문
      </span>
    );
  if (category === "자유")
    return (
      <span className={`${base} bg-slate-50 text-slate-700 border-slate-200`}>
        자유
      </span>
    );
  return (
    <span className={`${base} bg-slate-50 text-slate-700 border-slate-200`}>
      {category}
    </span>
  );
}

function formatDisplayName(profile) {
  const nick = profile?.nickname?.trim();
  const guild = profile?.guild?.trim();
  if (nick && guild) return `${nick}(${guild})`;
  if (nick) return nick;
  return "익명";
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

/**
 * ✅ 따봉 아이콘: 아이콘 색만 변경
 * - filled=false: outline + 회색
 * - filled=true : solid + 인디고
 */
function ThumbIcon({ filled }) {
  const common = "w-[18px] h-[18px]";
  const colorClass = filled ? "text-indigo-600" : "text-slate-400";

  if (filled) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`${common} ${colorClass}`}
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M2 10.5C2 9.67 2.67 9 3.5 9H8V20H3.5C2.67 20 2 19.33 2 18.5V10.5ZM9 9H14.25C14.66 9 15 8.66 15 8.25V6.5C15 5.12 13.88 4 12.5 4H12.1C11.66 4 11.27 4.29 11.14 4.71L9.34 10.16C9.12 10.83 9 11.54 9 12.25V9ZM9 12.25V20H17.2C18.12 20 18.92 19.37 19.14 18.47L20.64 12.47C20.85 11.64 20.22 10.85 19.36 10.85H15.4C14.74 10.85 14.24 10.25 14.37 9.6L14.83 7.26C15 6.4 14.34 5.6 13.46 5.6H12.5C12.02 5.6 11.6 5.9 11.44 6.36L9.86 10.95C9.3 12.58 9 14.3 9 16.03V12.25Z"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={`${common} ${colorClass}`}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M2 10.5C2 9.67 2.67 9 3.5 9H8V20H3.5C2.67 20 2 19.33 2 18.5V10.5ZM6.5 18.5H8V10.5H6.5V18.5ZM9 9H14.25C15.22 9 16 8.22 16 7.25V6.5C16 4.57 14.43 3 12.5 3H12.1C11.22 3 10.44 3.57 10.18 4.41L8.38 9.86C8.13 10.61 8 11.42 8 12.25V20H17.2C18.58 20 19.78 19.06 20.12 17.72L21.62 11.72C21.94 10.43 20.96 9.2 19.63 9.2H15.4L15.81 7.16C16.07 5.86 15.07 4.6 13.74 4.6H12.5C11.57 4.6 10.74 5.18 10.42 6.05L9 10.26V9ZM10 12.25c0-.72.12-1.43.34-2.09L11.37 7.1c.06-.18.23-.3.42-.3h1.95c.23 0 .4.21.35.44l-.46 2.34c-.26 1.32.76 2.52 2.1 2.52h4.23l-1.5 6c-.11.45-.52.77-.99.77H10v-7.62Z"
      />
    </svg>
  );
}
