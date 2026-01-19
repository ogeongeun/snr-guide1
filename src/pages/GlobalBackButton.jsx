import { useNavigate, useLocation } from "react-router-dom";

export default function GlobalBackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // 홈 / 로그인 등에서는 숨김
  const hideOn = ["/", "/login", "/profile-setup"];
  if (hideOn.includes(pathname)) return null;

  return (
    <button
      onClick={() => navigate(-1)}
      className="
        fixed z-[9999]
        left-3 top-3
        w-8 h-8
       
       
     
       
        text-slate-700 text-lg
    
        active:scale-95
        transition
      "
      aria-label="뒤로가기"
    >
      ←
    </button>
  );
}
