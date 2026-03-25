import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../../contexts/ToastContext';
import { ActivityCategory } from '../../services/activityCategory.service';
import styles from './category.form.module.scss';

interface CategoryFormProps {
    category?: ActivityCategory | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => Promise<void>;
    existingNames: string[];
}

const CategoryForm: React.FC<CategoryFormProps> = ({
    category,
    isOpen,
    onClose,
    onSubmit,
    existingNames,
}) => {
    const { showToast } = useToast();
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (category) {
            setName(category.name);
        } else {
            setName('');
        }
        setError('');
    }, [category, isOpen]);

    const validateForm = () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            return 'Tên danh mục không được để trống.';
        }

        // Check for duplicates (excluding current category if editing)
        const isDuplicate = existingNames.some(existingName =>
            existingName.toLowerCase() === trimmedName.toLowerCase() &&
            (!category || existingName !== category.name)
        );

        if (isDuplicate) {
            return 'Danh mục này đã tồn tại.';
        }

        return '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await onSubmit(name.trim());

            showToast({
                type: 'success',
                title: category ? 'Cập nhật danh mục thành công' : 'Tạo danh mục thành công',
                message: category ? 'Danh mục đã được cập nhật.' : 'Danh mục mới đã được tạo.',
            });

            setName('');
            onClose();
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
            setError(errorMsg);
            showToast({
                type: 'error',
                title: 'Thất bại',
                message: errorMsg,
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{category ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}</h2>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        disabled={submitting}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name">Tên danh mục *</label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Nhập tên danh mục"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            disabled={submitting}
                            maxLength={100}
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.cancelBtn}
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin /> Đang xử lý...
                                </>
                            ) : (
                                category ? 'Cập nhật' : 'Tạo'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryForm;
