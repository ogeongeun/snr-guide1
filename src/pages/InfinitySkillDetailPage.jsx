import { useParams } from 'react-router-dom';
import infinitySkills from '../data/infinity_tower_skills.json';

const InfinitySkillDetailPage = () => {
  const { floor, teamIndex } = useParams();

  const decodedFloor = decodeURIComponent(floor);
  const teamKey = teamIndex !== undefined ? parseInt(teamIndex).toString() : "0";

  const stageData =
    infinitySkills?.[decodedFloor]?.[teamKey] ??
    infinitySkills?.["171층"]?.[teamKey];

  // ✅ 오류 방지: videoUrl 안전하게 추출
  const videoUrl =
    typeof stageData === 'object' &&
    !Array.isArray(stageData) &&
    stageData?.videoUrl
      ? stageData.videoUrl
      : null;

  const stageTitles = ["1스테이지", "2스테이지", "3스테이지"];

  if (!stageData || typeof stageData !== 'object') {
    return (
      <div className="p-6 text-center text-red-600">
        ⚠️ 스킬 정보를 찾을 수 없습니다.
        <br />
        층: <strong>{decodedFloor}</strong>, 팀: <strong>{teamKey}</strong>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-3 text-center">
          🗼 {decodedFloor} - 팀 {parseInt(teamKey) + 1} 스킬 순서
        </h1>

        {/* ✅ 유튜브 링크 출력 */}
        {videoUrl && (
          <div className="text-center mb-4">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm underline"
            >
              📺 공략 영상 보기
            </a>
          </div>
        )}

       

        {stageTitles.map((title, idx) => {
          const stage = stageData[title];
          const images = Array.isArray(stage) ? stage : stage?.skills;
          const note = !Array.isArray(stage) ? stage?.note : null;

          return (
            <div key={idx} className="mb-8">
              <h2 className="text-lg font-semibold text-blue-600 mb-2 text-center">
                {title}
              </h2>

              <div className="flex flex-wrap justify-center gap-4">
                {images?.map((img, i) => {
                  const isObject = typeof img === "object" && img !== null;
                  const imageSrc = isObject ? img.image : img;
                  const label = isObject ? img.label : null;

                  return (
                    <div key={i} className="flex flex-col items-center">
                      <img
                        src={`/images/skills/${imageSrc}`}
                        alt={`Skill ${i + 1}`}
                        title={imageSrc}
                        className="w-12 h-12 object-contain border rounded-md"
                      />
                      <span className="text-xs mt-1 text-gray-500">#{i + 1}</span>
                      {label && (
                        <span className="text-[11px] text-blue-500 italic mt-0.5">
                          {label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {note && (
                <p className="mt-2 text-center text-[13px] text-gray-500 italic">
                  {note}
                </p>
              )}

              {idx !== stageTitles.length - 1 && (
                <hr className="my-6 border-gray-300" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InfinitySkillDetailPage;
