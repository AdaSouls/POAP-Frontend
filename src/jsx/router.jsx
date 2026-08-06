import { useEffect, useCallback } from "react";
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
import { useDrawerDispatch } from "./contexts/drawer/drawer.provider";
import ClaimMint from "./pages/claim-mint";
import { getAllEvents } from "../midnight/indexer.service";
import EventsPage from "./pages/events";
import PoapManagement from "./pages/poapManagement";
import Overview from "./pages/overview";
import Create from "./pages/create";
import OrganizerDashboard from "./pages/organizerDashboard";
import SharedCollection from "./pages/sharedCollection";

const Router = () => {
  const dispatch = useDrawerDispatch();
  const updateEvents = useCallback((events) => {
    dispatch({
      type: "UPDATE_EVENTS",
      payload: events,
    });
  }, [dispatch]);

  useEffect(() => {
    async function fetchData() {
      try {
        const events = await getAllEvents();
        updateEvents(events);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    }
    fetchData();
  }, [updateEvents]);

  return (
    <BrowserRouter>
      <Drawer />

      {/* <BrowserRouter> */}
      <div id="main-wrapper">
        <Routes>
          <Route path="/" exact element={<Dashboard />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/search" element={<Search />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/poap-management" element={<PoapManagement />} />
          <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
          <Route path="/share/:pkHex" element={<SharedCollection />} />
          <Route path="/create" element={<Create />} />
          <Route path="/souls" element={<Souls />} />
          <Route path="/Settings-profile" element={<SettingsProfile />} />
          <Route path="/soulbounds-claim" element={<SoulboundClaim />} />
          <Route path="/collection/:id" element={<Collection />} />
          <Route path="/collections/:section" element={<Collections />} />
          <Route path="claim-mint" element={<ClaimMint />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default Router;
