import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDrawer, useDrawerDispatch } from '../contexts/drawer/drawer.provider.jsx';
import CardanoWallet from './views/cardanoWallet.jsx';
import LaceWallet from './views/laceWallet.jsx';
import CreateSoul from './views/createSoul.jsx';
import CreatePoap from './views/createPoap.jsx';
import CreateEvent from './views/createEvent.jsx';
import CreateSoulToken from './views/createSoulToken.jsx';
import CheckCollection from './views/checkCollection.jsx';
import ViewToken from './views/viewToken.jsx';
import CreateIssuer from './views/createIssuer.jsx';
import MintPoap from './views/mintPoap.jsx';
import GetHolderKey from './views/getHolderKey.jsx';
import RevealPrivateInfo from './views/revealPrivateInfo.jsx';

export const Drawer = () => {

  const state = useDrawer();
  const dispatch = useDrawerDispatch();

  const drawerComponent = (state) => {

    if (state?.showCardanoWallet === true) {
      return <CardanoWallet />;
    }

    if (state?.showMidnightWallet === true) {
      return <LaceWallet />;
    }

    if (state?.createSoul === true) {
      return <CreateSoul />;
    }
    if (state?.createSoulToken === true) {
      return <CreateSoulToken />;
    }

    if (state?.createPoap === true) {
      return <CreatePoap />;
    }

    if (state?.createEvent === true) {
      return <CreateEvent />;
    }

    if (state?.createIssuer === true) {
      return <CreateIssuer />;
    }

    if (state?.checkCollection === true) {
      return <CheckCollection />;
    }

    if (state?.viewToken === true) {
      return <ViewToken />;
    }

    if (state?.createMint === true) {
      return <MintPoap />;
    }

    if (state?.getHolderKey === true) {
      return <GetHolderKey />;
    }

    if (state?.revealPrivateInfo === true) {
      return <RevealPrivateInfo />;
    }

  };

  // Key names an active flag rather than any content from the view itself, so AnimatePresence
  // treats switching between views as a transition, but re-renders of the same view (e.g. a
  // token prop changing) don't replay the animation.
  const activeViewKey = [
    'showCardanoWallet', 'showMidnightWallet', 'createSoul', 'createSoulToken', 'createPoap',
    'createEvent', 'createIssuer', 'checkCollection', 'viewToken', 'createMint', 'getHolderKey',
    'revealPrivateInfo',
  ].find((flag) => state?.[flag] === true) || 'none';

  // CLOSE_DRAWER flips every view flag to false in the same dispatch as `open: false` (see the
  // reducer), so activeViewKey goes straight to 'none' the instant a close starts — before the
  // fade-out transition has even begun. Deriving the outer chrome (lateral vs. modal, solid vs.
  // glass, slide vs. fade) straight from that live key would snap it back to the lateral drawer's
  // geometry for a frame while it's still animating away. Track the last real view in a ref
  // (mutated during render, not an effect, so there's no extra render/lag) and keep using it for
  // the chrome once we're closing — activeViewKey itself still drives AnimatePresence's key so the
  // exit animation actually fires.
  const lastViewKeyRef = useRef(activeViewKey);
  if (activeViewKey !== 'none') {
    lastViewKeyRef.current = activeViewKey;
  }
  const isOpen = state?.open === true;
  const chromeViewKey = isOpen ? activeViewKey : lastViewKeyRef.current;

  // Views that end in a signed Midnight (or Cardano) transaction get the solid/trust treatment;
  // pure browsing/info views (viewToken) stay glass. The two Cardano-native views
  // sharing this same drawer container (showCardanoWallet, createSoul*) default to solid too —
  // they're also wallet/creation flows, and their content isn't being redesigned here.
  // Every MODAL_VIEWS member is excluded here (not just showMidnightWallet) — they all get their
  // own centered-modal glass treatment below instead of the solid lateral one. Functionally inert
  // either way (.drawer.drawer-modal's own background/border/shadow rule fully overrides the
  // drawer-solid/drawer-glass tone class), but kept consistent with the stated intent.
  const SOLID_VIEWS = ['showCardanoWallet', 'createSoul', 'createSoulToken'];
  const drawerTone = SOLID_VIEWS.includes(chromeViewKey) ? 'drawer-solid' : 'drawer-glass';

  // Views that opt out of the shared lateral drawer-cart layout in favor of a centered modal (see
  // .drawer-modal in theme-dark-glass.css) — every other view keeps sliding in from the side.
  // Started as just the Midnight wallet-connect popup; the four create/claim/mint forms joined it
  // once they got the same glass-popup treatment (short forms, don't need a full-height side
  // panel).
  const MODAL_VIEWS = [
    'showMidnightWallet', 'createPoap', 'createEvent', 'createIssuer', 'createMint', 'getHolderKey',
    'revealPrivateInfo',
  ];
  const isModalView = MODAL_VIEWS.includes(chromeViewKey);
  const drawerLayout = isModalView ? 'drawer-modal' : 'drawer-cart';

  // createEvent's metadata step (name/description/image dropzone/crop) needs real horizontal room
  // for a 2-column layout — every other modal view stays at the shared narrow width.
  const isWideModalView = chromeViewKey === 'createEvent';

  const closeDrawer = () => dispatch({ type: 'CLOSE_DRAWER' });

  // The modal's own fade is handled by the outer .drawer-modal's CSS opacity transition (driven
  // by the .open class) — modal-view content stays fully opaque here so there's only ever one
  // opacity animation running, not two independently-timed fades (this framer-motion one plus the
  // CSS one) stacking and visibly flickering against each other. Every other view still gets its
  // own x-slide fade since those don't have an outer CSS fade to double up with.
  const contentMotion = isModalView
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 16 } };

  return (

    <React.Fragment>
      {/* Gated on live isOpen, not the sticky chrome-view ref used below — that ref stays on the
          last real modal view forever after the modal's first open (on purpose, so the closing
          .drawer doesn't snap back to the lateral layout mid-fade-out), so gating this on it
          instead would leave a full-viewport transparent click-catcher mounted forever after the
          first close, silently blocking every click on the rest of the app until a hard refresh. */}
      {isOpen && isModalView && (
        <div className="drawer-modal-overlay" onClick={closeDrawer} aria-hidden="true"></div>
      )}
      <div className={`drawer ${drawerLayout} ${drawerTone} ${isWideModalView ? 'drawer-modal-wide' : ''} ${isOpen ? 'open' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeViewKey}
            className={isModalView ? 'drawer-modal-motion' : undefined}
            {...contentMotion}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
          >
            {drawerComponent(state)}
          </motion.div>
        </AnimatePresence>
      </div>
    </React.Fragment>

  );
};
