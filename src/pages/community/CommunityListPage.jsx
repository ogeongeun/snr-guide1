import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/PageShell";
import { supabase } from "../../lib/supabaseClient";

const CATEGORIES = ["전체", "공지", "공략", "질문", "자유"];

export default function CommunityListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("c") || "전체";

  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [q, setQ] = useState(searchParams.get("q") || "");

  const queryLabel = useMemo(() => {
    if (category === "전체") return "전체 글";
    return `${category} 글`;
  }, [category]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      let query = supabase
        .from("community_posts")
        .select("id, created_at, title, category, pinned, view_count, author_id")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);

      if (category !== "전체") query = query.eq("category", category);
      const keyword = (searchParams.get("q") || "").trim();
      if (keyword) query = query.ilike("title", `%${keyword}%`);

      const { data, error } = await query;
      if (error) {
        console.error(error);
        setPosts([]);
      } else {
        setPosts(data || []);
      }

      setLoading(false);
    };

    run();
  }, [category, searchParams]);

  const onFilter = (next) => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === "전체") nextParams.delete("c");
    else nextParams.set("c", next);
    setSearchParams(nextParams, { replace: true });
  };

  const onSearch = (e) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    const keyword = q.trim();
    if (!keyword) nextParams.delete("q");
    else nextParams.set("q", keyword);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <PageShell
      title="커뮤니티"
      right={
        <Link
          to="/community/write"
          className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800"
        >
          글쓰기
        </Link>
      }
    >
      {/* 상단 검색/필터 */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onFilter(c)}
              className={[
                "px-3 py-2 rounded-xl text-sm font-extrabold border",
                c === category
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {c}
            </button>
          ))}
        </div>

        <form onSubmit={onSearch} className="mt-3 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="제목으로 검색"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="submit"
            className="rounded-xl px-4 py-2 text-sm font-extrabold bg-indigo-600 text-white hover:bg-indigo-500"
          >
            검색
          </button>
        </form>

        <div className="mt-2 text-xs font-semibold text-slate-500">
          {queryLabel} · {loading ? "불러오는중..." : `${posts.length}개`}
        </div>
      </div>

      {/* 리스트 */}
      <div className="mt-4 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm font-semibold text-slate-600">불러오는중...</div>
        ) : posts.length === 0 ? (
          <div className="p-6 text-sm font-semibold text-slate-600">글이 없습니다.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {posts.map((p) => (
              <Link
                key={p.id}
                to={`/community/post/${p.id}`}
                className="block px-4 py-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <Tag category={p.category} pinned={p.pinned} />
                  <div className="text-[14px] font-extrabold text-slate-900 line-clamp-1">
                    {p.title}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{formatTime(p.created_at)}</span>
                  <span>조회 {Number(p.view_count || 0).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* PC에서는 2단으로 보이게(옵션) */}
      <div className="hidden lg:block mt-6 text-xs text-slate-400 font-semibold">
        * 공지/공략/질문/자유 카테고리로 운영
      </div>
    </PageShell>
  );
}

function Tag({ category, pinned }) {
  const base =
    "shrink-0 rounded-md px-2 py-1 text-[11px] font-extrabold border";
if (category === "공지")
  return (
    <span className={`${base} bg-red-50 text-red-600 border-red-200`}>
      공지
    </span>
  );


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
