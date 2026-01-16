import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ProfileSetupPage() {
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [session, setSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      // 로그인 세션 확인
      const { data: sessionRes } = await supabase.auth.getSession();
      const sess = sessionRes?.session;

      if (!sess) {
        navigate("/login", { replace: true });
        return;
      }

      setSession(sess);

      // 기존 닉네임 조회
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", sess.user.id)
        .single();

      // 이미 닉네임이 있으면 바로 홈으로
      if (!error && data?.nickname && data.nickname !== "익명") {
        navigate("/", { replace: true });
        return;
      }

      // 기존 값이 있으면 input에 채워줌
      if (!error && data?.nickname) {
        setNickname(data.nickname);
      }

      setLoading(false);
    };

    run();
  }, [navigate]);

  const save = async () => {
    if (!nickname.trim()) {
      alert("닉네임 입력해줘");
      return;
    }
    if (!session?.user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      setSaving(true);

      // ✅ 핵심: insert ❌ → upsert ⭕
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: session.user.id,
            nickname: nickname.trim(),
          },
          { onConflict: "user_id" }
        );

      if (error) {
        alert(error.message);
        return;
      }

      navigate("/", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 16 }}>로딩중...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md">
        <h1 className="text-xl font-bold text-center mb-4">닉네임 설정</h1>

        <input
          className="w-full border rounded-xl px-3 py-2 mb-3 text-sm"
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <button
          className="w-full bg-gray-800 text-white rounded-xl py-2 font-bold disabled:opacity-50"
          onClick={save}
          disabled={saving}
        >
          {saving ? "저장중..." : "저장하고 시작하기"}
        </button>
      </div>
    </div>
  );
}
