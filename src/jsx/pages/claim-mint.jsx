import React, { useEffect, useState, useCallback } from "react";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import PoapEvent from "../components/poapEvent";
import { checkEventsMintedByAddress } from "../../utils/poapHelpers";
import { getMyTokens } from "../../midnight/my-tokens";

const ClaimMint = () => {
  const { poapEvents, midnight: { provider } } = useDrawer();
  const [myTokens, setMyTokens] = useState([]);

  const loadMyTokens = useCallback(async () => {
    if (!provider) {
      setMyTokens([]);
      return;
    }
    try {
      const { privateState } = await provider.service.getState();
      const tokens = await getMyTokens(provider.service, poapEvents, privateState.tokens || {});
      setMyTokens(tokens);
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
  }, [provider, poapEvents]);

  useEffect(() => {
    loadMyTokens();
  }, [loadMyTokens]);

  const events = checkEventsMintedByAddress(poapEvents, myTokens);

  return (
    <Layout activeMenu={8}>
      <div className="card p-4 table-responsive">
        <table className="table table-small table-striped">
          <tbody>
            {poapEvents.length === 0 ? (
              <tr>
                <td>No events found</td>
              </tr>
            ) : (
              events.map((event, index) => (
                <PoapEvent
                  event={event}
                  index={index}
                  key={index}
                  mintable={true}
                  owned={event.isMinted}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default ClaimMint;
