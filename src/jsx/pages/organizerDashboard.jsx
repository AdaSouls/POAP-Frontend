import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Chart from "react-apexcharts";
import { UserPlus } from "lucide-react";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import { getAllEvents } from "../../midnight/indexer.service";
import { getEventStatus } from "../../utils/poapHelpers";
import loadingGif from "../../images/loading.gif";
import walletStatus from "../../images/collections/wallet-status.png";

const REFRESH_INTERVAL_MS = 5000;

// Status colors reuse the app's own existing Bootstrap theme vars (--bs-success/warning/danger/
// secondary, see src/css/style.css) — the same ones eventCard.jsx's status badges already use —
// rather than a separate chart-only palette, so the donut here reads as "the same active/expired/
// full/inactive language" as the rest of the app instead of introducing a second color vocabulary.
// Validated with the dataviz skill against this app's actual dark surface (#10206e): contrast
// passes for all four; the secondary(gray)-vs-danger(red) pair sits in the CVD warn band, and
// "inactive" gray reads low-chroma by design (it's meant to look neutral) — both mitigated below
// with a legend + direct data labels, never color alone.
const STATUS_COLORS = {
  active: "#34c38f",
  full: "#f1b44c",
  expired: "#f46a6a",
  inactive: "#74788d",
};
const STATUS_ORDER = ["active", "full", "expired", "inactive"];

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

const OrganizerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [allEvents, setAllEvents] = useState([]);
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();
  const { isAdmin, isIssuer } = useUserRoles();
  const pollRef = useRef(null);

  const canView = isAdmin || isIssuer;

  const openRegisterIssuer = () => {
    dispatch({ type: "CREATE_ISSUER" });
  };

  const loadEvents = useCallback(async () => {
    try {
      const events = await getAllEvents();
      setAllEvents(events);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return undefined;
    }
    loadEvents();
    pollRef.current = setInterval(loadEvents, REFRESH_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [canView, loadEvents]);

  const myEvents = useMemo(() => {
    if (isAdmin) return allEvents;
    if (!provider) return [];
    return allEvents.filter((e) => e.issuerPk === provider.address);
  }, [allEvents, isAdmin, provider]);

  const statusCounts = useMemo(() => {
    const counts = { active: 0, full: 0, expired: 0, inactive: 0 };
    myEvents.forEach((event) => {
      counts[getEventStatus(event)] += 1;
    });
    return counts;
  }, [myEvents]);

  const totalMinted = useMemo(
    () => myEvents.reduce((sum, event) => sum + (event.minted || 0), 0),
    [myEvents]
  );

  const cappedEvents = useMemo(
    () => myEvents.filter((e) => e.maxSupply > 0).slice(0, 12),
    [myEvents]
  );

  const donutOptions = {
    labels: STATUS_ORDER.map((s) => s[0].toUpperCase() + s.slice(1)),
    colors: STATUS_ORDER.map((s) => STATUS_COLORS[s]),
    legend: { position: "bottom", labels: { colors: "#c4cdf6" } },
    dataLabels: { enabled: true },
    stroke: { colors: ["#10206e"] },
    chart: { foreColor: "#c4cdf6" },
    tooltip: { theme: "dark" },
  };
  const donutSeries = STATUS_ORDER.map((s) => statusCounts[s]);

  const barOptions = {
    chart: { stacked: true, toolbar: { show: false }, foreColor: "#c4cdf6" },
    plotOptions: { bar: { horizontal: true, barHeight: "60%" } },
    xaxis: { categories: cappedEvents.map((e) => `Event ${truncateHex(e.eventId)}`) },
    colors: ["#50a5f1", "rgba(196,205,246,0.15)"],
    legend: { position: "top", labels: { colors: "#c4cdf6" } },
    dataLabels: { enabled: false },
    tooltip: { theme: "dark" },
  };
  const barSeries = [
    { name: "Minted", data: cappedEvents.map((e) => e.minted || 0) },
    { name: "Remaining", data: cappedEvents.map((e) => Math.max(0, e.maxSupply - (e.minted || 0))) },
  ];

  return (
    <Layout activeMenu={6}>
      <div className="role-organizer">
        <div className="inner-header">
          <div className="inner-header-row">
            <div className="inner-header-row-left">
              {canView && (
                <span className="badge badge-count-outline">
                  {myEvents.length} {myEvents.length === 1 ? "Event" : "Events"}
                </span>
              )}
            </div>
            <div className="inner-header-row-right">
              {isAdmin && (
                <button className="inner-header-action-btn" onClick={openRegisterIssuer}>
                  <span className="inner-header-action-btn-inner">
                    <UserPlus size={14} /> Register Issuer
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {!provider ? (
          <div className="row">
            <div className="col-xxl-6 col-lg-6 col-md-12">
              <div className="card card-event card-classic card-outline-only">
                <div className="wallet-non-connected">
                  <img className="mt-6" src={walletStatus} width="150" height="140" alt="" />
                </div>
              </div>
            </div>
          </div>
        ) : !canView ? (
          <div className="row">
            <div className="col-12">
              <div className="card card-outline-only">
                <div className="card-outline-only-body p-4 text-center">
                  <p className="text-muted m-0">Organizer access required to view this dashboard.</p>
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="row">
            <div className="col-xxl-6 col-lg-6 col-md-12">
              <div className="card card-event card-classic card-outline-only">
                <div className="card-outline-only-body d-flex justify-content-center">
                  <img src={loadingGif} width="35" height="35" alt="" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="row">
              <div className="col-xxl-3 col-xl-3 col-lg-4 col-md-6 mb-3">
                <div className="card card-outline-only">
                  <div className="card-outline-only-body">
                    <p className="m-0 small text-muted">Total minted (my events)</p>
                    <h3 className="m-0">{totalMinted}</h3>
                  </div>
                </div>
              </div>
              <div className="col-xxl-9 col-xl-9 col-lg-8 col-md-6 mb-3">
                <div className="card card-outline-only">
                  <div className="card-outline-only-body">
                    <p className="m-0 small text-muted mb-2">Status breakdown</p>
                    <Chart options={donutOptions} series={donutSeries} type="donut" height={220} />
                  </div>
                </div>
              </div>
            </div>

            {cappedEvents.length > 0 && (
              <div className="row">
                <div className="col-12">
                  <div className="card card-outline-only">
                    <div className="card-outline-only-body">
                      <p className="m-0 small text-muted mb-2">Minted vs. capacity per event</p>
                      <Chart
                        options={barOptions}
                        series={barSeries}
                        type="bar"
                        height={Math.max(220, cappedEvents.length * 45)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {myEvents.length === 0 && (
              <div className="row">
                <div className="col-12">
                  <div className="card card-outline-only">
                    <div className="card-outline-only-body p-4 text-center">
                      <p className="text-muted m-0">No events yet.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default OrganizerDashboard;
