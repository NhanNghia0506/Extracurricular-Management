import React, { useEffect, useMemo, useState } from 'react';
import styles from './user.avatar.module.scss';
import {
    buildAvatarBackgroundColor,
    buildInitials,
    resolveAvatarSrc,
} from '../../utils/avatar';

interface UserAvatarProps {
    src?: string | null;
    name?: string;
    alt?: string;
    className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ src, name, alt, className }) => {
    const [hasImageError, setHasImageError] = useState(false);
    const resolvedSrc = useMemo(() => resolveAvatarSrc(src), [src]);

    useEffect(() => {
        setHasImageError(false);
    }, [resolvedSrc]);

    const initials = useMemo(() => buildInitials(name), [name]);
    const backgroundColor = useMemo(() => buildAvatarBackgroundColor(name), [name]);
    const avatarLabel = alt || name || 'User avatar';

    return (
        <span className={`${styles.avatarRoot} ${className || ''}`.trim()} aria-label={avatarLabel}>
            {resolvedSrc && !hasImageError ? (
                <img
                    src={resolvedSrc}
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