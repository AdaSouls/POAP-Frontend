import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { createOwnerService } from "../../../services/paima.service";

export default function CreateOwner() {
  const state = useDrawer();
  const dispatch = useDrawerDispatch();

  const [email, setEmail] = useState("");

  const closeDrawer = () => {
    dispatch({
      type: "CLOSE_DRAWER",
    });
  };

  const updateOwner = (owner) => {
    dispatch({
      type: "UPDATE_OWNER",
      payload: owner,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const createInfo = {
      email: email,
      address: state.ethereum.provider.address,
    };
    const createdOwnerOnDB = await createOwnerService(createInfo);
    if (!createdOwnerOnDB) {
      console.error("Error creating event on DB");
      return;
    } else {
      updateOwner(createdOwnerOnDB);
      console.log("Created owner on DB", createdOwnerOnDB);
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
              placeholder="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
