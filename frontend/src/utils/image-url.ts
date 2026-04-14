export const resolveImageSrc = (value?: string | null): string | undefined => {
    const normalized = value?.trim();

    if (!normalized) {
        return undefined;
    }

    if (/^(https?:|data:|blob:)/i.test(normalized)) {
        return encodeURI(normalized);
    }

    const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL || window.location.origin).replace(/\/$/, '');
    const normalizedPath = normalized.startsWith('/')
        ? normalized
        : normalized.startsWith('uploads/')
            ? `/${normalized}`
            : `/uploads/${normalized}`;

    return encodeURI(`${apiBaseUrl}${normalizedPath}`);
};