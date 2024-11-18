import { useDrawer } from "../contexts/drawer/drawer.provider";
import PoapEvent from "./poapEvent";
import eventNormal from "../../images/svg/event-normal.svg";
import circlePlus from "../../icons/svg/circle-plus.svg";
import walletStatus from "../../images/collections/wallet-status.png";

const PoapEvents = ({ addressEvents }) => {
  const {
    poapEvents,
    ethereum: { provider },
  } = useDrawer();

  return (
    <>
      {provider ? (
        <table className="table table-striped table-small responsive-table">
          {poapEvents.length > 0 ? (
            <tbody>
              {addressEvents.map((event, index) => {
                return <PoapEvent event={event} index={index} key={index}/>;
              })}
            </tbody>
          ) : (
            <tbody>
              <tr>
                <td className="table-image">
                  <img
                    className="rounded-circle"
                    src={eventNormal}
                    width="47"
                    height="47"
                    alt=""
                  />
                </td>
                <td>Loading...</td>
                <td className="table-press-icon">
                  <div className="table-link">
                    <img src={circlePlus} width="30" height="30" alt="" />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="table-image">
                  <img
                    className="rounded-circle"
                    src={eventNormal}
                    width="47"
                    height="47"
                    alt=""
                  />
                </td>
                <td>Loading...</td>
                <td className="table-press-icon">
                  <div className="table-link">
                    <img src={circlePlus} width="30" height="30" alt="" />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="table-image">
                  <img
                    className="rounded-circle"
                    src={eventNormal}
                    width="47"
                    height="47"
                    alt=""
                  />
                </td>
                <td>Loading...</td>
                <td className="table-press-icon">
                  <div className="table-link">
                    <img src={circlePlus} width="30" height="30" alt="" />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="table-image">
                  <img
                    className="rounded-circle"
                    src={eventNormal}
                    width="47"
                    height="47"
                    alt=""
                  />
                </td>
                <td>Loading...</td>
                <td className="table-press-icon">
                  <div className="table-link">
                    <img src={circlePlus} width="30" height="30" alt="" />
                  </div>
                </td>
              </tr>
            </tbody>
          )}
        </table>
      ) : (
        <div className="wallet-non-connected">
          <img src={walletStatus} width="150" height="140" alt="" />
        </div>
      )}
    </>
  );
};

export default PoapEvents;
