import React, { useState } from "react";
import Layout from "../layout/layout";
import underConstruct from "../../images/construct.png";

const Search = () => {

  return (
    <Layout activeMenu={2}>
      <div className="row d-flex justify-content-center under-construct mt-8">
        
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
