import React, { useEffect, useMemo, useState } from 'react';
import styles from './user.avatar.module.scss';

interface UserAvatarProps {
    src?: string | null;
    name?: string;
    alt?: string;
    className?: string;
}

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

const buildInitials = (name?: string) => {
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

const buildBackgroundColor = (name?: string) => {
    const seed = (name || '?').split('').reduce((total, character) => total + character.charCodeAt(0), 0);
    return AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
};

const UserAvatar: React.FC<UserAvatarProps> = ({ src, name, alt, className }) => {
    const [hasImageError, setHasImageError] = useState(false);

    useEffect(() => {
        setHasImageError(false);
    }, [src]);

    const initials = useMemo(() => buildInitials(name), [name]);
    const backgroundColor = useMemo(() => buildBackgroundColor(name), [name]);
    const avatarLabel = alt || name || 'User avatar';

    return (
        <span className={`${styles.avatarRoot} ${className || ''}`.trim()} aria-label={avatarLabel}>
            {src && !hasImageError ? (
                <img
                    src={src}
                    alt={avatarLabel}
                    className={styles.image}
                    onError={() => setHasImageError(true)}
                />
            ) : (
                <span
                    className={styles.fallback}
                    style={{ backgroundColor }}
                    aria-hidden="true"
                >
                    {initials}
                </span>
            )}
        </span>
    );
};

export default UserAvatar;