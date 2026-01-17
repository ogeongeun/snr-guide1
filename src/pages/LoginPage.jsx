// src/pages/LoginPage.jsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import LoginBox from "../components/LoginBox";
import { useLocation, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [session, setSession] = useState(undefined);
  const [checkingProfile, setCheckingProfile] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // ✅ 로그인 돼 있으면: profiles 확인 후 분기
  useEffect(() => {
    if (session === undefined) return;
    if (!session) return;
    if (checkingProfile) return;

    const run = async () => {
      try {
        setCheckingProfile(true);

        const uid = session?.user?.id;
        if (!uid) {
          navigate("/login", { replace: true });
          return;
        }

        // profiles에 닉네임 있는지 확인
        const { data: prof, error } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("user_id", uid)
          .maybeSingle();

        // ✅ 프로필 없거나 nickname 없으면 닉네임 설정으로
        if (error || !prof?.nickname) {
          navigate("/profile-setup", { replace: true });
          return;
        }

        // ✅ 있으면 원래 가려던 곳
        navigate(from, { replace: true });
      } finally {
        setCheckingProfile(false);
      }
    };

    run();
  }, [session, navigate, from, checkingProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-xl shadow w-full max-w-md">
        <h1 className="text-xl font-bold text-center mb-2">로그인 / 회원가입</h1>

        {/* ✅ 핵심 안내 문구 */}
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900 leading-relaxed">
          <p className="font-bold mb-1">📌 회원가입 안내</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <b>아이디는 반드시 이메일 형식</b>이어야 합니다.
            </li>
            <li>
              <b>실제 사용 중인 이메일이 아니어도 됩니다.</b>
            </li>
            <li>
              처음이시라면 사용하고 싶은 이메일 형식 아이디와 비밀번호를 입력한 뒤
              <b> 「회원가입」 버튼</b>을 눌러주세요.
            </li>
            <li>인게임닉네임과 사이트사용 닉네임이 다른경우 임의로 계정이 삭제될수있습니다.</li>
          </ul>
          <p className="mt-2 text-xs text-blue-700">예시: test123@gmail.com / abc12345</p>
        </div>

        {/* 기존 로그인 박스 */}
        <LoginBox />
      </div>
    </div>
  );
}
