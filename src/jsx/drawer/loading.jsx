import loadingGif from "../../images/loading.gif";

export default function LoadingDrawer() {


  return(
    <div className="drawer-loading">
      <div className="inner-loading">
        <img                    
          src={ loadingGif }
          alt=""
        /> 
        <p>Loading</p>
      </div>      
    </div>
  );
}
