const accessoryData = {
  "무탑/결장용": [
    {
      title: '1. CC천국',
      description: '무탑용, 결장용. 성급 높은 CC 장신구를 베이스로 하고, 필요 없는 옵션을 임의 세공해서 사용.'
    },
    {
      title: '2. 전설 베이스',
      description: '무탑, 결장 겸용. 전설 장신구를 베이스로 하며, CC기, 치명확률, 약점확률, 피해증가 중 선택 세공.'
    }
  ],
  "보스/쫄작용": [
    {
      title: '3. 스탯 상승형',
      description: '보스, 쫄작용. 방어구 베이스 또는 전설 베이스에 치명확률, 약점확률, 피해증가 위주 세공.'
    }
  ]
};

export default function AccessoryCustomPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">💍 장신구 세공법 추천</h1>

        {Object.entries(accessoryData).map(([category, items], idx) => (
          <div key={idx} className="mb-8">
            <h2 className="text-lg font-semibold text-blue-700 mb-3">{category}</h2>
            <div className="space-y-4">
              {items.map((item, subIdx) => (
                <div key={subIdx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-800">{item.title}</p>
                  <p className="text-sm text-gray-700 mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
