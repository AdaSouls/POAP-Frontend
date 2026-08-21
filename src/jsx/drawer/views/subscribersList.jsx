import { X, Award } from "lucide-react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 10)}…${hex.slice(-8)}`;
};

// Read-only popup opened from eventCard.jsx's expanded organizer view — replaces the old icon grid
// (one thumbnail per claimer) with an actual list, since every self-claimed token shares the same
// image anyway so the icons never conveyed anything beyond a raw count. `subscribers` is stashed by
// the SHOW_SUBSCRIBERS dispatch (eventCard.jsx) as { event, tokens, label }, so this view does no
// fetching of its own — it just renders what the card already loaded.
//
// Fields shown are limited to what IndexedToken actually carries (indexer.service.ts): ownerPk,
// burned status, and mint block/tx as provenance. There's no claim timestamp and no flag
// distinguishing a self-claim from an organizer push-mint (mintTo) — both produce an identical
// token row today, so this list can't tell them apart either.
export default function SubscribersList() {
  const { subscribers } = useDrawer();
  const dispatch = useDrawerDispatch();

  const closeDrawer = () => {
    dispatch({ type: "CLOSE_DRAWER" });
  };

  const tokens = subscribers?.tokens || [];
  const label = subscribers?.label || "Subscribers";

  return (
    <div className="d-flex flex-column w-100 drawer-modal-inner">
      <div className="drawer-header">
        <button
          className="btn wallet-modal-close"
          onClick={closeDrawer}
          aria-label="close"
        >
          <X size={15} />
        </button>
        <h4 className="text-center w-100 m-0 font-weight-semibold">
          {label} ({tokens.length})
        </h4>
      </div>

      <div className="drawer-body">
        {tokens.length === 0 ? (
          <div className="alert alert-info" role="alert">
            No {label.toLowerCase()} yet.
          </div>
        ) : (
          <ul className="list-unstyled m-0 subscribers-list">
            {tokens.map((token) => (
              <li key={token.tokenId} className="subscribers-list-row">
                <Award size={16} className="card-media-thumb-broken-icon-role flex-shrink-0" />
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <p className="m-0 text-break small font-weight-semibold">
                    {truncateHex(token.ownerPk)}
                  </p>
                  <p className="m-0 text-muted small">
                    Token #{token.tokenId}
                    {token.mintedBlock !== null && ` · Block ${token.mintedBlock}`}
                  </p>
                </div>
                <span className={`badge flex-shrink-0 ${token.isBurned ? "bg-secondary" : "status-badge-active"}`}>
                  {token.isBurned ? "Burned" : "Active"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
