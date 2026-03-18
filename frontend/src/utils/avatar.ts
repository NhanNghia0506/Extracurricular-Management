const AVATAR_PALETTE = [
    '#2563eb',
    '#0891b2',
    '#059669',
    '#7c3aed',
    '#ea580c',
    '#dc2626',
    '#4f46e5',
    '#0f766e',
];

export const buildInitials = (name?: string) => {
    const normalizedName = name?.trim();

    if (!normalizedName) {
        return '?';
    }

    const tokens = normalizedName.split(/\s+/).filter(Boolean);

    if (tokens.length >= 2) {
        const lastTwoTokens = tokens.slice(-2);
        return lastTwoTokens.map((token) => token[0]).join('').toUpperCase();
    }

    return normalizedName.slice(0, 2).toUpperCase();
};

export const buildAvatarBackgroundColor = (name?: string) => {
    const seed = (name || '?').split('').reduce((total, character) => total + character.charCodeAt(0), 0);
    return AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
};

export const resolveAvatarSrc = (avatar?: string | null): string | undefined => {
    if (!avatar || !avatar.trim()) {
        return undefined;
    }

    const normalized = avatar.trim();

    if (/^(https?:|data:|blob:)/i.test(normalized)) {
        return normalized;
    }

    if (normalized.startsWith('/')) {
        return normalized;
    }

    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
    return `${apiBaseUrl.replace(/\/$/, '')}/uploads/${normalized}`;
};
