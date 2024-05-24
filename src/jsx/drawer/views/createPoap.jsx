import React from 'react';
import { Link } from 'react-router-dom';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import eternlWallet from "../../../images/wallets/eternl.jpg";
import { useState, useNavigate } from 'react';

export default function CreatePoap() {

  const [event, setEvent] = useState(false);
  const [streamer, setStreamer] = useState(false);

  const toggleEvent = () => {
    if (!event){
      setEvent(true)
    } else {
      setEvent(false)
    }
  }; 
  
  const toggleStreamer = () => {
    if (!streamer){
      setStreamer(true)
    } else {
      setStreamer(false)
    }
  }; 

  const state = useDrawer();
  const dispatch = useDrawerDispatch();

  const closeDrawer = () => {
    dispatch({
      type: 'CLOSE_DRAWER'
    });
  };  

  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/otp-2");
  };
  
  return (
    <div className="d-flex flex-column w-100 h-100 p-3">      
        <div className="drawer-header">
          <div className="d-flex justify-content-start">                  
            <button
              className="btn btn-close align-content-center px-1 mt-2 position-absolute"
              onClick={closeDrawer}
              aria-label="close"
            >                        
            </button>
            <h4            
              className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold"
            >
              Create SOUL
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
              />
            </div>
            <div className="col-12">
              {/* <label className="form-label">Symbol</label> */}
              <input
                type="text"
                className="form-control"
                placeholder="Symbol"
                name="symbol"
              />
            </div>
            <div className="col-12">
              {/* <label className="form-label">Description</label> */}
              <input
                type="text"
                className="form-control"
                placeholder="Description"
                name="description"
              />
            </div>
            <div className="col-12">
              {/* <label className="form-label">Type</label> */}
              <select className="form-select">
                <option value="">Choose a Type...</option>
                <option value="">Normal</option>
              </select>
            </div>
            <hr className='col-12 my-4 mb-2'></hr>
            <div className="col-10">
              <h6
                className="py-2"                
              >
                Is it for an event ?
              </h6> 
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
            {event &&
              <div className="col-12">
                {/* <label className="form-label">Description</label> */}
                <input
                  type="text"
                  className="form-control"
                  placeholder="Description"
                  name="description"
                />
              </div> 
            }
            
            <hr className='col-12 my-3'></hr> 
            <div className="col-10">
              <h6
                className="py-2"                
              >
                Are you streamer ?
              </h6> 
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
            {streamer &&
              <div className="col-12">
                {/* <label className="form-label">Description</label> */}
                <input
                  type="text"
                  className="form-control"
                  placeholder="Description"
                  name="description"
                />
              </div> 
            }
            <hr className='col-12 my-4 mt-3'></hr>                      
          </form>
        </div>
        <div className='drawer-footer'>
          <Link to={"#"} className="btn btn-gradient btn-block">
            Create
          </Link>
        </div>
    </div>
  );
}
