import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import collectionMultisigImage from "../../../images/svg/collection-multisig.svg";
import tokenSoulMultisig from "../../../images/svg/soul-multisig.svg";
import formatDateToDDMMYYYY from "../../../utils/formatDateToDDMMYYYY";
import { mintToken } from "../../../utils/poapContractInteractions";
import { isPoapMintable } from "../../../utils/mitableChecks";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  createOwnerService,
  getOwnerPoapsService,
} from "../../../services/paima.service";
import EventBody from "../../components/eventBody";
import { 
  succesfullMessage, 
  errorFunction, 
  loadingFunction 
} from "../../toasts/sweetAlerts";
import { useState } from "react";
import dataSyncService from "../../../services/dataSync.service";

export default function ViewEvent() {
  const {
    event,
    ethereum: { provider },
    poapEvents,
    poapOwner,
  } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [loading, setLoading] = useState(false);

  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
  };

  const showEthereumWallet = () => {
    dispatch({
      type: "SHOW_ETHEREUM_WALLET",
    });
  };

  const updatePoaps = (poaps) => {
    dispatch({
      type: "UPDATE_POAPS",
      payload: poaps,
    });
  };

  const updateOwner = (owner) => {
    dispatch({
      type: "UPDATE_OWNER",
      payload: owner,
    });
  };

  const mintPoap = async (issuerId, eventId) => {
    setLoading(true);

    try {
      // Step 1: Create owner if doesn't exist
      if (!poapOwner) {
        console.log("🚀 ~ mintPoap ~ poapOwner:", poapOwner);
        loadingFunction("Creating Owner", "Setting up your account...", "");
        
        const newOwner = await createOwnerService({
          address: provider.address.toLowerCase(),
        });
        console.log("🚀 ~ mintPoap ~ newOwner:", newOwner);
        
        if (!newOwner) {
          errorFunction(
            "Error",
            "Failed to create owner account. Please try again.",
            ""
          );
          return;
        }
        
        console.log("🚀 ~ mintPoap ~ updating owner context");
        updateOwner(newOwner);
      }

      // Step 2: Mint POAP token on blockchain
      loadingFunction("Minting POAP", "Minting your POAP token...", "");
      const minting = await mintToken(
        issuerId,
        eventId,
        provider.address,
        provider
      );
      console.log("🚀 ~ mintPoap ~ minting:", minting);
      
      if (!minting) {
        errorFunction(
          "Error",
          "Failed to mint POAP token. Please try again.",
          ""
        );
        return;
      }

      // Step 3: Refresh POAPs list using data sync service
      try {
        await dataSyncService.refreshPoaps(updatePoaps);
      } catch (error) {
        console.error("Error refreshing POAPs:", error);
      }

      succesfullMessage(
        "POAP Minted Successfully",
        "Your POAP has been minted and added to your collection."
      );
      
      closeDrawer();
    } catch (error) {
      console.error("Error minting POAP:", error);
      errorFunction(
        "Error",
        "An error occurred while minting the POAP. Please try again.",
        ""
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a value should be displayed
  const hasValue = (value) => {
    return value !== null && value !== undefined && value !== "";
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
          <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold capitalize">
            Poap Event
          </h4>
        </div>
      </div>

      <div className="drawer-body">
        <EventBody event={event.event} />
      </div>

      <div className="drawer-footer">
        <div className="d-flex justify-content-center">
          {/* <Button
            className="btn btn-gradient btn-block"
            onClick={() => {
              if (!provider?.address) {
                showEthereumWallet();
              } else {
                mintPoap(
                  event.event.issuerId,
                  event.event.eventId
                );
              }
            }}
            disabled={loading || (!provider?.address ? false : !isPoapMintable(event.event))}
          >
            {loading
              ? "Minting..."
              : !provider?.address
              ? "Connect to wallet"
              : isPoapMintable(event.event)
              ? "Mint Poap"
              : "Already Minted"}
          </Button> */}
          <Link to={`/poap-management?eventId=${event.event.eventId}`}>
            <button className="btn btn-gradient btn-block">
              View POAPs
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
