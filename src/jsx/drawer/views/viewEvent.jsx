import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { useNavigate } from "react-router-dom";
import EventBody from "../../components/eventBody";

export default function ViewEvent() {
  const {
    event,
  } = useDrawer();
  const dispatch = useDrawerDispatch();
  const navigate = useNavigate();

  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
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
          <button 
            className="btn btn-gradient btn-block"
            onClick={() => {
              navigate(`/poap-management?eventId=${event.event.eventId}`);
              closeDrawer();
            }}
          >
            View POAPs
          </button>
        </div>
      </div>
    </div>
  );
}
