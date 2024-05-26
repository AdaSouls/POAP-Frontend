import React, { useState, useContext } from 'react';
import { useDrawer } from '../contexts/drawer/drawer.provider.jsx';
import CardanoWallet from './views/cardanoWallet.jsx';
import EthereumWallet from './views/ethereumWallet.jsx';
import CreateSoul from './views/createSoul.jsx';
import CreatePoap from './views/createPoap.jsx';
import CreateSoulToken from './views/createSoulToken.jsx';

export const Drawer = () => {

  const state = useDrawer();

  
  const drawerComponent = (state) => {

    if (state?.showCardanoWallet === true) {
      return <CardanoWallet />;
    }

    if (state?.showEthereumWallet === true) {
      return <EthereumWallet />;
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

  };  

  return (
    
    <React.Fragment>  
      <div className={`drawer drawer-cart ${state?.open === true ? 'open' : ''}`}>
        {drawerComponent(state)}
      </div>
    </React.Fragment>

  );
};
