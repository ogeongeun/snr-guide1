import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      title: '공성전',
      path: '/siege',
      description: '요일별 공성전 영웅, 스킬순서',
      emoji: '🏰'
    },
    {
      title: '길드전',
      path: '/guild-defense',
      description: '길드전 방어팀 공격팀 추천',
      emoji: '🛡️'
    },
    {
      title: '강림원정대',
      path: '/expedition',
      description: '보스별 공략 및 추천 영웅 세팅',
      emoji: '🔥'
    },
     {
      title: '총력전',
      path: '/grand-battle',
      description: '총력전 전용 팀 구성 및 공략 정보',
      emoji: '⚔️'
    },
    {
  title: '장비 강화 가이드',
  path: '/enhance-guide',
  description: '무기/방어구 선택 후 강화 우선순위 안내',
  emoji: '⚙️'
},
 {
      title: '장비 추천',
      path: '/equipment',
      description: '영웅들의 장비 추천',
      emoji: '🛠'
    },
   
    {
      title: '무한의 탑',
      path: '/infinity-tower',
      description: '층별 조건에 맞춘 공략 덱 정보',
      emoji: '🏯'
    },
    {
      title: '시련의 탑',
      path: '/trial-tower',
      description: '층별 조건에 맞춘 공략 덱 정보',
      emoji: '💀'
    },
    {
      title: '모험',
      path: '/adventure',
      description: '모험 콘텐츠용 클리어 덱',
      emoji: '🗺️'
    },
   
    {
      title: '장신구 세공법',
      path: '/accessory-custom',
      description: '무탑/결장/보스/쫄작용 추천 조합',
      emoji: '💍'
    },
    {
      title: '레이드',
      path: '/raid-guide',
      description: '레이드 영웅장비 및 추천 스킬순서',
      emoji: '🐉'
    },
    {
      title: '성장던전',
      path: '/essential-heroes',
      description: '요일별 성장던전 클리어덱',
      emoji: '⭐'
    },
    {
      title: '스킬 강화 순서',
      path: '/skill-order',
      description: '영웅별 스킬 강화 우선순위 추천',
      emoji: '💡'
    },
    {
      title: '쫄작 효율 비교',
      path: '/farming',
      description: '경험치/루비 손익 기준 효율 계산',
      emoji: '🔍'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          세븐나이츠 리버스 공략 도우미
          <p className="text-center text-xs text-red-500 mb-4 italic">
            본 콘텐츠는 천우회,백우회,매드데이 길드 전용이며, 무단 사용 및 복제를 금합니다.
          </p>
        </h1>
        <p className="text-center text-sm text-gray-500 mb-2 italic">made by 천우회</p>
        {/* 추가 부분 */}
        <p className="text-center text-xs text-blue-500 mb-6 italic">
          <a 
            href="https://www.youtube.com/live/c5_GUQaME_c?si=_Y_Bfh_MdIQ9rHdN" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            클릭--우울할 때 보는 영상
          </a>
        </p>

        <Link to="/voodoo">
          <div className="text-center text-lg font-bold text-purple-700 bg-purple-100 rounded-xl py-2 mb-6 shadow-sm hover:bg-purple-200 cursor-pointer transition">
            🧙‍♂️ 1급 비밀 부두술
          </div>
        </Link>

        {/* 카드 리스트 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Link
              to={feature.path}
              key={index}
              className="bg-white shadow hover:shadow-lg rounded-xl p-5 transition transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-2">{feature.emoji}</div>
              <h2 className="text-lg font-semibold text-gray-800">{feature.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* 오른쪽 하단 마크 */}
      <div className="absolute bottom-2 right-4 text-xs text-gray-400">
        sj
      </div>
    </div>
  );
};

export default Home;
