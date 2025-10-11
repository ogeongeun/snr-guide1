import { useParams } from 'react-router-dom';
import { useState } from 'react';
import siegeSkills from '../data/siege-skills.json';

const SiegeSkillDetailPage = () => {
  const { day, teamIndex } = useParams();
  const decodedDay = decodeURIComponent(day);
  const teamIdx = parseInt(teamIndex);

  const teamStages = siegeSkills[decodedDay];
  const teamData = teamStages?.[teamIdx];

  const [tabIndex, setTabIndex] = useState(0);

  const skillOrders = teamData?.skillOrders ?? [];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {decodedDay} - 팀 {teamIdx + 1}
        </h1>

        {/* 탭 버튼 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {skillOrders.map((order, index) => (
            <button
              key={index}
              onClick={() => setTabIndex(index)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                tabIndex === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {order.orderTitle}
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        {skillOrders.length > 0 && (
          <div className="flex flex-col items-center text-center bg-gray-100 p-4 rounded-xl shadow-sm">
            {skillOrders[tabIndex].skills.map((stage, idx) => (
              <div key={idx} className="w-full mb-6">
                <p className="text-lg font-semibold text-blue-600 mb-2 text-center">
                  {stage.stageTitle}
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-4">
                  {stage.images.map((img, i) => {
                    const isObject = typeof img === 'object';
                    const imageSrc = isObject ? img.image : img;
                    const inlineLabel = isObject ? img.label : null;
                    const indexLabel = stage.labels?.[i.toString()];
                    const finalLabel = inlineLabel || indexLabel;

                    return (
                      <div key={i} className="flex flex-col items-center max-w-[80px]">
                        <img
                          src={`/images/skills/${imageSrc}`}
                          alt={`Skill ${i + 1}`}
                          title={imageSrc}
                          className="w-10 h-10 object-contain border rounded-md"
                        />
                        <span className="text-xs text-gray-600 mt-1">#{i + 1}</span>
                        {finalLabel && (
                          <span className="text-[11px] text-red-500 mt-1 text-center leading-snug break-words">
                            {finalLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {idx !== skillOrders[tabIndex].skills.length - 1 && (
                  <hr className="border-t border-gray-300 my-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SiegeSkillDetailPage;
