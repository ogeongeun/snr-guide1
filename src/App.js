import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import FarmingEfficiency from "./pages/FarmingEfficiency";
import EssentialHeroesPage from "./pages/EssentialHeroesPage";
import RaidGuidePage from "./pages/RaidGuidePage";
import GlobalBackButton from "./pages/GlobalBackButton";
import SiegePage from "./pages/SiegePage";
import SiegeSkillDetailPage from "./pages/SiegeSkillDetailPage";
import LoginPage from "./pages/LoginPage";
import RequireAuth from "./components/RequireAuth";
import ProfileSetupPage from "./pages/ProfileSetupPage";

import CommunityListPage from "./pages/community/CommunityListPage";
import CommunityWritePage from "./pages/community/CommunityWritePage";
import CommunityPostPage from "./pages/community/CommunityPostPage";

import SkillOrderPage from "./pages/SkillOrderPage";
import RaidSkillDetailPage from "./pages/RaidSkillDetailPage";
import AdventureDetailPage from "./pages/AdventureDetailPage";
import Adventure from "./pages/Adventure";
import InfinityTowerDetailPage from "./pages/InfinityTowerDetailPage";
import ExpeditionSkillPage from "./pages/ExpeditionSkillPage";
import InfinityTowerPage from "./pages/InfinityTowerPage";
import InfinitySkillDetailPage from "./pages/InfinitySkillDetailPage";
import ExpeditionTeamPage from "./pages/ExpeditionTeamPage";
import ExpeditionPage from "./pages/ExpeditionPage";
import TrialTowerDetailPage from "./pages/TrialTowerDetailPage";
import TrialTowerPage from "./pages/TrialTowerPage";

import GuildDefensePage from "./pages/GuildDefensePage";
import GuildDefenseBuildPage from "./pages/GuildDefenseBuildPage";
import GuildOffenseFinderPage from "./pages/GuildOffenseFinderPage";
import GuildOffenseSetupPage from "./pages/GuildOffenseSetupPage";
import EquipmentRecommendationPage from "./pages/EquipmentRecommendationPage";
import GuildOffenseCounterPage from "./pages/GuildOffenseCounterPage";
import GuildOffenseDetailPage from "./pages/GuildOffenseDetailPage";
import GuildManagePage from "./pages/GuildManagePage";

import AccessoryCustomPage from "./pages/AccessoryCustomPage";
import WeaponArmorSelectPage from "./pages/WeaponArmorSelectPage";
import EnhanceFilterPage from "./pages/EnhanceFilterPage";
import EnhanceStep2Page from "./pages/EnhanceStep2Page";

import GrandBattlePage from "./pages/GrandBattlePage";
import VoodooPage from "./pages/VoodooPage";

import MyProfilePage from "./pages/MyProfilePage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import EssentialSkillDetailPage from "./pages/EssentialSkillDetailPage";

const App = () => {
  return (
    <Router>
      <GlobalBackButton />

      <Routes>
        {/* 공개 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />

        {/* 관리자 (페이지 자체에서 admin 체크함) */}
        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <AdminUsersPage />
            </RequireAuth>
          }
        />

        {/* 커뮤니티 */}
        <Route
          path="/community"
          element={
            <RequireAuth>
              <CommunityListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/community/write"
          element={
            <RequireAuth>
              <CommunityWritePage />
            </RequireAuth>
          }
        />
        <Route
          path="/community/post/:id"
          element={
            <RequireAuth>
              <CommunityPostPage />
            </RequireAuth>
          }
        />

        {/* 메인 */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />

        {/* 내 프로필도 보호 */}
        <Route
          path="/me"
          element={
            <RequireAuth>
              <MyProfilePage />
            </RequireAuth>
          }
        />

        {/* 나머지 기능들 (원래대로) */}
        <Route path="/farming" element={<FarmingEfficiency />} />
        <Route path="/essential-heroes" element={<EssentialHeroesPage />} />
        <Route path="/essential-skill/:element/:teamIndex" element={<EssentialSkillDetailPage />} />
<Route
  path="/guild-manage"
  element={
    <RequireAuth>
      <GuildManagePage />
    </RequireAuth>
  }
/>


        <Route path="/raid-guide" element={<RaidGuidePage />} />
        <Route path="/raid-skill/:bossKey/:teamIndex" element={<RaidSkillDetailPage />} />

        <Route path="/siege" element={<SiegePage />} />
        <Route path="/siege-skill/:day/:teamIndex" element={<SiegeSkillDetailPage />} />

        <Route path="/skill-order" element={<SkillOrderPage />} />

        <Route path="/adventure" element={<Adventure />} />
        <Route path="/adventure/:stage" element={<AdventureDetailPage />} />

        <Route path="/enhance-guide" element={<WeaponArmorSelectPage />} />
        <Route path="/enhance-guide/:type" element={<EnhanceFilterPage />} />
        <Route path="/enhance-guide/:type/step2" element={<EnhanceStep2Page />} />

        <Route path="/expedition" element={<ExpeditionPage />} />
        <Route path="/expedition/:heroId" element={<ExpeditionTeamPage />} />
        <Route path="/expedition-skill/:heroId/:setIdx/:teamIdx" element={<ExpeditionSkillPage />} />

        <Route path="/infinity-tower" element={<InfinityTowerPage />} />
        <Route path="/infinity-tower/:floor" element={<InfinityTowerDetailPage />} />
        <Route path="/infinity-skill/:floor/:teamIndex" element={<InfinitySkillDetailPage />} />

        <Route path="/trial-tower" element={<TrialTowerPage />} />
        <Route path="/trial-tower/:floor" element={<TrialTowerDetailPage />} />

        <Route path="/guild-defense" element={<GuildDefensePage />} />
        <Route path="/guild-defense/build" element={<GuildDefenseBuildPage />} />

        <Route path="/guild-offense-finder" element={<GuildOffenseFinderPage />} />
        <Route path="/guild-offense/setup" element={<GuildOffenseSetupPage />} />
        <Route path="/guild-offense" element={<GuildOffenseCounterPage />} />
        <Route path="/guild-offense-detail/:category/:teamIndex" element={<GuildOffenseDetailPage />} />

        <Route path="/equipment" element={<EquipmentRecommendationPage />} />
        <Route path="/accessory-custom" element={<AccessoryCustomPage />} />
        <Route path="/grand-battle" element={<GrandBattlePage />} />
        <Route path="/voodoo" element={<VoodooPage />} />
      </Routes>
    </Router>
  );
};

export default App;
