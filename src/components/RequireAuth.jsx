import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";

export default function RequireAuth({ children }) {
  const [status, setStatus] = useState("checking"); 
  // checking | authed | need_profile | unauth | error
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const run = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) {
          setStatus("unauth");
          return;
        }

        // 닉네임 있는지 확인
        const { data, error: pErr } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("user_id", session.user.id)
          .single();

        if (!pErr && data?.nickname) {
          setStatus("authed");
        } else {
          setStatus("need_profile");
        }
      } catch (e) {
        setErr(e?.message || String(e));
        setStatus("error");
      }
    };

    run();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      // 로그인/로그아웃 시 재검사
      setStatus("checking");
      run();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (status === "unauth") {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
    if (status === "need_profile") {
      navigate("/profile-setup", { replace: true });
    }
  }, [status, navigate, location.pathname]);

  if (status === "checking") return <div style={{ padding: 16 }}>세션 확인중...</div>;
  if (status === "error") return <div style={{ padding: 16 }}>에러: {err}</div>;
  if (status !== "authed") return <div style={{ padding: 16 }}>이동중...</div>;

  return children;
}
