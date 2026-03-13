export function formatDate(date, locale = "en-US") {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(date));
}
export function formatDateTime(date, locale = "en-US") {
    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(date));
}
export function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    const intervals = [
        [31536000, "year"],
        [2592000, "month"],
        [86400, "day"],
        [3600, "hour"],
        [60, "minute"],
        [1, "second"],
    ];
    for (const [secs, unit] of intervals) {
        const interval = Math.floor(seconds / secs);
        if (interval >= 1)
            return `${interval} ${unit}${interval !== 1 ? "s" : ""} ago`;
    }
    return "just now";
}
//# sourceMappingURL=date.js.map