import { X } from "lucide-react";
import { useDrawer, useDrawerDispatch } from "../../contexts/drawer/drawer.provider";
import LinkQrCard from "../../components/LinkQrCard";

// Plain "here's a link, as text and as QR" popup (SHOW_LINK_QR, payload { title, intro, url, label,
// hint }). Opened from eventCard.jsx for a Credential event's invite link (invite-links.ts).
export default function LinkQrPopup() {
  const { linkQr } = useDrawer();
  const dispatch = useDrawerDispatch();
  const closeDrawer = () => dispatch({ type: "CLOSE_DRAWER" });

  return (
    <div className="d-flex flex-column w-100 drawer-modal-inner">
      <div className="drawer-header">
        <button className="btn wallet-modal-close" onClick={closeDrawer} aria-label="close">
          <X size={15} />
        </button>
        <h4 className="text-center w-100 m-0 font-weight-semibold">{linkQr?.title || "Link"}</h4>
      </div>

      <div className="drawer-body">
        {linkQr?.intro && <p className="text-muted small mb-3">{linkQr.intro}</p>}
        {linkQr?.url && <LinkQrCard url={linkQr.url} label={linkQr.label} hint={linkQr.hint} />}
      </div>

      <div className="drawer-footer d-flex flex-column">
        <button className="btn btn-card-detail-action" onClick={closeDrawer}>
          Done
        </button>
      </div>
    </div>
  );
}
