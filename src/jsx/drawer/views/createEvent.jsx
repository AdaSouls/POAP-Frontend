import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { useState } from "react";
import { Button } from "react-bootstrap";
import {
  errorFunction,
  loadingFunction,
  succesfullBlockchainCreation,
} from "../../toasts/sweetAlerts";

// NOTE: the Midnight POAP indexer (poap-midnight/indexer) only tracks on-chain fields
// (event id, organizer pk, max supply, expiration, active/public-mint flags, minted count) — there
// is no metadata table for title/description/image. This form only collects what the
// createEvent(eventId, maxSupply, expiration, isPublicMint) circuit actually accepts; the richer
// off-chain metadata fields from the old Paima-backed flow are intentionally not carried over
// (see the migration plan's "Known limitations" — adding that would mean changing the sibling
// indexer repo, out of scope here).
export default function CreateEvent() {
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();

  const [maxSupply, setMaxSupply] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [isPublicMint, setIsPublicMint] = useState(true);
  const [loading, setLoading] = useState(false);

  const isFormValid = () => Number(maxSupply) >= 0;

  const closeDrawer = () => {
    dispatch({ type: "CLOSE_DRAWER" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!provider) {
      errorFunction("Wallet Required", "Please connect your Lace wallet first.", "");
      return;
    }

    if (!isFormValid()) {
      errorFunction("Validation Error", "Maximum Supply must be 0 (unlimited) or greater.", "");
      return;
    }

    setLoading(true);
    try {
      const eventId = new Uint8Array(32);
      crypto.getRandomValues(eventId);

      const expiration = expirationDate
        ? BigInt(Math.floor(new Date(expirationDate).getTime() / 1000))
        : 0n;

      loadingFunction("Creating Event", "Please confirm the transaction in your Lace wallet…", "");

      const { txHash } = await provider.service.createEvent(
        eventId,
        BigInt(maxSupply || 0),
        expiration,
        isPublicMint,
      );

      closeDrawer();
      succesfullBlockchainCreation("Event Created Successfully", `Transaction: ${txHash}`, "");
    } catch (error) {
      console.error("Error creating event:", error);
      errorFunction(
        "Error",
        error.message || "An error occurred while creating the event. Please try again.",
        "",
      );
    } finally {
      setLoading(false);
    }
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
          <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold">
            Create POAP Event
          </h4>
        </div>
      </div>
      <div className="drawer-body">
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-12">
            <label className="form-label">
              Maximum Supply <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              className="form-control"
              placeholder="0 for unlimited"
              name="maxSupply"
              value={maxSupply}
              onChange={(event) => setMaxSupply(event.target.value)}
              required
              min="0"
            />
            <small className="form-text text-muted">
              Maximum number of SPOAPs that can be claimed for this event. 0 means unlimited.
            </small>
          </div>

          <div className="col-12">
            <label className="form-label">Expiration Date</label>
            <input
              type="date"
              className="form-control"
              name="expirationDate"
              value={expirationDate}
              onChange={(event) => setExpirationDate(event.target.value)}
            />
            <small className="form-text text-muted">
              Optional. Leave blank for no expiration.
            </small>
          </div>

          <div className="col-12 form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="isPublicMint"
              checked={isPublicMint}
              onChange={(event) => setIsPublicMint(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="isPublicMint">
              Public mint (anyone can claim without the organizer minting to them)
            </label>
          </div>
        </form>
      </div>
      <div className="drawer-footer">
        <Button
          type="submit"
          className="btn btn-gradient btn-block w-100"
          onClick={handleSubmit}
          disabled={loading || !isFormValid()}
        >
          {loading ? "Creating Event…" : "Create Event"}
        </Button>
      </div>
    </div>
  );
}
