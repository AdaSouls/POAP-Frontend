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
import {
  createOwnerService,
  getOwnerPoapsService,
} from "../../../services/paima.service";
import EventBody from "../../components/eventBody";

export default function ViewEvent() {
  const {
    event,
    ethereum: { provider },
    poapEvents,
    poapOwner,
  } = useDrawer();
  const dispatch = useDrawerDispatch();

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
    if (!poapOwner) {
      console.log("🚀 ~ mintPoap ~ poapOwner:", poapOwner);
      const newOwner = await createOwnerService({
        address: provider.address.toLowerCase(),
      });
      console.log("🚀 ~ mintPoap ~ newOwner:", newOwner);
      if (!newOwner) {
        console.error("Error creating owner on DB");
        return;
      } else {
        console.log("🚀 ~ mintPoap ~ updating owner context");
        updateOwner(newOwner);
      }
    }
    const minting = await mintToken(
      issuerId,
      eventId,
      provider.address,
      provider
    );
    console.log("🚀 ~ mintPoap ~ minting:", minting);
    if (!minting) {
      console.error("Error minting POAP");
      return;
    } else {
      const poaps = await getOwnerPoapsService(provider.address.toLowerCase());
      updatePoaps(poaps);
    }
    closeDrawer();
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
          <Button
            className="btn btn-gradient btn-block"
            onClick={() => {
              if (!provider?.address) {
                showEthereumWallet();
              } else {
                mintPoap(
                  event.event.issuerIdInContract,
                  event.event.eventIdInContract
                );
              }
            }}
            disabled={!provider?.address ? false : !isPoapMintable(event.event)}
          >
            {!provider?.address
              ? "Connect to wallet"
              : isPoapMintable(event.event)
              ? "Mint Poap"
              : "Already Minted"}
          </Button>
        </div>
      </div>
    </div>
  );
}
