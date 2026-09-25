import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check } from "lucide-react";

// A link shown both ways: as a QR (scan it with any phone camera when you're together) and as
// text with a copy button (send it by chat or mail when you're not). Used for the credential
// invite and mint links (invite-links.ts). The QR sits on white: phone cameras read dark-on-light
// far more reliably than the inverted version.
export default function LinkQrCard({ url, label, hint }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="drawer-modal-preview-card link-qr-card">
      {label && <p className="m-0 small text-muted mb-2">{label}</p>}
      <div className="link-qr-card-code">
        <QRCodeSVG value={url} size={168} marginSize={2} bgColor="#ffffff" fgColor="#0b1437" title={label || "QR code"} />
      </div>
      <div className="d-flex align-items-center justify-content-between mt-3" style={{ gap: "8px" }}>
        <p className="m-0 text-break small link-qr-card-url">{url}</p>
        <button
          type="button"
          className="btn btn-card-detail-action btn-sm flex-shrink-0"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy link"}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      {hint && <p className="text-muted small mb-0 mt-2">{hint}</p>}
    </div>
  );
}
