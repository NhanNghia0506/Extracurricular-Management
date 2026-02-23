import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import styles from './notification.system.module.scss';

interface ToastItemProps {
    id: number;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
    onClose: (id: number) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ id, type, title, message, actionText, onAction, onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <i className="fa-solid fa-circle-check"></i>;
            case 'error': return <i className="fa-solid fa-triangle-exclamation"></i>;
            case 'info': return <i className="fa-solid fa-circle-info"></i>;
        }
    };

    return (
        <div className={`${styles.toast} ${styles[type]}`}>
            <div className={styles.closeBtn} onClick={() => onClose(id)}>
                <i className="fa-solid fa-xmark"></i>
            </div>
            <div className={styles.iconContainer}>{getIcon()}</div>
            <div className={styles.content}>
                <h5>{title}</h5>
                <p>{message}</p>

                {type === 'success' && actionText && (
                    <button className={styles.actionLink} onClick={onAction}>
                        {actionText} <i className="fa-solid fa-arrow-right"></i>
                    </button>
                )}

                {type === 'error' && (
                    <button className={styles.actionBtn} onClick={onAction}>
                        <i className="fa-solid fa-rotate"></i> {actionText || 'Retry'}
                    </button>
                )}
            </div>
        </div>
    );
};

const NotificationSystem: React.FC = () => {
    const { toasts, removeToast } = useToast();

    console.log('🔔 NotificationSystem render, toasts count:', toasts.length);

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className={styles.modalStack}>
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    id={toast.id}
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    actionText={toast.actionText}
                    onAction={toast.onAction}
                    onClose={removeToast}
                />
            ))}
        </div>
    );
};

export default NotificationSystem;