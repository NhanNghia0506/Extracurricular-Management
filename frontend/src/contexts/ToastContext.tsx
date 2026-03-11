import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';

export interface Toast {
    id: number;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);
const ToastActionsContext = createContext<Pick<ToastContextType, 'showToast' | 'removeToast'> | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextIdRef = useRef(1);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const nextId = nextIdRef.current;
        nextIdRef.current += 1;

        const newToast: Toast = {
            ...toast,
            id: nextId,
        };

        setToasts((prev) => [...prev, newToast]);

        // Tự động xóa toast sau 5 giây
        setTimeout(() => {
            removeToast(newToast.id);
        }, 5000);
    }, [removeToast]);

    const actionValue = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);
    const stateValue = useMemo(() => ({ toasts, showToast, removeToast }), [toasts, showToast, removeToast]);

    return (
        <ToastActionsContext.Provider value={actionValue}>
            <ToastContext.Provider value={stateValue}>
                {children}
            </ToastContext.Provider>
        </ToastActionsContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const useToastActions = () => {
    const context = useContext(ToastActionsContext);
    if (!context) {
        throw new Error('useToastActions must be used within a ToastProvider');
    }
    return context;
};
