// src/pages/WeaponArmorSelectPage.jsx
import { useNavigate } from "react-router-dom";

export default function WeaponArmorSelectPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-lg mx-auto text-center">
      <h1 className="text-3xl font-bold mb-6">장비 강화 가이드</h1>
      <p className="text-gray-600 mb-8 text-sm">
        강화할 장비 종류를 선택하세요
      </p>

      <div className="flex flex-col gap-6">

        {/* 무기 */}
        <button
          onClick={() => navigate("/enhance-guide/weapon")}
          className="w-full py-6 bg-red-500 text-white rounded-xl shadow-lg text-xl font-bold hover:bg-red-600 transition"
        >
          ⚔️ 무기
        </button>

        {/* 방어구 */}
        <button
          onClick={() => navigate("/enhance-guide/armor")}
          className="w-full py-6 bg-blue-500 text-white rounded-xl shadow-lg text-xl font-bold hover:bg-blue-600 transition"
        >
          🛡️ 방어구
        </button>

      </div>
    </div>
  );
}
