export const formatDate = (dateString) => {
    // Pass through the "Unscheduled" label
    if (dateString === "Unscheduled") {
        return "Unscheduled";
    }
    try {
        const dateObj = new Date(dateString);
        // Check if the date is valid
        if (isNaN(dateObj.getTime())) {
            console.warn("Invalid date string provided to formatDate:", dateString);
            return dateString; // Return original string if invalid
        }
        
        // Format to "Day Month" (e.g., "30 October")
        const options = {
            day: 'numeric',   
            month: 'long',
            year: 'numeric'
        };
        // 'en-GB' (British English) is a good locale to ensure "30 October" format
        return dateObj.toLocaleDateString('en-GB', options);
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        return dateString; // Fallback to the original string
    }
};

export const parseDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
         return new Date(Date.UTC(1970, 0, 1)); // Fallback
    }

    // 1. Check for "dd/mm/yyyy" format
    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            // new Date(year, monthIndex, day)
            // We must use Date.UTC to create a UTC date
            const dateObj = new Date(Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])));
            if (!isNaN(dateObj)) return dateObj;
        }
    }

    // 2. If not "dd/mm/yyyy", try to parse as ISO string
    // This will correctly parse '2025-11-06T00:00:00.000Z'
    const dateObj = new Date(dateString);
    if (!isNaN(dateObj)) {
        // The object is created. Now, normalize it to UTC midnight.
        return new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
    }
    
    // Fallback if parsing fails
    return new Date(Date.UTC(1970, 0, 1)); 
};

export const getStatusBadge = (status) => {
    switch (status) {
        case 'Confirmed': return 'success';
        case 'Pending': return 'warning text-dark';
        case 'Cancelled': return 'danger';
        default: return 'secondary';
    }
};

export const getNextThursday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + daysUntilThursday);
    return nextThursday;
};