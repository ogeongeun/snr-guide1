import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function ProfileSetupPage() {
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      setSession(session);

      const { data, error } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", session.user.id)
        .single();

      // 프로필이 이미 있으면 홈으로
      if (!error && data?.nickname) {
        navigate("/", { replace: true });
        return;
      }

      setLoading(false);
    };

    run();
  }, [navigate]);

  const save = async () => {
    if (!nickname.trim()) return alert("닉네임 입력해줘");
    const { error } = await supabase.from("profiles").insert({
      user_id: session.user.id,
      nickname: nickname.trim(),
    });
    if (error) return alert(error.message);
    navigate("/", { replace: true });
  };

  if (loading) return <div style={{ padding: 16 }}>로딩중...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md">
        <h1 className="text-xl font-bold text-center mb-4">닉네임 설정</h1>
        <input
          className="w-full border rounded p-2 mb-3"
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <button className="w-full bg-gray-800 text-white rounded p-2" onClick={save}>
          저장하고 시작하기
        </button>
      </div>
    </div>
  );
}
