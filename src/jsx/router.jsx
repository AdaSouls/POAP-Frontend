import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Demo from "./pages/demo";
import Dashboard from "./pages/index";
import Intro from "./pages/intro";
import Lock from "./pages/lock";
import Otp1 from "./pages/otp-1";
import Otp2 from "./pages/otp-2";
import Souls from "./pages/souls";
import PriceDetails from "./pages/price-details";
import Profile from "./pages/profile";
import Reset from "./pages/reset";
import SettingsActivity from "./pages/settings-activity";
import SettingsApi from "./pages/settings-api";
import SettingsApplication from "./pages/settings-application";
import SettingsFees from "./pages/settings-fees";
import SettingsPaymentMethod from "./pages/settings-payment-method";
import SettingsPrivacy from "./pages/settings-privacy";
import SettingsProfile from "./pages/settings-profile";
import SettingsSecurity from "./pages/settings-security";
import Signin from "./pages/signin";
import Signup from "./pages/signup";
import Search from "./pages/search";
import VerifyEmail from "./pages/verify-email";
import Wallet from "./pages/wallet";
import CardLibrary from "./pages/card-library";
import { Drawer } from "./drawer/drawer";
import Collection from "./pages/collection-details";
import SoulboundClaim from "./pages/soulbound-claim";

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
          <Route path="/souls" element={<Souls />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/intro" element={<Intro />} />
          <Route path="/card-library" element={<CardLibrary />} />
          <Route path="/lock" element={<Lock />} />
          <Route path="/otp-1" element={<Otp1 />} />
          <Route path="/otp-2" element={<Otp2 />} />
          <Route path="/price-details" element={<PriceDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reset" element={<Reset />} />
          <Route path="/settings-activity" element={<SettingsActivity />} />
          <Route path="/settings-api" element={<SettingsApi />} />
          <Route
            path="/settings-application"
            element={<SettingsApplication />}
          />
          <Route path="/settings-fees" element={<SettingsFees />} />
          <Route
            path="/settings-payment-method"
            element={<SettingsPaymentMethod />}
          />
          <Route path="/settings-privacy" element={<SettingsPrivacy />} />
          <Route path="/Settings-profile" element={<SettingsProfile />} />
          <Route path="/settings-security" element={<SettingsSecurity />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/collections/:id" element={<Collection />} />
          <Route path="/soulbounds-claim" element={<SoulboundClaim />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default Router;
