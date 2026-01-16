import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/PageShell";
import { supabase } from "../../lib/supabaseClient";

const CATEGORIES = ["공략", "질문", "자유", "공지"];

export default function CommunityWritePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [category, setCategory] = useState("공략");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const canSubmit = useMemo(() => {
    return title.trim().length >= 2 && content.trim().length >= 5 && !saving;
  }, [title, content, saving]);

  const submit = async () => {
    if (!canSubmit) return;

    try {
      setSaving(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        alert("로그인이 필요합니다.");
        navigate("/login", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          title: title.trim(),
          content: content.trim(),
          category,
          // pinned은 기본 false (공지 고정은 나중에 길마 기능으로)
        })
        .select("id")
        .single();

      if (error) {
        alert(`등록 실패: ${error.message}`);
        return;
      }

      navigate(`/community/post/${data.id}`, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="글쓰기"
      right={
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="rounded-xl px-4 py-2 text-sm font-extrabold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "등록중..." : "등록"}
        </button>
      }
    >
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
        <label className="text-sm font-extrabold text-slate-900">카테고리</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={[
                "px-3 py-2 rounded-xl text-sm font-extrabold border",
                category === c
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-sm font-extrabold text-slate-900">제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-extrabold text-slate-900">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력"
            rows={10}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-200 resize-none"
          />
          <div className="mt-2 text-xs font-semibold text-slate-500">
            제목 2자 이상, 내용 5자 이상
          </div>
        </div>
      </div>
    </PageShell>
  );
}
