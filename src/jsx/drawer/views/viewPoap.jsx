import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { getLastClaimTx } from "../../../midnight/attendance-proof";

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

// The "poap" here is a private-state SPOAP token — see poapCard.jsx / poapManagement.jsx. There is
// no on-chain event metadata (title/image/description) to show; attendance is a list of event ids
// this token has been updated for, known only to this browser's private state.
export default function ViewPoap() {
  const { poap } = useDrawer();
  const dispatch = useDrawerDispatch();
  const lastClaimTx = poap?.issuerPkHex ? getLastClaimTx(poap.issuerPkHex) : null;

  const closeDrawer = () => {
    dispatch({ type: "CLOSE_DRAWER" });
  };

  const copyTxHash = () => {
    if (lastClaimTx) navigator.clipboard?.writeText(lastClaimTx);
  };

  return (
    <div className="container absolute top-0 start-0 w-100 h-100 p-3 overflow-auto">
      <div className="drawer-header">
        <div className="d-flex justify-content-start">
          <button
            className="btn btn-close align-content-center px-1 mt-2 position-absolute"
            onClick={closeDrawer}
            aria-label="close"
          ></button>
          <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold capitalize">
            POAP Token Details
          </h4>
        </div>
      </div>

      <div className="drawer-body">
        <div className="mb-4">
          <div className="row g-3">
            <div className="col-12">
              <div className="card bg-light p-3 mb-3">
                <p className="m-0 small text-muted mb-1">Token ID</p>
                <h3 className="m-0" style={{ fontSize: "24px", fontWeight: "700" }}>
                  {poap?.tokenId !== undefined ? String(poap.tokenId) : "N/A"}
                </h3>
              </div>
            </div>

            <div className="col-12">
              <p className="m-0 small text-muted mb-1">Issuer (Organizer)</p>
              <p className="m-0 mb-3 text-break small font-weight-semibold">
                {poap?.issuerPkHex || "N/A"}
              </p>
            </div>

            <div className="col-6">
              <p className="m-0 small text-muted mb-1">Soulbound</p>
              <p className="m-0 mb-3 font-weight-semibold">{poap?.isSoulbound ? "Yes" : "No"}</p>
            </div>

            <div className="col-6">
              <p className="m-0 small text-muted mb-1">Events Attended</p>
              <p className="m-0 mb-3 font-weight-semibold">{poap?.attendedEventIds?.length ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <hr className="my-4" />
          <h4 className="mb-3" style={{ fontSize: "16px" }}>Prove Attendance</h4>
          {lastClaimTx ? (
            <>
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-success mr-2">Verified ✓</span>
                <span className="small text-muted">This token was claimed with a ZK-proved on-chain transaction.</span>
              </div>
              <div className="d-flex align-items-center">
                <code className="text-break small flex-grow-1">{lastClaimTx}</code>
                <button className="btn btn-sm btn-outline-secondary ml-2" onClick={copyTxHash}>
                  Copy
                </button>
              </div>
            </>
          ) : (
            <p className="text-muted small mb-0">
              No recent claim transaction recorded on this device. Claim (or reconcile) this token
              here to generate a shareable proof.
            </p>
          )}
          <small className="text-muted d-block mt-2">
            This proves you hold a token for this contract — every claim is already a ZK-proved
            transaction verified on-chain. Proving specific attendance counts without revealing
            which events requires new contract circuits (planned follow-up work).
          </small>
        </div>

        {poap?.attendedEventIds?.length > 0 && (
          <div className="mb-4">
            <hr className="my-4" />
            <h4 className="mb-3" style={{ fontSize: "16px" }}>Attendance (this device only)</h4>
            <ul className="list-unstyled mb-0">
              {poap.attendedEventIds.map((eventId) => (
                <li key={eventId} className="d-flex align-items-center mb-2">
                  <i className="icofont-calendar mr-2"></i>
                  <span className="text-break small">{truncateHex(eventId)}</span>
                </li>
              ))}
            </ul>
            <small className="text-muted d-block mt-2">
              This list is stored only in this browser's private state and is never sent to any
              server — see the "private state is per-browser" note in the migration docs.
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
