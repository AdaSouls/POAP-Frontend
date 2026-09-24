import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { packageFromLinkFragment, packageRootMatches } from "../../midnight/credential-delivery";
import { decodeValueHex, saveCredentialPackage } from "../../midnight/credential-store";

// Fallback delivery of a credential's private details (mintPoap.jsx → "Send the Private Link"),
// for holder codes without an encryption key. The package rides in the URL fragment (#…), which
// the browser never sends to any server. Saved only if it's addressed to the connected wallet's
// holder_pk for that organizer and its values rebuild the root committed on-chain at mint.
export default function CredentialImport() {
  const { midnight } = useDrawer();
  const service = midnight?.provider?.service;
  const [pkg] = useState(() => packageFromLinkFragment(window.location.hash || ""));
  const [status, setStatus] = useState(pkg ? "checking" : "invalid"); // checking | saved | wrong-wallet | mismatch | invalid

  useEffect(() => {
    if (!pkg || !service) return undefined;
    let cancelled = false;
    (async () => {
      const mine = await service.getHolderPkHex(Uint8Array.from(Buffer.from(pkg.issuerPk, "hex")));
      if (cancelled) return;
      if (mine.toLowerCase() !== pkg.holderPk.toLowerCase()) {
        setStatus("wrong-wallet");
        return;
      }
      if (!(await packageRootMatches(pkg))) {
        if (!cancelled) setStatus("mismatch");
        return;
      }
      saveCredentialPackage(pkg);
      if (!cancelled) setStatus("saved");
    })().catch((error) => {
      console.error("Error importing credential details:", error);
      if (!cancelled) setStatus("mismatch");
    });
    return () => {
      cancelled = true;
    };
  }, [pkg, service]);

  return (
    <Layout>
      <div className="role-subscriber">
        <div className="inner-header">
          <div className="inner-header-row">
            <h4 className="m-0">Credential Private Details</h4>
          </div>
        </div>
        <div className="row">
          <div className="col-12 col-lg-8">
            {status === "invalid" ? (
              <div className="alert alert-danger" role="alert">
                This link doesn't contain credential details. Ask the organizer to copy it again.
              </div>
            ) : !service ? (
              <div className="alert alert-info" role="alert">
                Connect the wallet this credential was issued to. The details are saved only after
                checking they're yours.
              </div>
            ) : status === "checking" ? (
              <p className="text-muted small">Checking…</p>
            ) : status === "wrong-wallet" ? (
              <div className="alert alert-danger" role="alert">
                This credential was issued to a different wallet. Connect the wallet whose key you
                gave the organizer.
              </div>
            ) : status === "mismatch" ? (
              <div className="alert alert-danger" role="alert">
                These details don't match what the organizer committed. Ask them to send the link
                again.
              </div>
            ) : (
              <div className="drawer-modal-preview-card">
                <p className="mb-3">Saved in this browser. You'll see them on the credential in My Subscriptions.</p>
                <ul className="list-unstyled mb-3 small">
                  {pkg.fields.map((field) => (
                    <li key={field.fieldId} className="mb-1">
                      <span className="text-muted">{field.label}: </span>
                      <span className="text-white">{decodeValueHex(field.valueHex)}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/app/my-subscriptions" className="btn btn-card-detail-action btn-sm">
                  Go to My Subscriptions
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
