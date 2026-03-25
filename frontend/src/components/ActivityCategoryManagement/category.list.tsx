import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ActivityCategory } from '../../services/activityCategory.service';
import styles from './category.list.module.scss';

interface CategoryListProps {
    categories: ActivityCategory[];
    loading: boolean;
    onEdit: (category: ActivityCategory) => void;
    onDelete: (category: ActivityCategory) => void;
    onAddNew: () => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
    categories,
    loading,
    onEdit,
    onDelete,
    onAddNew,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCategories = useMemo(() => {
        return categories.filter(cat =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [categories, searchQuery]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading && categories.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <FontAwesomeIcon icon={faSpinner} spin />
                <p>Đang tải danh mục...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.searchBox}>
                    <FontAwesomeIcon icon={faSearch} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm danh mục..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className={styles.addBtn} onClick={onAddNew}>
                    + Thêm danh mục mới
                </button>
            </div>

            {filteredCategories.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>
                        {categories.length === 0
                            ? 'Chưa có danh mục nào. Hãy tạo danh mục đầu tiên!'
                            : 'Không tìm thấy danh mục phù hợp.'}
                    </p>
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Tên danh mục</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map(category => (
                                <tr key={category._id}>
                                    <td className={styles.nameCell}>
                                        <span className={styles.categoryName}>{category.name}</span>
                                    </td>
                                    <td className={styles.dateCell}>
                                        {formatDate(category.createdAt)}
                                    </td>
                                    <td className={styles.actionCell}>
                                        <button
                                            className={styles.editBtn}
                                            onClick={() => onEdit(category)}
                                            title="Chỉnh sửa"
                                        >
                                            <FontAwesomeIcon icon={faPen} />
                                        </button>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => onDelete(category)}
                                            title="Xóa"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CategoryList;
