import React from 'react';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import waiting from "../../../images/waiting.png";

export default function CheckCollection() {
  const { items } = useDrawer();
  const dispatch = useDrawerDispatch();

  const closeDrawer = () => {
    dispatch({
      type: 'CLOSE_DRAWER'
    });
  };  
  
  return (
    <div className="d-flex flex-column w-100 h-100 p-3">      
        <div className="drawer-header">
            <div className="d-flex justify-content-start">                  
                <button className="btn btn-close align-content-center px-1 mt-2 position-absolute" onClick={closeDrawer} aria-label="close" ></button>
                <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold"> Collection {items.name} </h4>
            </div>          
        </div>      
        <div className="drawer-body">
            <div className="row d-flex justify-content-center under-construct">            
                <img
                className="align-content-center m-0"
                src={waiting}
                alt=""
                />
                <h5 className="align-content-center m-0">Waiting for other owners to sign this collection</h5>                
                <p className='text-center pt-3'><span>ID: </span>{items.id}</p>
            </div>         
        </div>
        {/* <div className='drawer-footer'>
          <Link to={"#"} className="btn btn-gradient btn-block">
            Create
          </Link>
        </div> */}
    </div>
  );
}
