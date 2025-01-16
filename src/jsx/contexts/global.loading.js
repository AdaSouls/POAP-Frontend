import { createContext, useState } from "react";

const GloablLoadingContext = createContext();

const GlobalContextProvider = ({ children }) => {
  
  const [ globalLoading, setGlobalLoading ] = useState({
      loading: false,
      list:  []
  });

  const data = { globalLoading };

  return (
    <GloablLoadingContext.Provider value={data}>{children}</GloablLoadingContext.Provider>
  );
};

export { GlobalContextProvider };
export default GloablLoadingContext;