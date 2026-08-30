import { useEffect, useCallback } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/index";
import Souls from "./pages/souls";
import SettingsProfile from "./pages/settings-profile";
import Search from "./pages/search";
import { Drawer } from "./drawer/drawer";
import Collection from "./pages/collection-details";
import SoulboundClaim from "./pages/soulbound-claim";
import Collections from "./pages/collections";
import { useDrawerDispatch } from "./contexts/drawer/drawer.provider";
import ClaimMint from "./pages/claim-mint";
import { getAllEvents } from "../midnight/indexer.service";
import MyEvents from "./pages/myEvents";
import ExploreEvents from "./pages/exploreEvents";
import MySubscriptions from "./pages/mySubscriptions";
import Overview from "./pages/overview";
import OrganizerDashboard from "./pages/organizerDashboard";
import SharedCollection from "./pages/sharedCollection";
import OrganizerInfo from "./pages/organizerInfo";
import SubscriberInfo from "./pages/subscriberInfo";
import AdminDeploy from "./pages/adminDeploy";

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
          <Route path="/my-events" element={<MyEvents />} />
          <Route path="/explore-events" element={<ExploreEvents />} />
          <Route path="/my-subscriptions" element={<MySubscriptions />} />
          <Route path="/organizer" element={<OrganizerInfo />} />
          <Route path="/subscriber" element={<SubscriberInfo />} />
          {/* No nav link points here anymore — deliberately shelved rather than deleted, for a
              possible future organizer-analytics view. Reachable only by typing the URL directly. */}
          <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
          {/* Admin-only, gated inside the page itself (REACT_APP_ADMIN_WALLET_ADDRESSES) — not
              linked from any nav menu, same reasoning as /organizer-dashboard above. */}
          <Route path="/admin/deploy" element={<AdminDeploy />} />
          <Route path="/share/:pkHex" element={<SharedCollection />} />
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
