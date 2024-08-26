import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/index";
import Souls from "./pages/souls";
import SettingsProfile from "./pages/settings-profile";
import Search from "./pages/search";
import Wallet from "./pages/wallet";
import { Drawer } from "./drawer/drawer";
import Collection from "./pages/collection-details";
import SoulboundClaim from "./pages/soulbound-claim";
import Collections from "./pages/collections";
import Events from "./pages/events";

const Router = () => {
  return (
    <BrowserRouter>
      
        <Drawer/>  
    
      {/* <BrowserRouter> */}      
      <div id="main-wrapper">
        <Routes>
          <Route path="/" exact element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/create-event" element={<Events />} />
          <Route path="/souls" element={<Souls />} />
          <Route path="/Settings-profile" element={<SettingsProfile />} />
          <Route path="/soulbounds-claim" element={<SoulboundClaim />} />
          <Route path="/collection/:id" element={<Collection />} />          
          <Route path="/collections/:section" element={<Collections />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default Router;
