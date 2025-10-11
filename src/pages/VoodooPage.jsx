// src/pages/VoodooPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function VoodooPage() {
  const [selectedTab, setSelectedTab] = useState('accessory'); // 'accessory' or 'hero'

  const tabClass = (tab) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition ${
      selectedTab === tab
        ? 'bg-purple-600 text-white'
        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    }`;

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold text-purple-700 mb-4 text-center">
          🧙‍♂️ 1급 비밀 부두술
        </h1>

        {/* 탭 버튼 */}
        <div className="flex justify-center gap-4 mb-8">
          <button className={tabClass('accessory')} onClick={() => setSelectedTab('accessory')}>
            💍 전설 장신구 부두술
          </button>
          <button className={tabClass('hero')} onClick={() => setSelectedTab('hero')}>
            🎯 영웅 뽑기 부두술
          </button>
        </div>

        {/* 탭 내용 */}
        {selectedTab === 'accessory' && (
          <div>
            <h2 className="text-xl font-bold text-yellow-700 mb-3 text-center">
              💍 전설 장신구획득 부두술
            </h2>
            <div className="bg-yellow-50 p-4 rounded-xl shadow-sm space-y-2 text-sm text-gray-800">
              <p>• 11-1,12-1에서 전반이 잘나온다는 소문이 무성함</p>
              <p>• 프로필 미믹으로 설정</p>
              <p>• 테두리 골드or이벤트</p>
              <p>• 생일7.7/여성</p>
              <p>• 상태메시지에 간절하게 전반달라고하기(ex 6성 불사반지 주세요 제발)</p>
             
            </div>
          </div>
        )}

        {selectedTab === 'hero' && (
         <div>
    <h2 className="text-xl font-bold text-blue-700 mb-3 text-center">
      🎯 영웅 뽑기 부두술
    </h2>
    <div className="bg-blue-50 p-4 rounded-xl shadow-sm space-y-2 text-sm text-gray-800">
      <p>• 프로필 에리/테두리 실버로 설정</p>
      <p>• 오후 11:11분 부터 뽑기 진행</p>
     
     

      {/* 🔽 이미지 삽입 */}
      <div className="flex justify-center my-4">
        <img
          src="/images/voodoo.png"
          alt="영웅 뽑기 부두술 예시"
          className="w-64 h-auto rounded-lg shadow-md"
        />
        
    
      </div>
       <p>• 로봇이 우측상단 별을 부착할때 클릭으로 연출 넘기기</p>
           <p>• 만약 4성이 하나도 안떴다면 연출 다 보기</p>
         <p>• 무조건 컴퓨터나 노트북으로 뽑기 진행(실제로 휴대폰으로 뽑으면 확률이 낮다는 소문이 무성함)</p>

     
      <p className="italic text-red-500">
        ※ 확률은 과학이 아닙니다. 그러나 부두술은 진실입니다.
      </p>
    </div>
  </div>
        )}

        {/* 홈으로 돌아가기 */}
        <div className="text-center mt-8">
          <Link
            to="/"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
