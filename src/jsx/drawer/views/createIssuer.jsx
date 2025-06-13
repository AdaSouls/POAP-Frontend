import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { createIssuerService } from "../../../services/paima.service";
import { succesfullMessage } from "../../toasts/sweetAlerts";

export default function CreateIssuer() {
  const state = useDrawer();
  const dispatch = useDrawerDispatch();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");

  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
  };

  const updateIssuer = (issuer) => {
    dispatch({
      type: "UPDATE_ISSUER",
      payload: issuer,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const createInfo = {
      email: email,
      name: name,
      organization: organization,
      address: state.ethereum.provider.address.toLowerCase(),
    };
    const createdIssuerOnDB = await createIssuerService(createInfo);
    if (!createdIssuerOnDB) {
      console.error("Error creating event on DB");
      return;
    } else {
      updateIssuer(createdIssuerOnDB);
      succesfullMessage(
        "Issuer created successfully",
        "You can now create POAP events."
      );
      console.log("Created issuer on DB", createdIssuerOnDB);
    }
    closeDrawer();
  };

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
            Create ISSUER
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
              placeholder="Name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="col-12">
            {/* <label className="form-label">Name</label> */}
            <input
              type="text"
              className="form-control"
              placeholder="Email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="col-12">
            {/* <label className="form-label">Description</label> */}
            <input
              type="text"
              className="form-control"
              placeholder="Organization"
              name="organization"
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
              required
            />
          </div>
          <hr className="col-12 my-4 mt-3"></hr>
        </form>
      </div>
      <div className="drawer-footer">
        <Button
          type="submit"
          className="btn btn-gradient btn-block"
          onClick={handleSubmit}
          // disabled={date ? !isDateValid : false}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
