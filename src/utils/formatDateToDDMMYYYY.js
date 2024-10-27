function formatDateToDDMMYYYY(dateToFormat) {
  const date = new Date(dateToFormat);
  // Extract day, month, and year from the date
  const day = String(date.getDate()).padStart(2, "0"); // Pad with '0' if needed
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const year = date.getFullYear();

  // Return formatted date string
  return `${day}/${month}/${year}`;
}

export default formatDateToDDMMYYYY;