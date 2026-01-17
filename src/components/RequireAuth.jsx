import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session) {
          if (!mounted) return;
          setStatus("unauth");
          return;
        }

        const { data: prof, error: pErr } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("user_id", session.user.id)
          .maybeSingle(); // ✅ single 금지

        if (pErr) {
          if (!mounted) return;
          setStatus("need_profile");
          return;
        }

        const nick = (prof?.nickname ?? "").trim();

        // ✅ 핵심: 공백/익명은 "없음"으로 처리
        if (!nick || nick === "익명") {
          if (!mounted) return;
          setStatus("need_profile");
          return;
        }

        if (!mounted) return;
        setStatus("authed");
      } catch (e) {
        if (!mounted) return;
        setErr(e?.message || String(e));
        setStatus("error");
      }
    };

    run();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (!mounted) return;
      setStatus("checking");
      run();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (status === "checking") return <div style={{ padding: 16 }}>세션 확인중...</div>;
  if (status === "error") return <div style={{ padding: 16 }}>에러: {err}</div>;

  if (status === "unauth") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (status === "need_profile") {
    return <Navigate to="/profile-setup" replace state={{ from: location.pathname }} />;
  }

  return children;
}
