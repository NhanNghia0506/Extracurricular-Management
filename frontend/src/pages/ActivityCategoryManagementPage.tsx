import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useActivityCategories } from '../hooks/useActivityCategories';
import { useToast } from '../contexts/ToastContext';
import { ActivityCategory } from '../services/activityCategory.service';
import CategoryList from '../components/ActivityCategoryManagement/category.list';
import CategoryForm from '../components/ActivityCategoryManagement/category.form';
import styles from '../components/ActivityCategoryManagement/management.module.scss';

const ActivityCategoryManagement: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { categories, loading, createCategory, updateCategory, deleteCategory, fetchCategories } = useActivityCategories();

    const [formOpen, setFormOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<ActivityCategory | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleOpenCreateForm = () => {
        setSelectedCategory(null);
        setFormOpen(true);
    };

    const handleOpenEditForm = (category: ActivityCategory) => {
        setSelectedCategory(category);
        setFormOpen(true);
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setSelectedCategory(null);
    };

    const handleFormSubmit = async (name: string) => {
        try {
            if (selectedCategory) {
                await updateCategory(selectedCategory._id, name);
            } else {
                await createCategory(name);
            }
            handleCloseForm();
            await fetchCategories();
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    const handleDeleteClick = (category: ActivityCategory) => {
        setCategoryToDelete(category);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!categoryToDelete) return;

        setDeleting(true);
        try {
            await deleteCategory(categoryToDelete._id);

            showToast({
                type: 'success',
                title: 'Xóa danh mục thành công',
                message: `Danh mục "${categoryToDelete.name}" đã được xóa.`,
            });

            setShowDeleteConfirm(false);
            setCategoryToDelete(null);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Không thể xóa danh mục';
            showToast({
                type: 'error',
                title: 'Xóa thất bại',
                message: errorMsg,
            });
        } finally {
            setDeleting(false);
        }
    };

    const categoryNames = categories.map(cat => cat.name);

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <button
                    type="button"
                    className={styles.backButton}
                    onClick={() => navigate(-1)}
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Quay lại</span>
                </button>

                <div className={styles.heroContent}>
                    <div>
                        <p className={styles.eyebrow}>Admin Panel</p>
                        <h1>Quản lý danh mục hoạt động</h1>
                        <p className={styles.heroText}>
                            Thêm, sửa hoặc xóa danh mục hoạt động để tổ chức các hoạt động theo chủ đề.
                        </p>
                    </div>
                </div>
            </div>

            <div className={styles.content}>
                <CategoryList
                    categories={categories}
                    loading={loading}
                    onEdit={handleOpenEditForm}
                    onDelete={handleDeleteClick}
                    onAddNew={handleOpenCreateForm}
                />
            </div>

            <CategoryForm
                category={selectedCategory}
                isOpen={formOpen}
                onClose={handleCloseForm}
                onSubmit={handleFormSubmit}
                existingNames={categoryNames}
            />

            {showDeleteConfirm && categoryToDelete && (
                <div className={styles.confirmOverlay} onClick={() => !deleting && setShowDeleteConfirm(false)}>
                    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.confirmIcon}>
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                        </div>
                        <h3>Xác nhận xóa danh mục</h3>
                        <p>Bạn có chắc chắn muốn xóa danh mục "<strong>{categoryToDelete.name}</strong>"?</p>
                        <p className={styles.warning}>
                            Hành động này không thể hoàn tác. Nếu danh mục đang được sử dụng bởi các hoạt động,
                            hoạt động đó sẽ không còn danh mục nữa.
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className={styles.deleteBtn}
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityCategoryManagement;
