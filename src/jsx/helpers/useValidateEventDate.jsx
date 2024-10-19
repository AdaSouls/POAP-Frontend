import { useState, useEffect } from "react";

const useValidateEventDate = (eventInfo) => {
  const [isDateValid, setIsDateValid] = useState(false);

  // input date should be 7 days from now to be valid
  const validateDate = () => {
    const currentDate = new Date();
    const inputDate = new Date(eventInfo.date);
    const sevenDaysFromNow = new Date(
      currentDate.setDate(currentDate.getDate() + 7)
    );
    setIsDateValid(inputDate >= sevenDaysFromNow);
  };

  useEffect(() => {
    validateDate();
  }, [eventInfo.date]);

  return { isDateValid };
};

export default useValidateEventDate;
