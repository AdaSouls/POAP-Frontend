import React from "react";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import PoapEvent from "../components/poapEvent";
import { checkEventsMintedByAddress } from "../../utils/poapContractInteractions";

const ClaimMint = () => {
  const {
    poapEvents,
    poapCollection
  } = useDrawer();

  const events = checkEventsMintedByAddress(poapEvents, poapCollection)

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
