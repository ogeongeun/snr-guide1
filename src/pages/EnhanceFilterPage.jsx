// src/pages/EnhanceFilterPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Check } from "lucide-react";

export default function EnhanceFilterPage() {
  const navigate = useNavigate();
  const { type } = useParams();

  // ---------------- 세트 선택 ----------------
  const weaponSets = [
    { key: "tracker", label: "추적자" },
    { key: "assassin", label: "암살자" },
    { key: "avenger", label: "복수자" },
  ];

  const [selectedSets, setSelectedSets] = useState([]);

  const toggleAllWeaponSets = () => {
    const allKeys = weaponSets.map((s) => s.key);
    const selected = selectedSets.length === 3;
    setSelectedSets(selected ? [] : allKeys);
  };

  const allSetSelected = selectedSets.length === 3;

  // ---------------- 메인옵션 (3개 전부 고정 선택됨) ----------------
  const mainOptions = [
    { key: "weak", label: "약점 공격" },
    { key: "crit", label: "치명타 확률" },
    { key: "critdmg", label: "치명타 피해" },
  ];

  const mainSelected = ["weak", "crit", "critdmg"]; // 무조건 선택

  // ---------------- 서브옵션 (1개만 선택) ----------------
  const subOptionList = [
    { key: "subWeak", label: "약점 공격" },
    { key: "subCrit", label: "치명타 확률" },
    { key: "subCritDmg", label: "치명타 피해" },
  ];

  const [subSelected, setSubSelected] = useState("");

  const toggleSub = (key) => {
    if (subSelected === key) setSubSelected("");
    else setSubSelected(key);
  };

  // ---------------- 초기 서브옵 (3개 고정) ----------------
  const subCounts = [1, 2, 3, 4];

  // ---------------- 기타 ----------------
  const miscOptions = [
    { key: "hideEquipped", label: "Max 강화 장비 숨김" },
    { key: "hideUnequipped", label: "강화한 장비 숨김" },
  ];

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {type === "weapon" ? "무기 강화 필터" : "방어구 강화 필터"}
      </h1>

      {/* ---------------- 세트 선택 ---------------- */}
      <p className="text-sm font-semibold text-gray-700 mb-2">세트</p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {weaponSets.map((set) => (
          <button
            key={set.key}
            onClick={toggleAllWeaponSets}
            className={`
              flex items-center justify-center gap-1 py-2 rounded-xl border text-sm transition
              ${
                allSetSelected
                  ? "bg-yellow-300 border-yellow-500 text-gray-900 font-bold shadow"
                  : "bg-gray-100 border-gray-300 text-gray-500"
              }
            `}
          >
            {allSetSelected && <Check size={14} />}
            {set.label}
          </button>
        ))}
      </div>

      {/* 세트 선택 전 → 아래 내용 숨김 */}
      {!allSetSelected && (
        <div className="text-center text-gray-400 text-sm mt-10">
          세트를 먼저 선택해주세요.
        </div>
      )}

      {/* ---------------- 세트 선택 후 UI 표시 ---------------- */}
      {allSetSelected && (
        <>
          {/* ---------------- 메인옵션 (고정선택) ---------------- */}
          <p className="text-sm font-semibold text-gray-700 mb-2">메인 옵션</p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {mainOptions.map((opt) => (
              <div
                key={opt.key}
                className="py-2 rounded-xl border text-sm text-center 
                bg-yellow-300 border-yellow-600 text-gray-900 font-bold shadow"
              >
                {opt.label}
              </div>
            ))}
          </div>

          {/* ---------------- 서브옵션 (1개만 선택) ---------------- */}
          <p className="text-sm font-semibold text-gray-700 mb-2">
            서브 옵션 (약공·치확·치피 각각 누르고 나온 장비 3강씩 강화)!!한번에누르는게아니라 각각 하나씩눌러서 나온장비강화
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {subOptionList.map((opt) => (
              <button
                key={opt.key}
                onClick={() => toggleSub(opt.key)}
                className={`
                  py-2 rounded-xl border text-sm transition
                  ${
                    subSelected === opt.key
                      ? "bg-yellow-300 border-yellow-600 text-gray-900 font-bold shadow"
                      : "bg-gray-100 border-gray-300 text-gray-500"
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* ---------------- 초기 서브옵 개수 ---------------- */}
          <p className="text-sm font-semibold text-gray-700 mb-2">
            초기 서브옵 개수
          </p>

          <div className="grid grid-cols-4 gap-3 mb-8">
            {subCounts.map((num) => (
              <div
                key={num}
                className={`
                  py-2 rounded-xl border text-sm text-center
                  ${
                    num === 3
                      ? "bg-yellow-300 border-yellow-600 text-gray-900 font-bold shadow"
                      : "bg-gray-300 border-gray-400 text-gray-400"
                  }
                `}
              >
                {num}개
              </div>
            ))}
          </div>

          {/* ---------------- 기타 필터 ---------------- */}
          <p className="text-sm font-semibold text-gray-700 mb-2">기타 필터</p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {miscOptions.map((opt) => (
              <div
                key={opt.key}
                className="
                  py-2 rounded-xl border text-sm text-center 
                  bg-yellow-300 border-yellow-600 text-gray-900 font-bold shadow
                "
              >
                {opt.label}
              </div>
            ))}
          </div>

          {/* ---------------- 설명란 ---------------- */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 mb-10 shadow-sm">
            <p className="leading-relaxed">
              선택된 필터 기준으로 장비를 검색한 뒤,  
              <strong>서브옵션(약공 / 치확 / 치피)을 각각 1회씩 선택하여</strong>  
              해당 장비를 <strong>3강까지만 강화</strong>
            </p>
          </div>

          {/* ---------------- 다음 단계 이동 ---------------- */}
          <button
            className="w-full py-3 bg-blue-500 text-white rounded-xl text-lg font-bold shadow hover:bg-blue-600 transition"
            onClick={() =>
              navigate(`/enhance-guide/${type}/step2`, {
                state: {
                  type,
                  selectedSets,
                  mainSelected,
                 
                },
              })
            }
          >
            다음 단계 강화 진행
          </button>
        </>
      )}
    </div>
  );
}
