type TimeValue = string | number | Date | null | undefined;

const toValidDate = (value: TimeValue): Date | null => {
    if (value === null || value === undefined || value === '') return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const formatTime = (value: TimeValue, fallback = '--:--'): string => {
    const date = toValidDate(value);
    if (!date) return fallback;
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
