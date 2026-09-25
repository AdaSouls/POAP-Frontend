import { useCallback, useEffect, useRef, useState } from "react";
import Layout from "../layout/layout";
import { useDrawer, useDrawerDispatch } from "../contexts/drawer/drawer.provider";
import { useUserRoles } from "../contexts/user-roles/user-roles.provider";
import { useEventMetadata } from "../hooks/useEventMetadata";
import { getAllEvents, getEvent } from "../../midnight/indexer.service";
import { parseMintFragment } from "../../midnight/invite-links";
import loadingGif from "../../images/loading.gif";

const truncateHex = (hex) => `${hex.slice(0, 10)}…${hex.slice(-8)}`;

// Only invite-only events can be minted to (see eventCard.jsx's canMintForEvent), and only by
// their organizer or the admin — the same rule poap.compact's mintTo enforces.
const canMintTo = (event, myPk, isAdmin) =>
  Boolean(event) && !event.isPublicMint && event.isActive !== false && (isAdmin || event.issuerPk === myPk);

function EventPickRow({ event, onPick }) {
  const { metadata } = useEventMetadata(event.metadataURI);
  return (
    <li className="subscribers-list-row">
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <p className="m-0 small font-weight-semibold text-break">{metadata?.name || `Event ${truncateHex(event.eventId)}`}</p>
        <p className="m-0 text-muted small">{event.minted} issued</p>
      </div>
      <button type="button" className="btn btn-card-detail-action btn-sm flex-shrink-0" onClick={() => onPick(event)}>
        Mint POAP
      </button>
    </li>
  );
}

// A holder's mint link (invite-links.ts → /app/mint#to=<code>[&event=…]). Opens Mint POAP with the
// recipient filled in. With an event in the link (it came from an invite), that event is used —
// after checking this wallet may mint to it; without one (plain Get My Key), the organizer picks one
// of their own invite-only events.
export default function MintLink() {
  const { midnight } = useDrawer();
  const dispatch = useDrawerDispatch();
  const { isAdmin } = useUserRoles();
  const myPk = midnight?.provider?.address;
  const [link] = useState(() => parseMintFragment(window.location.hash || ""));
  const [event, setEvent] = useState(undefined); // undefined = loading, null = not found
  const [ownEvents, setOwnEvents] = useState(null);
  const { metadata } = useEventMetadata(event?.metadataURI);
  const openedRef = useRef(false);

  const openMint = useCallback(
    (target) => dispatch({ type: "CREATE_MINT", payload: target, recipient: link.holderCode }),
    [dispatch, link],
  );

  useEffect(() => {
    if (!link?.eventIdHex) return undefined;
    let cancelled = false;
    getEvent(link.eventIdHex)
      .then((found) => {
        if (!cancelled) setEvent(found || null);
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [link]);

  useEffect(() => {
    if (!link || link.eventIdHex || !myPk) return undefined;
    let cancelled = false;
    getAllEvents()
      .then((events) => {
        if (!cancelled) setOwnEvents(events.filter((e) => canMintTo(e, myPk, isAdmin)));
      })
      .catch(() => {
        if (!cancelled) setOwnEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [link, myPk, isAdmin]);

  const allowed = canMintTo(event, myPk, isAdmin);

  // Opens the popup by itself once, as soon as everything checks out.
  useEffect(() => {
    if (allowed && !openedRef.current) {
      openedRef.current = true;
      openMint(event);
    }
  }, [allowed, event, openMint]);

  const renderBody = () => {
    if (!link) {
      return (
        <div className="alert alert-danger" role="alert">
          This link doesn't contain a valid key. Ask the person to copy it again from Get My Key.
        </div>
      );
    }
    if (!myPk) {
      return (
        <div className="alert alert-info" role="alert">
          Connect the organizer's wallet to issue this credential.
        </div>
      );
    }
    if (link.eventIdHex) {
      if (event === undefined) {
        return (
          <p className="text-muted small d-flex align-items-center">
            <img src={loadingGif} width="14" height="14" alt="" className="mr-2" />
            Loading the event…
          </p>
        );
      }
      if (event === null) {
        return (
          <div className="alert alert-danger" role="alert">
            Could not find the event in this link.
          </div>
        );
      }
      if (!allowed) {
        return (
          <div className="alert alert-warning" role="alert">
            {event.isPublicMint
              ? "This event isn't invite-only, so POAPs can't be issued to people directly."
              : "This link is for the organizer of this event. Connect the organizer's wallet."}
          </div>
        );
      }
      return (
        <div className="drawer-modal-preview-card">
          <p className="small mb-3">
            Issuing a credential of <span className="text-white">{metadata?.name || truncateHex(event.eventId)}</span> to{" "}
            <span className="text-white">{truncateHex(link.holderCode)}</span>.
          </p>
          <button type="button" className="btn btn-card-detail-action btn-sm" onClick={() => openMint(event)}>
            Open Mint POAP
          </button>
        </div>
      );
    }
    if (ownEvents === null) {
      return (
        <p className="text-muted small d-flex align-items-center">
          <img src={loadingGif} width="14" height="14" alt="" className="mr-2" />
          Loading your events…
        </p>
      );
    }
    if (ownEvents.length === 0) {
      return (
        <div className="alert alert-info" role="alert">
          This wallet has no active invite-only event to issue a credential from.
        </div>
      );
    }
    return (
      <>
        <p className="text-muted">
          Issuing a credential to <span className="text-white">{truncateHex(link.holderCode)}</span>. Pick the event:
        </p>
        <ul className="list-unstyled m-0 subscribers-list">
          {ownEvents.map((e) => (
            <EventPickRow key={e.eventId} event={e} onPick={openMint} />
          ))}
        </ul>
      </>
    );
  };

  return (
    <Layout>
      <div className="role-organizer">
        <div className="inner-header">
          <div className="inner-header-row">
            <h4 className="m-0">Issue a Credential</h4>
          </div>
        </div>
        <div className="row">
          <div className="col-12 col-lg-8">{renderBody()}</div>
        </div>
      </div>
    </Layout>
  );
}
