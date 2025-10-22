import { useEffect } from "react";
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
import { getAllEventsService, getAllPoapsService } from "../services/paima.service";
import EventsPage from "./pages/events";
import PoapManagement from "./pages/poapManagement";
import Overview from "./pages/overview";
import Create from "./pages/create";


import MVP from "./pages/mvp";
import MVPEvents from "./pages/mvp-events";
import MVPTokens from "./pages/mvp-tokens";
import MVPCreateEvent from "./pages/mvp-create-event";
import MVPMintToken from "./pages/mvp-mint-token";
import MVPOrganizer from "./pages/mvp-organizer";
import MVPAttendee from "./pages/mvp-attendee";
import MVPMangeMinters from "./pages/mvp-manage-minters";
import MVPBulkDistribute from "./pages/mvp-bulk-distribute";

const Router = () => {
  const dispatch = useDrawerDispatch();
  const updateEvents = (events) => {
    dispatch({
      type: "UPDATE_EVENTS",
      payload: events,
    });
  };

  useEffect(() => {
    async function fetchData() {
      const events = await getAllEventsService();
      console.log("getting all events: >>>>>>>>>>>>>>", events);
      await getAllPoapsService();
      updateEvents(events);
    }
    fetchData();
  }, []);

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
          <Route path="/create" element={<Create />} />
          <Route path="/souls" element={<Souls />} />
          <Route path="/Settings-profile" element={<SettingsProfile />} />
          <Route path="/soulbounds-claim" element={<SoulboundClaim />} />
          <Route path="/collection/:id" element={<Collection />} />
          <Route path="/collections/:section" element={<Collections />} />
          <Route path="claim-mint" element={<ClaimMint />} />

          {/* MVP Routes - Smart Contract Only */}
          <Route path="/mvp" element={<MVP />} />
          <Route path="/mvp/events" element={<MVPEvents />} />
          <Route path="/mvp/tokens" element={<MVPTokens />} />
          <Route path="/mvp/create-event" element={<MVPCreateEvent />} />
          <Route path="/mvp/mint-token" element={<MVPMintToken />} />
          <Route path="/mvp/organizer" element={<MVPOrganizer />} />
          <Route path="/mvp/attendee" element={<MVPAttendee />} />
          <Route path="/mvp/manage-minters" element={<MVPMangeMinters />} />
          <Route path="/mvp/bulk-distribute" element={<MVPBulkDistribute />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default Router;
