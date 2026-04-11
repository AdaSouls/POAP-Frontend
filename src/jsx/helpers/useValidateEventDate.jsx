import { useState, useEffect } from "react";

const useValidateEventDate = (eventInfo) => {
  const [isDateValid, setIsDateValid] = useState(false);

  // input date should be in the future to be valid
  const validateDate = () => {
    const currentDate = new Date();
    const inputDate = new Date(eventInfo.date);
    // Set time to start of day for fair comparison
    currentDate.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    setIsDateValid(inputDate >= currentDate);
  };

  useEffect(() => {
    validateDate();
  }, [eventInfo.date]);

  return { isDateValid };
};

export default useValidateEventDate;
