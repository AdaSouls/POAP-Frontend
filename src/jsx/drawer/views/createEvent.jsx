import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import eternlWallet from "../../../images/wallets/eternl.jpg";
import { useState } from "react";
import { Button } from "react-bootstrap";

export default function CreateEvent() {
  const [title, setTitle] = useState("");
  console.log("🚀 ~ CreateEvent ~ title:", title.length);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(false);
  const [expiryDate, setExpiryDate] = useState(new Date());
  // const [event, setEvent] = useState(false);
  // const [streamer, setStreamer] = useState(false);
  const [selectedIssuer, setSelectedIssuer] = useState("");
  const [issuers, setIssuers] = useState([
    {
      address: "0x9506ebF4eaD60D1E7025f12415Adf781DC4238b0",
      createdAt: "2024-08-15T12:20:01.183Z",
      email: "diegoscarpati@gmail.com",
      issuerIdInContract: 2,
      issuerUuid: "0ec65db6-56c6-4a55-9c4c-48ac468d33d6",
      name: "Front1",
      organization: "Frontend1",
      updatedAt: "2024-08-15T12:20:01.183Z",
    },
  ]);

  // const toggleEvent = () => {
  //   if (!event) {
  //     setEvent(true);
  //   } else {
  //     setEvent(false);
  //   }
  // };

  // const toggleStreamer = () => {
  //   if (!streamer) {
  //     setStreamer(true);
  //   } else {
  //     setStreamer(false);
  //   }
  // };

  const toggleDate = () => {
    if (!date) {
      setDate(true);
    } else {
      setDate(false);
    }
  };

  const state = useDrawer();
  console.log("🚀 ~ CreateEvent ~ state:", state);
  const dispatch = useDrawerDispatch();

  const address = state.ethereum.provider.address;

  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
  };

  const handleSelection = (event) => {
    console.log("🚀 ~ handleSelection ~ event.target:", event.target);
    setSelectedIssuer(event.target.value);
  };

  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    const createInfo = {
      issuerUuid: selectedIssuer,
      event: {
        title,
        description,
        city: "San Francisco",
        country: "USA",
        startDate: "2024-06-15T09:00:00Z",
        endDate: "2024-08-13T17:00:00Z",
        expiryDate: date ? expiryDate : undefined,
        year: 2024,
        eventUrl: "https://www.techinnovationsconf.com",
        virtualEvent: false,
        image: "https://www.example.com/event-image.jpg",
        secretCode: 12345,
        eventTemplateId: 101,
        email: "info@techinnovationsconf.com",
        requestedCodes: 500,
        privateEvent: true,
        purpose: "Networking and knowledge sharing",
        platform: "Eventbrite",
        amountOfAttendees: 300,
        account: "TechCon2024",
        eventType: "Virtual",
        poapType: "Poap",
        poapsToBeMinted: 50,
        mintedPoaps: 0,
      },
    };
    console.log("🚀 ~ handleSubmit ~ createInfo:", createInfo);
    fetch("http://localhost:8080/event/createAndApproveMock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createInfo),
    });
    closeDrawer();
    // navigate("/otp-2");
  };

  useEffect(() => {
    fetch(`http://localhost:8080/issuer/getAllByAddress?address=${address}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("🚀 ~ .then ~ data:", data);
        setIssuers(data);
      })
      .catch((err) => {
        console.log("🚀 ~ .then ~ err:", err);
      });
  }, []);

  return (
    <div className="d-flex flex-column w-100 h-100 p-3">
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
        <form
          name="myform"
          className="signin_validate row g-3"
          onSubmit={handleSubmit}
        >
          <div className="col-12">
            {/* <label className="form-label">Name</label> */}
            <input
              type="text"
              className="form-control"
              placeholder="Title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="col-12">
            {/* <label className="form-label">Type</label> */}
            <select className="form-select" onChange={handleSelection}>
              <option value="">Issuer</option>
              {issuers.length > 0 ? (
                issuers.map((issuer) => (
                  <option value={issuer.issuerUuid}>{issuer.name}</option>
                ))
              ) : (
                <option value={0}>{""}</option>
              )}
            </select>
          </div>
          <div className="col-12">
            {/* <label className="form-label">Name</label> */}
            <input
              type="text"
              className="form-control"
              // placeholder="Organization"
              name="organization"
              value={issuers[0].organization}
              readOnly
            />
          </div>
          <div className="col-12">
            {/* <label className="form-label">Description</label> */}
            <input
              type="text"
              className="form-control"
              placeholder="Description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          {/* <hr className="col-12 my-4 mb-2"></hr>
          <div className="col-10">
            <h6 className="py-2">Is it for an event?</h6>
          </div>
          <div className="col-2">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="flexSwitchCheckDefault"
                onClick={toggleEvent}
              />
            </div>
          </div>
          {event && (
            <div className="col-12">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-control"
                placeholder="Description"
                name="description"
              />
            </div>
          )} */}

          <hr className="col-12 my-3"></hr>
          <div className="col-10">
            <h6 className="py-2">Do you want an expiry date?</h6>
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
              {/* <label className="form-label">Symbol</label> */}
              <input
                type="date"
                className="form-control"
                placeholder="Date"
                name="expiryDate"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
              />
            </div>
          )}
          {/* <hr className="col-12 my-3"></hr>
          <div className="col-10">
            <h6 className="py-2">Are you a streamer?</h6>
          </div>
          <div className="col-2">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="flexSwitchCheckDefault"
                onClick={toggleStreamer}
              />
            </div>
          </div>
          {streamer && (
            <div className="col-12">
              <input
                type="text"
                className="form-control"
                placeholder="Description"
                name="description"
              />
            </div>
          )} */}
          <hr className="col-12 my-4 mt-3"></hr>
        </form>
      </div>
      <div className="drawer-footer">
        {/* <Link to={"#"} className="btn btn-gradient btn-block">
          Create
        </Link> */}
        <Button
          type="submit"
          className="btn btn-gradient btn-block"
          onClick={handleSubmit}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
