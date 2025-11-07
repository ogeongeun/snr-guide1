import { useState } from "react";

export default function GuildOffenseSetupPage() {
  const [our, setOur] = useState(["", "", ""]);
  const [order, setOrder] = useState(["", "", "", "", "", ""]);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const MIN_SPEED = 29; // 영웅 최소속공
  const MAX_SPEED = 109; // 영웅 최대속공

  // 이미 선택된 턴은 다른 드롭다운에 나오지 않도록 처리
  const getAvailableOptions = (index) => {
    const selected = order.filter((_, i) => i !== index);
    const allOptions = [
      "우리1번",
      "우리2번",
      "우리3번",
      "상대1번",
      "상대2번",
      "상대3번",
    ];
    return allOptions.filter((opt) => !selected.includes(opt));
  };

  const handleCalc = () => {
    const ourSpeeds = {
      우리1번: Number(our[0]) || 0,
      우리2번: Number(our[1]) || 0,
      우리3번: Number(our[2]) || 0,
    };

    const results = {};
    let lastOurSpeed = null;

    // 턴 순서 기반 속공 추정
    order.forEach((turn, i) => {
      if (turn.startsWith("우리")) {
        lastOurSpeed = ourSpeeds[turn];
      } else if (turn.startsWith("상대")) {
        const nextOur = order.slice(i + 1).find((t) => t.startsWith("우리"));
        const nextOurSpeed = nextOur ? ourSpeeds[nextOur] : MIN_SPEED;
        const max = lastOurSpeed ?? MAX_SPEED;
        const min = nextOurSpeed ?? MIN_SPEED;
        results[turn] = { min, max };
      }
    });

    // 총합 계산
    const ourTotal = Object.values(ourSpeeds).reduce((a, b) => a + b, 0);
    const totalMin = Object.values(results).reduce(
      (acc, cur) => acc + cur.min,
      0
    );
    const totalMax = Object.values(results).reduce(
      (acc, cur) => acc + cur.max,
      0
    );

    setResult({ ourTotal, results, totalMin, totalMax });
    setShowModal(true); // ✅ 계산 후 모달 열기
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col items-center py-10 px-6 relative">
      <h1 className="text-3xl font-bold mb-8 text-blue-600">
        속공 계산기
      </h1>

      {/* 입력 카드 */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">
          우리팀 속공 입력
        </h2>

        <div className="space-y-3 mb-6">
          {our.map((v, i) => (
            <div key={i} className="flex items-center justify-between">
              <label className="text-gray-700 font-medium">
                우리 {i + 1}번
              </label>
              <input
                type="number"
                value={v}
                onChange={(e) =>
                  setOur((prev) => {
                    const copy = [...prev];
                    copy[i] = e.target.value;
                    return copy;
                  })
                }
                placeholder="속공 입력"
                className="w-32 p-2 rounded-lg border border-gray-300 text-center focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
          ))}
        </div>

        {/* 턴 순서 입력 */}
        <h2 className="text-lg font-semibold mb-4 text-center text-gray-700">
          턴 순서 입력 (위에서 아래로)
        </h2>

        <div className="space-y-2 mb-6">
          {order.map((v, i) => (
            <div key={i} className="flex items-center justify-between">
              <label className="text-gray-700 font-medium">
                {i + 1}턴
              </label>
              <select
                value={v}
                onChange={(e) =>
                  setOrder((prev) => {
                    const copy = [...prev];
                    copy[i] = e.target.value;
                    return copy;
                  })
                }
                className="w-32 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
              >
                <option value="">선택</option>
                {getAvailableOptions(i).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <button
          onClick={handleCalc}
          className="w-full py-3 mt-2 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition"
        >
          계산하기
        </button>
      </div>

      {/* ✅ 결과 모달창 */}
      {showModal && result && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 text-center animate-fadeIn">
            <h2 className="text-xl font-bold text-blue-600 mb-4">
              🧩 속공 추정 결과
            </h2>

            <div className="mb-4 font-semibold text-gray-700">
              우리팀 속공 총합:{" "}
              <span className="text-blue-600 font-mono">
                {result.ourTotal}
              </span>
            </div>

            <div className="border-t border-gray-200 my-3"></div>

            <div className="space-y-2 mb-3">
              {Object.entries(result.results).map(([key, val]) => (
                <div
                  key={key}
                  className="flex justify-between bg-gray-50 border border-gray-200 p-2 rounded-lg"
                >
                  <span className="font-medium text-gray-700">{key}</span>
                  <span className="font-mono text-blue-600">
                    {val.min} ~ {val.max}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 my-3"></div>

            <div className="font-semibold text-gray-700">
              상대팀 총합 범위:{" "}
              <span className="text-blue-600 font-mono">
                {result.totalMin} ~ {result.totalMax}
              </span>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-400 transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
