import { useState } from "react";
import { X, Info, Flame } from "lucide-react";
import { useDrawer, useDrawerDispatch } from "../../contexts/drawer/drawer.provider";
import { errorFunction, loadingFunction, succesfullBlockchainCreation } from "../../toasts/sweetAlerts";
import { txHashOf } from "../../../midnight/tx-result";
import { notifyTokenBurned } from "../../../midnight/token-events";

// Confirmation popup for poap.compact's burn(tokenId), opened two ways (SHOW_BURN_TOKEN):
//   "revoke" — the event's organizer, from the subscribers list (subscribersList.jsx);
//   "burn"   — the holder, from their own POAP (poapCard.jsx).
// The contract accepts either (owner, event organizer or admin). Burning is permanent: the token
// is marked burned and its credential leaf is cleared, so it can't back any proof after this.
const COPY = {
  revoke: {
    title: "Revoke POAP",
    progress: "Revoking POAP",
    done: "POAP Revoked",
    action: "Revoke",
    busy: "Revoking…",
    intro: (id) =>
      `Revokes POAP #${id} for good. Its holder still sees it, marked Burned, but can no longer prove they hold it.`,
  },
  burn: {
    title: "Burn POAP",
    progress: "Burning POAP",
    done: "POAP Burned",
    action: "Burn",
    busy: "Burning…",
    intro: (id) =>
      `Burns your POAP #${id} for good. It stays in your list as Burned, but you can no longer prove you hold it.`,
  },
};

export default function BurnToken() {
  const { midnight, burnTokenContext: ctx } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [submitting, setSubmitting] = useState(false);

  const copy = COPY[ctx?.mode] || COPY.burn;
  const tokenId = ctx ? String(ctx.tokenId) : "";

  const closeDrawer = () => dispatch({ type: "CLOSE_DRAWER" });

  const handleBurn = async () => {
    if (!midnight?.provider || !ctx) return;
    setSubmitting(true);
    try {
      loadingFunction(copy.progress, "Preparing transaction…", "");
      const txHash = txHashOf(await midnight.provider.service.burn(BigInt(ctx.tokenId)));
      notifyTokenBurned(ctx.eventId, ctx.tokenId);
      closeDrawer();
      succesfullBlockchainCreation(copy.done, txHash ? `Transaction: ${txHash}` : "", "");
    } catch (error) {
      console.error("Error burning token:", error);
      errorFunction("Error", error.message || "Failed to burn the POAP. Please try again.", "");
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex flex-column w-100 drawer-modal-inner">
      <div className="drawer-header">
        <button className="btn wallet-modal-close" onClick={closeDrawer} aria-label="close">
          <X size={15} />
        </button>
        <h4 className="text-center w-100 m-0 font-weight-semibold">{copy.title}</h4>
      </div>

      <div className="drawer-body">
        {!midnight?.provider ? (
          <div className="alert alert-info" role="alert">
            Connect your wallet first.
          </div>
        ) : !ctx ? null : (
          <>
            <p className="text-muted small mb-3">{copy.intro(tokenId)}</p>
            {ctx.eventName && (
              <p className="small mb-3">
                <span className="text-muted">Event: </span>
                <span className="text-white">{ctx.eventName}</span>
              </p>
            )}
            <div className="info-hint-card is-warning mb-0">
              <Info size={16} />
              <p>This can't be undone.</p>
            </div>
          </>
        )}
      </div>

      <div className="drawer-footer d-flex" style={{ gap: "8px" }}>
        <button className="btn btn-card-detail-action flex-grow-1" onClick={closeDrawer} disabled={submitting}>
          Cancel
        </button>
        <button
          className="btn btn-destructive flex-grow-1"
          onClick={handleBurn}
          disabled={!midnight?.provider || !ctx || submitting}
        >
          <Flame size={14} className="mr-2" />
          {submitting ? copy.busy : copy.action}
        </button>
      </div>
    </div>
  );
}
