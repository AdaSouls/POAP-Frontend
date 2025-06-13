import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { createEventId } from "../../../utils/poapContractInteractions";
import useValidateEventDate from "../../helpers/useValidateEventDate";
import {
  createEventService,
  getAllEventsService,
} from "../../../services/paima.service";

export default function CreateEvent() {
  const {
    poapIssuer,
    ethereum: { provider },
  } = useDrawer();
  const dispatch = useDrawerDispatch();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(false);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const { isDateValid } = useValidateEventDate({ date: expiryDate });

  const [email, setEmail] = useState("");
  const [eventType, setEventType] = useState("");
  const [image, setImage] = useState("");
  const [poapsToBeMinted, setPoapsToBeMinted] = useState(0);
  const [poapType, setPoapType] = useState("");
  const [privateEvent, setPrivateEvent] = useState(false);
  const [requestedCodes, setRequestedCodes] = useState(0);
  const [virtualEvent, setVirtualEvent] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [account, setAccount] = useState("");
  const [amountOfAttendees, setAmountOfAttendees] = useState(0);
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [eventTemplateId, setEventTemplateId] = useState("");
  const [eventUrl, setEventUrl] = useState("");
  const [platform, setPlatform] = useState("");
  const [purpose, setPurpose] = useState("");
  const [secretCode, setSecretCode] = useState("");

  const toggleDate = () => {
    if (!date) {
      setDate(true);
    } else {
      setDate(false);
    }
  };

  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
  };

  const updateEvents = (events) => {
    dispatch({
      type: "UPDATE_EVENTS",
      payload: events,
    });
  };

  // const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    let miliseconds;
    let timestamp;
    if (!date) {
      // Timestamp for 19/10/2124 => "no expiration"
      timestamp = 4884970320;
    } else {
      miliseconds = new Date(expiryDate);
      timestamp = Math.floor(miliseconds.getTime() / 1000);
    }

    const eventMandatoryInfo = {
      description: description,
      email: email,
      endDate: endDate,
      eventType: eventType,
      expiryDate: date
        ? new Date(timestamp * 1000)
        : new Date(4884970320 * 1000),
      image: "https://example.com/event-image.png",
      issuerUuid: poapIssuer.issuerUuid,
      poapsToBeMinted: poapsToBeMinted,
      poapType: poapType,
      privateEvent: privateEvent,
      requestedCodes: requestedCodes,
      startDate: startDate,
      title: title,
      virtualEvent: virtualEvent,
      year: year,
    };
    const eventNonMandatoryInfo = {
      account: account || null,
      amountOfAttendees: amountOfAttendees || null,
      city: city || null,
      country: country || null,
      eventTemplateId: eventTemplateId || null,
      eventUrl: eventUrl || null,
      platform: platform || null,
      purpose: purpose || null,
      secretCode: secretCode || null,
    };
    const eventPayload = {
      ...eventMandatoryInfo,
      ...eventNonMandatoryInfo,
    };

    const createdEventOnDB = await createEventService(eventPayload);
    console.log("🚀 ~ handleSubmit ~ createdEventOnDB:", createdEventOnDB)
    if (!createdEventOnDB) {
      console.error("Error creating event on DB");
      return;
    } else {
      const createdEventOnBC = await createEventId(
        poapIssuer.issuerIdInContract,
        createdEventOnDB.eventIdInContract,
        createdEventOnDB.poapsToBeMinted,
        timestamp,
        provider.address,
        provider
      );
      console.log("🚀 ~ handleSubmit ~ createdEventOnBC:", createdEventOnBC);
    }
    // Wait for the event to be created on the blockchain an updated by Paima API
    setTimeout(async () => {
      const events = await getAllEventsService();
      updateEvents(events);
    }, 3000); 
    closeDrawer();
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
          <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold">
            Create POAP EVENT
          </h4>
        </div>
      </div>
      <div className="drawer-body">
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-12">
            <input
              type="text"
              className="form-control"
              placeholder="Title *"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="col-12">
            <input
              type="email"
              className="form-control"
              placeholder="Email *"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="col-12">
            <input
              type="text"
              className="form-control"
              placeholder="Description *"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </div>

          <div className="col-12">
            <select
              className="form-select"
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
              required
            >
              <option value="">Event Type *</option>
              <option value="conference">Conference</option>
              <option value="meetup">Meetup</option>
              <option value="workshop">Workshop</option>
              <option value="hackathon">Hackathon</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="col-12">
            <input
              type="url"
              className="form-control"
              placeholder="Event Image URL *"
              name="image"
              value={image}
              onChange={(event) => setImage(event.target.value)}
              required
            />
          </div>

          <div className="col-6">
            <label className="form-label">Start Date *</label>

            <input
              type="date"
              className="form-control"
              placeholder="Start Date *"
              name="startDate"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </div>

          <div className="col-6">
            <label className="form-label">End Date *</label>
            <input
              type="date"
              className="form-control"
              placeholder="End Date *"
              name="endDate"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              required
            />
          </div>

          <div className="col-6">
            <label className="form-label">POAPs to be Minted *</label>
            <input
              type="number"
              className="form-control"
              placeholder="POAPs to be Minted *"
              name="poapsToBeMinted"
              value={poapsToBeMinted}
              onChange={(event) =>
                setPoapsToBeMinted(Number.parseInt(event.target.value))
              }
              required
              min="1"
            />
          </div>

          <div className="col-6">
            <label className="form-label">Requested Codes *</label>
            <input
              type="number"
              className="form-control"
              placeholder="Requested Codes *"
              name="requestedCodes"
              value={requestedCodes}
              onChange={(event) =>
                setRequestedCodes(Number.parseInt(event.target.value))
              }
              required
              min="1"
            />
          </div>

          <div className="col-12">
            <select
              className="form-select"
              value={poapType}
              onChange={(event) => setPoapType(event.target.value)}
              required
            >
              <option value="">POAP Type *</option>
              <option value="physical">Physical</option>
              <option value="virtual">Virtual</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div className="col-12">
            <input
              type="number"
              className="form-control"
              placeholder="Year *"
              name="year"
              value={year}
              onChange={(event) => setYear(Number.parseInt(event.target.value))}
              required
              min="2020"
              max="2030"
            />
          </div>

          <hr className="col-12 my-3"></hr>
          <h3 className="col-12">Event Settings</h3>

          <div className="col-10">
            <h6 className="py-2">Private Event</h6>
          </div>
          <div className="col-2">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={privateEvent}
                onChange={(event) => setPrivateEvent(event.target.checked)}
              />
            </div>
          </div>

          <div className="col-10">
            <h6 className="py-2">Virtual Event</h6>
          </div>
          <div className="col-2">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={virtualEvent}
                onChange={(event) => setVirtualEvent(event.target.checked)}
              />
            </div>
          </div>

          <hr className="col-12 my-3"></hr>
          <h3 className="col-12">Optional Information</h3>

          <div className="col-12">
            <input
              type="text"
              className="form-control"
              placeholder="Account Address"
              name="account"
              value={account}
              onChange={(event) => setAccount(event.target.value)}
            />
          </div>

          <div className="col-6">
            <input
              type="text"
              className="form-control"
              placeholder="City"
              name="city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>

          <div className="col-6">
            <input
              type="text"
              className="form-control"
              placeholder="Country"
              name="country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            />
          </div>

          {/* Center the label vertically inside the div tag */}
          <div className="col-5 absolute d-flex align-items-center pl-3">
            <label className="form-label">Amount of Attendees:</label>
          </div>
          <div className="col-6">
            <input
              type="number"
              className="form-control"
              placeholder="Amount of Attendees"
              name="amountOfAttendees"
              value={amountOfAttendees}
              onChange={(event) =>
                setAmountOfAttendees(Number.parseInt(event.target.value))
              }
              min="0"
            />
          </div>

          <div className="col-12">
            <input
              type="text"
              className="form-control"
              placeholder="Event Template ID"
              name="eventTemplateId"
              value={eventTemplateId}
              onChange={(event) => setEventTemplateId(event.target.value)}
            />
          </div>

          <div className="col-12">
            <input
              type="url"
              className="form-control"
              placeholder="Event URL"
              name="eventUrl"
              value={eventUrl}
              onChange={(event) => setEventUrl(event.target.value)}
            />
          </div>

          <div className="col-12">
            <input
              type="text"
              className="form-control"
              placeholder="Platform"
              name="platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
            />
          </div>

          <div className="col-12">
            <input
              type="text"
              className="form-control"
              placeholder="Purpose"
              name="purpose"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
            />
          </div>

          <div className="col-12">
            <input
              type="text"
              className="form-control"
              placeholder="Secret Code"
              name="secretCode"
              value={secretCode}
              onChange={(event) => setSecretCode(event.target.value)}
            />
          </div>

          <hr className="col-12 my-3"></hr>
          <div className="col-10">
            <h6 className="py-2">
              Do you want an expiry date for the minting?
            </h6>
          </div>
          <div className="col-2">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="flexSwitchCheckDefault"
                onClick={toggleDate}
              />
            </div>
          </div>
          {date && (
            <div className="col-12">
              <input
                type="date"
                className="form-control"
                placeholder="Expiry Date"
                name="expiryDate"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
              />
            </div>
          )}
        </form>
      </div>
      <div className="drawer-footer">
        <Button
          type="submit"
          className="btn btn-gradient btn-block"
          onClick={handleSubmit}
          disabled={date ? !isDateValid : false}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
