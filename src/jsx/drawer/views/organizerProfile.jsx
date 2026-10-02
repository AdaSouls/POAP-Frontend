import { useEffect, useState } from "react";
import { UserRound, X } from "lucide-react";
import { useDrawer, useDrawerDispatch } from "../../contexts/drawer/drawer.provider";
import OrganizationProfileFields from "../../components/OrganizationProfileFields";
import { getOrganizerProfile, saveOrganizerProfile } from "../../../midnight/organizer-profile";

// Organizer profile (organizer-profile.ts): the details the create-event wizard prefills and every
// event's metadata copies. Edited here outside the wizard, opened from the wallet popup. Keyed by
// the connected identity, so another wallet or identity has its own profile.
export default function OrganizerProfile() {
  const { midnight } = useDrawer();
  const dispatch = useDrawerDispatch();
  const callerPk = midnight?.provider?.address;
  const [profile, setProfile] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(getOrganizerProfile(callerPk) ?? {});
  }, [callerPk]);

  const closeDrawer = () => dispatch({ type: "CLOSE_DRAWER" });

  const onChange = (next) => {
    setProfile(next);
    setSaved(false);
  };

  const onSave = (event) => {
    event.preventDefault();
    setProfile(saveOrganizerProfile(callerPk, profile));
    setSaved(true);
  };

  return (
    <div className="d-flex flex-column w-100 drawer-modal-inner">
      <div className="drawer-header">
        <button className="btn wallet-modal-close" onClick={closeDrawer} aria-label="close">
          <X size={15} />
        </button>
        <h4 className="text-center w-100 m-0 font-weight-semibold">
          <UserRound size={16} className="mr-2" style={{ verticalAlign: "-2px" }} />
          Organizer profile
        </h4>
      </div>

      <div className="drawer-body">
        {!callerPk ? (
          <p className="text-muted mb-0">Connect your wallet to edit your organizer profile.</p>
        ) : (
          <form onSubmit={onSave}>
            <p className="text-muted small">
              Shown publicly on events you create. Saved with your encrypted backup, so it follows your
              identity to other browsers.
            </p>
            <div className="row">
              <OrganizationProfileFields values={profile} onChange={onChange} showAddress />
            </div>
            {saved && (
              <div className="alert alert-success mt-3 mb-0" role="status">
                Saved. New events will use these details.
              </div>
            )}
            <button type="submit" className="btn btn-gradient w-100 mt-3">
              Save profile
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
