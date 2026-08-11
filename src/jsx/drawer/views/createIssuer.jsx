import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { X } from "lucide-react";
import { useUserRoles } from "../../contexts/user-roles/user-roles.provider";
import {
  succesfullBlockchainCreation,
  errorFunction,
  loadingFunction,
} from "../../toasts/sweetAlerts";

// registerIssuer(issuerPk) is admin-only on-chain (poap.compact: `assert is_admin()`) — there is no
// self-service "become an organizer" flow on Midnight, unlike the old Paima-backed signup form.
// Non-admins get a "contact the admin" message instead of a form they can't actually submit.
export default function CreateIssuer() {
  const { midnight } = useDrawer();
  const { isAdmin } = useUserRoles();
  const dispatch = useDrawerDispatch();

  const [issuerPkHex, setIssuerPkHex] = useState("");
  const [loading, setLoading] = useState(false);

  const closeDrawer = () => {
    dispatch({ type: "CLOSE_DRAWER" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!midnight?.provider) return;

    if (!/^[0-9a-fA-F]{64}$/.test(issuerPkHex.trim())) {
      errorFunction(
        "Invalid Public Key",
        "Issuer public key must be a 32-byte hex string (64 hex characters).",
        ""
      );
      return;
    }

    setLoading(true);
    try {
      loadingFunction("Registering Issuer", "Please confirm the transaction in your Lace wallet…", "");
      const issuerPk = Uint8Array.from(Buffer.from(issuerPkHex.trim(), "hex"));
      const { txHash } = await midnight.provider.service.registerIssuer(issuerPk);

      succesfullBlockchainCreation("Issuer Registered", `Transaction: ${txHash}`, "");
      closeDrawer();
    } catch (error) {
      console.error("Error registering issuer:", error);
      errorFunction("Error", error.message || "Failed to register issuer. Please try again.", "");
    } finally {
      setLoading(false);
    }
  };

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
          Register Issuer
        </h4>
      </div>
      <div className="drawer-body">
        {isAdmin ? (
          <form
            name="registerIssuerForm"
            className="signin_validate row g-3"
            onSubmit={handleSubmit}
          >
            <div className="col-12">
              <label className="form-label">Issuer Public Key (hex)</label>
              <input
                type="text"
                className="form-control"
                placeholder="64-character hex public key"
                name="issuerPkHex"
                value={issuerPkHex}
                onChange={(event) => setIssuerPkHex(event.target.value)}
                required
              />
              <small className="form-text text-muted">
                The Midnight public key of the organizer wallet you're authorizing. Ask them for
                their address from the Wallet page.
              </small>
            </div>
          </form>
        ) : (
          <div className="alert alert-info" role="alert">
            Registering event organizers is an admin-only action on this contract. Contact the
            AdaSouls admin to be added as an organizer.
          </div>
        )}
      </div>
      {isAdmin && (
        <div className="drawer-footer">
          <Button
            type="submit"
            className="btn btn-gradient btn-block"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Registering…" : "Register"}
          </Button>
        </div>
      )}
    </div>
  );
}
