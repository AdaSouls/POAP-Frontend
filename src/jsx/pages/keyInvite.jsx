import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { useEventMetadata } from "../hooks/useEventMetadata";
import { getEvent } from "../../midnight/indexer.service";
import { generateHolderCode, mintLink, parseInviteFragment } from "../../midnight/invite-links";
import LinkQrCard from "../components/LinkQrCard";
import loadingGif from "../../images/loading.gif";

// An organizer's invite link for a Credential event (invite-links.ts → /app/key#organizer=…&event=…).
// Replaces "ask the organizer for their key, paste it into Get My Key": the code is generated as
// soon as a wallet is connected, and comes back as a mint link + QR to send to the organizer, with
// the event already in it.
export default function KeyInvite() {
  const { midnight } = useDrawer();
  const service = midnight?.provider?.service;
  const [invite] = useState(() => parseInviteFragment(window.location.hash || ""));
  const [event, setEvent] = useState(null);
  const { metadata } = useEventMetadata(event?.metadataURI);
  const [code, setCode] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!invite?.eventIdHex) return undefined;
    let cancelled = false;
    getEvent(invite.eventIdHex)
      .then((found) => {
        if (!cancelled) setEvent(found);
      })
      .catch((err) => console.error("Error loading the invited event:", err));
    return () => {
      cancelled = true;
    };
  }, [invite]);

  useEffect(() => {
    if (!invite || !service) return undefined;
    let cancelled = false;
    setError(null);
    generateHolderCode(service, invite.organizerPkHex)
      .then((generated) => {
        if (!cancelled) setCode(generated);
      })
      .catch((err) => {
        console.error("Error generating the holder code:", err);
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [invite, service]);

  const eventName = metadata?.name;

  return (
    <Layout>
      <div className="role-subscriber">
        <div className="inner-header">
          <div className="inner-header-row">
            <h4 className="m-0">Credential Invite</h4>
          </div>
        </div>
        <div className="row">
          <div className="col-12 col-lg-8">
            {!invite ? (
              <div className="alert alert-danger" role="alert">
                This invite link is incomplete. Ask the organizer to copy it again.
              </div>
            ) : (
              <>
                <p className="text-muted">
                  {eventName ? (
                    <>
                      You've been invited to receive a credential of <span className="text-white">{eventName}</span>.
                    </>
                  ) : (
                    "You've been invited to receive a credential."
                  )}{" "}
                  Send the link below back to the organizer so they can issue it to you.
                </p>
                {!service ? (
                  <div className="alert alert-info" role="alert">
                    Connect the wallet that should receive the credential. Your key for this organizer
                    is generated right after.
                  </div>
                ) : error ? (
                  <div className="alert alert-danger" role="alert">
                    Could not generate your key: {error.message || "unknown error"}.
                  </div>
                ) : !code ? (
                  <p className="text-muted small d-flex align-items-center">
                    <img src={loadingGif} width="14" height="14" alt="" className="mr-2" />
                    Generating your key for this organizer…
                  </p>
                ) : (
                  <>
                    <LinkQrCard
                      url={mintLink(window.location.origin, code, invite.eventIdHex)}
                      label="Send this to the organizer"
                      hint="It carries your key for this organizer only (it can't be linked to your other POAPs) and lets them send you the credential's private details encrypted."
                    />
                    <p className="text-muted small mt-3 mb-0">
                      Once issued, it shows up in <Link to="/app/my-subscriptions">My Subscriptions</Link>.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
