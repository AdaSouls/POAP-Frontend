import React from "react";
import underConstruct from "../../images/construct.png";
import Layout from "../layout/layout";

const Settingsprofile = () => {
  return (
    <Layout>
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

export default Settingsprofile;
