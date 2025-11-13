// src/pages/EnhanceStep2Page.jsx
import {  useLocation } from "react-router-dom";
import { useState } from "react";

export default function EnhanceStep2Page() {

  const location = useLocation();

  // Step1에서 넘어온 값들
  const { type, selectedSets = [], mainSelected = [] } = location.state || {};

  // key → label 변환 테이블
  const setLabelMap = {
    tracker: "추적자",
    assassin: "암살자",
    avenger: "복수자",
  };

  const mainLabelMap = {
    weak: "약점 공격",
    crit: "치명타 확률",
    critdmg: "치명타 피해",
  };

  // ---------------- 서브옵션 조합 ----------------
  const combos = [
    ["weak", "crit"],      // 약공 + 치확
    ["crit", "critdmg"],   // 치확 + 치피
    ["critdmg", "weak"],   // 치피 + 약공
  ];

  const [selectedCombo, setSelectedCombo] = useState(null);

  const handleComboClick = (pair) => {
    if (
      selectedCombo &&
      selectedCombo[0] === pair[0] &&
      selectedCombo[1] === pair[1]
    ) {
      setSelectedCombo(null);
    } else {
      setSelectedCombo(pair);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {type === "weapon" ? "무기 강화 필터 - 단계 2" : "방어구 강화 필터 - 단계 2"}
      </h1>

      {/* ---------------- 세트 ---------------- */}
      <p className="text-sm font-semibold text-gray-700 mb-2">선택된 세트</p>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {selectedSets.map((s) => (
          <div
            key={s}
            className="py-2 rounded-xl border bg-yellow-300 border-yellow-600 text-gray-900 font-bold text-center"
          >
            {setLabelMap[s]}
          </div>
        ))}
      </div>

      {/* ---------------- 메인 옵션 ---------------- */}
      <p className="text-sm font-semibold text-gray-700 mb-2">메인 옵션</p>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {mainSelected.map((m) => (
          <div
            key={m}
            className="py-2 rounded-xl border bg-yellow-300 border-yellow-600 text-gray-900 font-bold text-center"
          >
            {mainLabelMap[m]}
          </div>
        ))}
      </div>

      {/* ---------------- 자동 생성된 3개 조합 ---------------- */}
      <p className="text-sm font-semibold text-gray-700 mb-2">서브옵션 (각각 하나씩 2개를 세트로 눌러서 나오는 장비 강화)</p>

      <div className="grid grid-cols-3 gap-3 mb-10">
        {combos.map((pair, idx) => {
          const isSelected =
            selectedCombo &&
            selectedCombo[0] === pair[0] &&
            selectedCombo[1] === pair[1];

          return (
            <button
              key={idx}
              onClick={() => handleComboClick(pair)}
              className={`
                p-3 rounded-xl border flex flex-col gap-2 items-center transition
                ${
                  isSelected
                    ? "bg-yellow-300 border-yellow-600 shadow text-gray-900 font-bold"
                    : "bg-gray-100 border-gray-300 text-gray-500"
                }
              `}
            >
              {/* 윗 칩 */}
              <div
                className={`
                  w-full py-1 rounded-lg border text-xs text-center
                  ${
                    isSelected
                      ? "bg-yellow-200 border-yellow-600 text-gray-900"
                      : "bg-white border-gray-300 text-gray-700"
                  }
                `}
              >
                {mainLabelMap[pair[0]]}
              </div>

              {/* 아랫 칩 */}
              <div
                className={`
                  w-full py-1 rounded-lg border text-xs text-center
                  ${
                    isSelected
                      ? "bg-yellow-200 border-yellow-600 text-gray-900"
                      : "bg-white border-gray-300 text-gray-700"
                  }
                `}
              >
                {mainLabelMap[pair[1]]}
              </div>
            </button>
          );
        })}
      </div>

      {/* ---------------- 초기 서브옵션 수 (모두 고정) ---------------- */}
      <p className="text-sm font-semibold text-gray-700 mb-2">초기 서브 옵션 수</p>
      <div className="mb-10">
        <div className="py-2 rounded-xl border text-center bg-yellow-300 border-yellow-600 text-gray-900 font-bold">
          모두
        </div>
      </div>

      {/* ---------------- 기타 옵션 (Max 강화 숨김) ---------------- */}
      <p className="text-sm font-semibold text-gray-700 mb-2">기타 옵션</p>
      <div className="mb-10">
        <div className="py-2 rounded-xl border text-center bg-yellow-300 border-yellow-600 text-gray-900 font-bold">
          Max 강화 장비 숨김
        </div>
      </div>

      {/* ---------------- 강화 설명 (버튼 대신) ---------------- */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 shadow-sm leading-relaxed">
        <p>
          선택된 조합 기준으로 장비를 검색합니다.  
          <br /><br />
          이미 <strong>3강까지 강화된 장비는 9강까지</strong> 계속 강화하며,  
          9강 이후 <strong>좋은 옵션이 붙을 경우 12강 → 15강까지</strong>  
          끊지 않고 쭉 강화합니다.
        </p>
      </div>
    </div>
  );
}
