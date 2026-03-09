export function formatMessageTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const timeString = date.toLocaleTimeString('en-US', timeOptions);

    if (isToday) {
        return timeString; // e.g., "10:30 AM"
    } else if (isYesterday) {
        return `Yesterday, ${timeString}`;
    } else {
        const dateOptions = { month: 'short', day: 'numeric' };
        return `${date.toLocaleDateString('en-US', dateOptions)}, ${timeString}`; // e.g., "Oct 12, 10:30 AM"
    }
}