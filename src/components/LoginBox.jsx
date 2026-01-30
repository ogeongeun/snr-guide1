import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

// ✅ Supabase 에러 → 한글 변환
function getKoreanAuthError(error) {
  if (!error) return "알 수 없는 오류가 발생했습니다.";

  const msg = String(error.message || "").toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (msg.includes("user already registered")) {
    return "이미 가입된 이메일입니다.";
  }
  if (msg.includes("password should be at least")) {
    return "비밀번호는 최소 6자 이상이어야 합니다.";
  }
  if (msg.includes("invalid email")) {
    return "이메일 형식이 올바르지 않습니다.";
  }
  if (msg.includes("email not confirmed")) {
    return "이메일 인증이 완료되지 않았습니다.";
  }
  if (msg.includes("rate limit")) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  }

  return "로그인/회원가입 중 오류가 발생했습니다.";
}

export default function LoginBox() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const signUp = async () => {
    const { error , data} = await supabase.auth.signUp({
      email,
      password: pw,
    });

     console.log("signUp data:", data);
  console.log("signUp error:", error); // ✅ 핵심

    if (error) {
      alert(getKoreanAuthError(error)); // ✅ 한글
      return;
    }

    alert("회원가입이 완료되었습니다.");
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });

    if (error) {
      alert(getKoreanAuthError(error)); // ✅ 한글
      return;
    }
    // 성공 시 LoginPage에서 자동 이동
  };

  return (
    <div>
      <input
        className="w-full border rounded p-2 mb-2"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full border rounded p-2 mb-3"
        type="password"
        placeholder="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="flex-1 bg-gray-800 text-white rounded p-2" onClick={signIn}>
          로그인
        </button>
        <button className="flex-1 bg-gray-200 rounded p-2" onClick={signUp}>
          회원가입
        </button>
      </div>
    </div>
  );
}
