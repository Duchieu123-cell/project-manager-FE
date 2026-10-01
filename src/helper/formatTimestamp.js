export default function formatTimestamp(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Thời gian không hợp lệ';

    // Định dạng theo múi giờ 'Asia/Ho_Chi_Minh' (UTC+7)
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    
    const parts = formatter.formatToParts(date);
    const getPart = (type) => parts.find((p) => p.type === type)?.value || "";

    const hour = getPart("hour");
    const minute = getPart("minute");
    const day = getPart("day");
    const month = getPart("month");
    const year = getPart("year");

    return `${hour}:${minute} - ${day}/${month}/${year}`;
}

