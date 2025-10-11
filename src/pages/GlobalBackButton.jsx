// C:\Users\sgala\snr-guide\src\pages\GlobalBackButton.jsx
import { useNavigate, useLocation } from 'react-router-dom';

export default function GlobalBackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ✅ 숨김 조건 제거 (홈에서도 보이게 하려면)
  // if (pathname === '/') return null;

  return (
    <button
      onClick={() => navigate(-1)}
      className="
        fixed z-[9999]
        left-4 top-4
        w-9 h-9 rounded-full
       
        flex items-center justify-center
        text-blue-600 text-lg font-bold
  
      "
      aria-label="뒤로가기"
      title={`뒤로가기 (${pathname})`}
    >
      ←
    </button>
  );
}
