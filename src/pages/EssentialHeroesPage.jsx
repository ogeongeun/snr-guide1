import { useState } from 'react';
import data from '../data/essential-heroes.json';

const EssentialHeroesPage = () => {
  const { elementalEffects } = data || {};
  const [selectedCategory, setSelectedCategory] = useState(null);

  const currentData = elementalEffects || {};

  const renderHeroes = (heroes) => {
    if (!Array.isArray(heroes)) return null;

    return (
      <div className="flex flex-wrap gap-4 mt-4">
        {heroes.map((hero, idx) =>
          typeof hero === 'string' && hero.startsWith('description') ? (
            <p key={idx} className="text-sm italic text-gray-500 col-span-full">
              ※ {hero.replace('description :', '').trim()}
            </p>
          ) : (
            <div
              key={idx}
              className="flex flex-col items-center bg-white border rounded-lg p-2 shadow-sm w-24 h-28"
            >
              <img
                src={`/images/heroes/${hero.image}`}
                alt={hero.name}
                className="w-20 h-20 object-contain"
              />
             
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">📋 요일별 성장던전</h1>

        {/* 카테고리 목록 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(currentData).map(([category]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`text-sm px-3 py-2 rounded border text-gray-800 bg-white hover:bg-gray-100 transition ${
                selectedCategory === category ? 'ring-2 ring-blue-400' : ''
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 세부 내용 */}
        {selectedCategory && (
          <div className="mt-4">
            <h3 className="text-xl font-bold text-gray-700 mb-4">{selectedCategory}</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(currentData[selectedCategory]).map(([trait, heroes], i) =>
                trait === '비고' ? (
                  <li key={i} className="col-span-full text-sm italic text-gray-500">※ {heroes}</li>
                ) : (
                  <li key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="font-semibold text-gray-700 mb-2">{trait}</p>
                    {renderHeroes(heroes)}
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default EssentialHeroesPage;
