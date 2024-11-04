import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/index";
import Create from "./pages/create";
import SettingsProfile from "./pages/settings-profile";
import Search from "./pages/search";
import Wallet from "./pages/wallet";
import { Drawer } from "./drawer/drawer";
import Collection from "./pages/collection-details";
import MintClaim from "./pages/mint-claim";
import Collections from "./pages/collections";

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
          <Route path="/create" element={<Create />} />
          <Route path="/settings-profile" element={<SettingsProfile />} />
          <Route path="/mint-claim" element={<MintClaim />} />
          <Route path="/collection/:id" element={<Collection />} />          
          <Route path="/collections/:section" element={<Collections />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default Router;
