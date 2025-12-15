  // Helper function to format the time range
export const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long', 
      day: '2-digit', 
      month: 'short', // 'short' (Dec) is often better than 'numeric' (12) for quick reading
      year: 'numeric'
    }).format(date);
};
  
export const formatTimeRange = (dateStr, startStr, endStr) => {
      //"20:00:00+00"
    // 1. Combine date and time to create a valid Date object
    // We split by '+' to ensure we have a clean ISO time string if needed, 
    // or we can rely on JS Date parsing if the format is consistent.
    // Ideally: "2025-12-04T20:00:00"
    const startDate = new Date(`${dateStr}T${startStr.split('+')[0]}`);
    const endDate = new Date(`${dateStr}T${endStr.split('+')[0]}`);

    // 2. Format options for 8:00 PM
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };

    // 3. Return the formatted range
    return `${startDate.toLocaleTimeString('en-GB', options)} - ${endDate.toLocaleTimeString('en-GB', options)}`;
};
  
export const formatCurrency = (amount) => {
      if (amount === 0) return "-";
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };