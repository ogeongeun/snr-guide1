import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import FarmingEfficiency from './pages/FarmingEfficiency';
import EssentialHeroesPage from './pages/EssentialHeroesPage';
import RaidGuidePage from './pages/RaidGuidePage';
import GlobalBackButton from './pages/GlobalBackButton';
import SiegePage from './pages/SiegePage';
import SiegeSkillDetailPage from './pages/SiegeSkillDetailPage';
import SkillOrderPage from './pages/SkillOrderPage';
import RaidSkillDetailPage from './pages/RaidSkillDetailPage';
import AdventureDetailPage from './pages/AdventureDetailPage';
import Adventure from './pages/Adventure';
import InfinityTowerDetailPage from './pages/InfinityTowerDetailPage';
import ExpeditionSkillPage from './pages/ExpeditionSkillPage';
import InfinityTowerPage from './pages/InfinityTowerPage';
import InfinitySkillDetailPage from './pages/InfinitySkillDetailPage';
import ExpeditionTeamPage from './pages/ExpeditionTeamPage';
import ExpeditionPage from './pages/ExpeditionPage';
import TrialTowerDetailPage from './pages/TrialTowerDetailPage';
import TrialTowerPage from './pages/TrialTowerPage';
import GuildDefensePage from './pages/GuildDefensePage';
import GuildDefenseBuildPage from './pages/GuildDefenseBuildPage';
import GuildOffenseFinderPage from './pages/GuildOffenseFinderPage'; // 추가된 FinderPage
import GuildOffenseSetupPage from './pages/GuildOffenseSetupPage';
import EquipmentRecommendationPage from './pages/EquipmentRecommendationPage';
import GuildOffenseCounterPage from './pages/GuildOffenseCounterPage';
import GuildOffenseDetailPage from './pages/GuildOffenseDetailPage';
import AccessoryCustomPage from './pages/AccessoryCustomPage';
import WeaponArmorSelectPage from "./pages/WeaponArmorSelectPage";
import EnhanceFilterPage from "./pages/EnhanceFilterPage"; // 다음 단계 페이지
import GrandBattlePage from './pages/GrandBattlePage';
import VoodooPage from './pages/VoodooPage';
import EnhanceStep2Page from "./pages/EnhanceStep2Page";
const App = () => {
  return (
    <Router>
       <GlobalBackButton />
      <Routes>
          
        <Route path="/" element={<Home />} />
        <Route path="/farming" element={<FarmingEfficiency />} />
        <Route path="/essential-heroes" element={<EssentialHeroesPage />} />
        <Route path="/raid-skill/:bossKey/:teamIndex" element={<RaidSkillDetailPage />} />
        <Route path="/siege" element={<SiegePage />} />
        <Route path="/siege-skill/:day/:teamIndex" element={<SiegeSkillDetailPage />} />
        <Route path="/skill-order" element={<SkillOrderPage />} />
        <Route path="/raid-guide" element={<RaidGuidePage/>} />
        <Route path="/adventure" element={<Adventure/>} />
          <Route path="/enhance-guide" element={<WeaponArmorSelectPage />} />
  <Route path="/enhance-guide/:type" element={<EnhanceFilterPage />} />
        <Route path="/guild-offense-finder" element={<GuildOffenseFinderPage />} />
        <Route path="/adventure/:stage" element={<AdventureDetailPage />} />
        <Route path="/expedition/:heroId" element={<ExpeditionTeamPage />} />
          <Route path="/expedition/:heroId/:teamIndex" element={<ExpeditionSkillPage />} />
 <Route path="/expedition-skill/:heroId/:setIdx/:teamIdx" element={<ExpeditionSkillPage />} />
       <Route path="/infinity-tower" element={<InfinityTowerPage />} />
       <Route path="/infinity-tower/:floor" element={<InfinityTowerDetailPage />} />
        <Route path="/infinity-skill/:floor/:teamIndex" element={<InfinitySkillDetailPage />} />
        <Route path="/trial-tower" element={<TrialTowerPage />} />
        <Route path="/enhance-guide/:type/step2" element={<EnhanceStep2Page />} />
<Route path="/trial-tower/:floor" element={<TrialTowerDetailPage />} />
 <Route path="/expedition" element={<ExpeditionPage />} /> {/* ✅ 추가 */}
      <Route path="/expedition/:heroId" element={<ExpeditionTeamPage />} />
 <Route path="/guild-defense" element={<GuildDefensePage />} />
  <Route path="/guild-defense/build" element={<GuildDefenseBuildPage />} />

<Route path="/guild-offense/setup" element={<GuildOffenseSetupPage />} />
<Route path="/equipment" element={<EquipmentRecommendationPage />} />
 <Route path="/guild-offense" element={<GuildOffenseCounterPage />} />
      <Route path="/guild-offense-detail/:category/:teamIndex" element={<GuildOffenseDetailPage />} />
<Route path="/accessory-custom" element={<AccessoryCustomPage />} />
<Route path="/grand-battle" element={<GrandBattlePage />} />
    <Route path="/voodoo" element={<VoodooPage />} />



      </Routes>
    </Router>
  );
};

export default App;
