import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginBox() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password: pw });
    if (error) return alert(error.message);
    alert("회원가입 완료");
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) return alert(error.message);
    // 성공하면 LoginPage에서 자동으로 이동됨
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
