import { useParams } from 'react-router-dom';
import { useState } from 'react';
import essentialSkills from '../data/essential-skills.json';

const EssentialSkillDetailPage = () => {
  const { element, teamIndex } = useParams();
  const decodedElement = decodeURIComponent(element);
  const idx = Number(teamIndex);

  const teamData = essentialSkills?.[decodedElement]?.[idx];
  const [tabIndex, setTabIndex] = useState(0);

  if (!teamData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        데이터 없음
      </div>
    );
  }

  const skillOrders = teamData.skillOrders || [];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-4">
          {decodedElement} · 조합 {idx + 1}
        </h1>

        {/* 탭 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {skillOrders.map((order, i) => (
            <button
              key={i}
              onClick={() => setTabIndex(i)}
              className={`px-3 py-1.5 rounded-full text-sm ${
                tabIndex === i
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {order.orderTitle}
            </button>
          ))}
        </div>

        {/* 스킬 */}
        {skillOrders[tabIndex]?.skills.map((stage, sIdx) => (
          <div key={sIdx} className="mb-6">
            <p className="font-semibold text-blue-600 mb-2">
              {stage.stageTitle}
            </p>

            <div className="flex gap-4 flex-wrap justify-center">
              {stage.images.map((img, i) => (
                <div key={i} className="flex flex-col items-center">
                  <img
                    src={`/images/skills/${img}`}
                    alt={`skill-${i + 1}`}
                    className="w-10 h-10 object-contain border rounded"
                  />
                  <span className="text-xs mt-1">#{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EssentialSkillDetailPage;
