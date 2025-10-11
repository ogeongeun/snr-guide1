import React from 'react';
import skillOrders from '../data/skill-orders.json';

const SkillOrderPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          희귀 스킬 강화 우선순위
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {skillOrders.map((hero, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow p-4 flex space-x-4 items-start">
              <img
                src={hero.image}
                alt={hero.name}
                  className="w-16 h-16 rounded-lg object-contain bg-white"
              />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{hero.name}</h2>
               
                <p className="text-sm mb-1">
                  강화순서: <span className="font-medium">{hero.skills.join(' , ')}</span>
                </p>
                
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SkillOrderPage;
