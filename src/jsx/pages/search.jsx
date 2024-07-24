import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../layout/layout";
import underConstruct from "../../images/construct.png";

const Search = () => {
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [show2, setShow2] = useState(false);
  const handleClose2 = () => setShow2(false);
  const handleShow2 = () => {
    setShow(false);
    setShow2(true);
  };
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/verify-step-2");
  };
  return (
    <Layout activeMenu={2}>
      <div className="row d-flex justify-content-center under-construct">
        
          <img
          className="align-content-center m-0"
          src={underConstruct}
          alt=""
          />
          <h5 className="align-content-center m-0">Section under construction</h5>
        
      </div>      
    </Layout>
  );
};

export default Search;
