import { useEffect, useCallback } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/index";
import AppHome from "./pages/appHome";
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
          {/* Landing (marketing/onboarding) — everything else below lives under /app. */}
          <Route path="/" exact element={<Dashboard />} />
          <Route path="/organizer" element={<OrganizerInfo />} />
          <Route path="/subscriber" element={<SubscriberInfo />} />

          {/* App */}
          <Route path="/app" element={<AppHome />} />
          <Route path="/app/overview" element={<Overview />} />
          <Route path="/app/search" element={<Search />} />
          <Route path="/app/my-events" element={<MyEvents />} />
          <Route path="/app/explore-events" element={<ExploreEvents />} />
          <Route path="/app/my-subscriptions" element={<MySubscriptions />} />
          {/* No nav link points here anymore — deliberately shelved rather than deleted, for a
              possible future organizer-analytics view. Reachable only by typing the URL directly. */}
          <Route path="/app/organizer-dashboard" element={<OrganizerDashboard />} />
          {/* Admin-only, gated inside the page itself (REACT_APP_ADMIN_WALLET_ADDRESSES) — not
              linked from any nav menu, same reasoning as /app/organizer-dashboard above. */}
          <Route path="/app/admin/deploy" element={<AdminDeploy />} />
          <Route path="/app/share/:pkHex" element={<SharedCollection />} />
          <Route path="/app/souls" element={<Souls />} />
          <Route path="/app/Settings-profile" element={<SettingsProfile />} />
          <Route path="/app/soulbounds-claim" element={<SoulboundClaim />} />
          <Route path="/app/collection/:id" element={<Collection />} />
          <Route path="/app/collections/:section" element={<Collections />} />
          <Route path="/app/claim-mint" element={<ClaimMint />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default Router;
