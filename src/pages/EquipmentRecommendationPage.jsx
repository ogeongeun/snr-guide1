  import React, { useState, useEffect } from 'react';
  import equipmentData from '../data/equipmentRecommend.json';

  const EquipmentRecommendPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHeroKey, setSelectedHeroKey] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedStage, setSelectedStage] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const heroEntries = Object.entries(equipmentData).filter(([_, hero]) =>
      (hero.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedHero = selectedHeroKey ? equipmentData[selectedHeroKey] : null;

    const getRoleKeys = (hero) => {
      if (!hero?.roles) return [];
      return Object.keys(hero.roles).filter((k) => k !== 'ring');
    };

    useEffect(() => {
      if (selectedHero) {
        const roleKeys = getRoleKeys(selectedHero);
        if (roleKeys.length === 1) {
          setSelectedRole(roleKeys[0]);
        }
      }
    }, [selectedHero]);

    useEffect(() => {
      if (selectedHero && selectedRole) {
        const stageKeys = Object.keys(selectedHero.roles[selectedRole] || {});
        if (stageKeys.length === 1) {
          setSelectedStage(stageKeys[0]);
        }
      }
    }, [selectedHero, selectedRole]);

    const getCommonRing = () => selectedHero?.roles?.ring || '';

    const parseOptions = (options) => {
      if (!options) return [];
      return options.split('/').map((opt) => opt.trim());
    };

    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">🛡️ 장비 추천</h1>

        <input
          type="text"
          placeholder="영웅 이름 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 mb-6 border rounded-lg shadow"
        />

        {/* 영웅 리스트 */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-6">
          {heroEntries.map(([key, hero]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedHeroKey(key);
                setSelectedRole(null);
                setSelectedStage(null);
                setShowModal(true);
              }}
              className="relative flex flex-col items-center border rounded-lg p-2 bg-white hover:shadow"
            >
              {/* 🎯 프리셋 추천 배지 */}
              {hero.isPresetHero && (
                <span className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow">
                  🎯 프리셋
                </span>
              )}

              <img
                src={hero.image}
                alt={hero.name}
                className="w-16 h-16 object-contain"
              />
              <p className="text-xs mt-1 text-center">{hero.name}</p>
            </button>
          ))}
        </div>

        {/* 모달 */}
        {showModal && selectedHero && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-6 relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
              >
                ✖
              </button>

              <h2 className="text-xl font-bold text-center mb-2">
                {selectedHero.name}
              </h2>

              {getCommonRing() && (
                <div className="mb-4 text-center">
                  <span className="inline-block text-xs px-2 py-1 rounded-full bg-amber-100 border border-amber-300">
                    💍 반지 추천: <strong>{getCommonRing()}</strong>
                  </span>
                </div>
              )}

              {getRoleKeys(selectedHero).length > 1 && (
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-semibold mb-2">역할 선택</h3>
                  <div className="flex justify-center flex-wrap gap-3">
                    {getRoleKeys(selectedHero).map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setSelectedRole(role);
                          setSelectedStage(null);
                        }}
                        className={`px-4 py-1 rounded-full border shadow text-sm transition ${
                          selectedRole === role
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedRole &&
                Object.keys(selectedHero.roles[selectedRole] || {}).length > 1 && (
                  <div className="mb-4 text-center">
                    <h3 className="text-md font-medium mb-2">초월 단계 선택</h3>
                    <div className="flex justify-center flex-wrap gap-2">
                      {Object.keys(selectedHero.roles[selectedRole] || {}).map(
                        (stage) => (
                          <button
                            key={stage}
                            onClick={() => setSelectedStage(stage)}
                            className={`px-3 py-1 rounded-full border text-sm transition ${
                              selectedStage === stage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {stage}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

              {selectedRole && selectedStage && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-center mb-4">
                    {selectedHero.name} ({selectedRole}, {selectedStage}) 장비 세팅
                  </h3>

                  {selectedHero.roles[selectedRole][selectedStage].map(
                    (build, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-4 bg-gray-50 shadow-sm mb-4"
                      >
                        <p className="font-semibold text-sm mb-3">
                          세트: {build.set}
                        </p>

                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {parseOptions(build.mainOption).map((opt, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-center border rounded-lg bg-white p-2 shadow text-xs text-center"
                            >
                              {opt}
                            </div>
                          ))}
                        </div>

                        {build.subOption && (
                          <div className="border rounded-md bg-blue-50 border-blue-300 px-3 py-2 text-xs font-medium text-gray-700 mb-2">
                            📊 조건: {build.subOption}
                          </div>
                        )}

                        {build.note && (
                          <div className="border rounded-md bg-yellow-50 border-yellow-300 px-3 py-2 text-xs font-medium text-gray-700">
                            ⚡ 부옵: {build.note}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  export default EquipmentRecommendPage;
