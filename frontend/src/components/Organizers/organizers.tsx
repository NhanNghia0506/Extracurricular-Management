import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import {
    faPlusCircle, faSearch, faSlidersH,
    faEnvelope, faPhoneAlt, faChevronDown, faBuildingUser
} from '@fortawesome/free-solid-svg-icons';
import authService from '../../services/auth.service';
import organizerService from '../../services/organizer.service';
import type { Organizer } from '../../types/organizer.types';
import styles from './organizers.module.scss';

const buildOrganizerImageUrl = (image?: string) => {
    if (!image) {
        return '';
    }

    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    const baseUrl = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    return `${baseUrl}/uploads/${image}`;
};

const normalizeOrganizer = (item: Organizer & { _id?: string }) => ({
    id: item.id || item._id || '',
    name: item.name || 'Chưa có tên ban tổ chức',
    email: item.email || 'Chưa cập nhật email',
    phone: item.phone || 'Chưa cập nhật số điện thoại',
    description: item.description || '',
    image: buildOrganizerImageUrl(item.image),
    approvalStatus: item.approvalStatus || 'PENDING',
});

const getApprovalLabel = (approvalStatus: string) => {
    switch (approvalStatus) {
        case 'APPROVED':
            return 'Đã duyệt';
        case 'REJECTED':
            return 'Bị từ chối';
        default:
            return 'Chờ duyệt';
    }
};

const Organizers: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN';
    const [searchTerm, setSearchTerm] = useState('');
    const [organizers, setOrganizers] = useState<Array<ReturnType<typeof normalizeOrganizer>>>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchOrganizers = async () => {
            setLoading(true);
            setErrorMessage('');

            try {
                const response = await organizerService.getAll();
                const payload = Array.isArray(response.data?.data)
                    ? response.data.data
                    : Array.isArray(response.data)
                        ? response.data
                        : [];

                setOrganizers(payload.map((item: Organizer & { _id?: string }) => normalizeOrganizer(item)));
            } catch (error) {
                console.error('Lỗi tải danh sách ban tổ chức:', error);
                setErrorMessage('Không thể tải danh sách ban tổ chức. Vui lòng thử lại sau.');
                setOrganizers([]);
            } finally {
                setLoading(false);
            }
        };

        void fetchOrganizers();
    }, []);

    const filteredOrganizers = useMemo(() => {
        const normalizedKeyword = searchTerm.trim().toLowerCase();

        if (!normalizedKeyword) {
            return organizers;
        }

        return organizers.filter((organizer) => {
            return [organizer.name, organizer.email, organizer.phone, getApprovalLabel(organizer.approvalStatus)]
                .some((value) => value.toLowerCase().includes(normalizedKeyword));
        });
    }, [organizers, searchTerm]);

    return (
        <div className={styles.container}>
            {/* 1. Header */}
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Danh sách ban tổ chức</h1>
                    <p>Kết nối với các câu lạc bộ, khoa và đơn vị quản lý hoạt động trong toàn trường.</p>
                </div>
                <div className={styles.headerActions}>
                    {isAdmin && (
                        <button className={styles.btnSecondary} onClick={() => navigate('/organizer-approval')}>
                            Duyệt ban tổ chức
                        </button>
                    )}
                    <button className={styles.btnRegister} onClick={() => navigate('/create-organizer')}>
                        <FontAwesomeIcon icon={faPlusCircle} /> Đăng ký ban tổ chức
                    </button>
                </div>
            </header>

            {/* 2. Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm ban tổ chức theo tên, email hoặc số điện thoại..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>
                <div className={styles.dropdowns}>
                    <div className={styles.selectBox}>
                        <span>Tổng số: <strong>{organizers.length}</strong></span>
                        <FontAwesomeIcon icon={faChevronDown} />
                    </div>
                    <div className={styles.selectBox}>
                        <span>Hiển thị: <strong>{filteredOrganizers.length}</strong></span>
                        <FontAwesomeIcon icon={faChevronDown} />
                    </div>
                    <button className={styles.btnAdvanced} type="button" onClick={() => setSearchTerm('')}>
                        <FontAwesomeIcon icon={faSlidersH} /> Xóa bộ lọc
                    </button>
                </div>
            </div>

            {/* 3. Grid List */}
            {loading ? (
                <div className={styles.statePanel}>Đang tải danh sách ban tổ chức...</div>
            ) : errorMessage ? (
                <div className={styles.statePanel}>{errorMessage}</div>
            ) : filteredOrganizers.length === 0 ? (
                <div className={styles.statePanel}>Không tìm thấy ban tổ chức phù hợp.</div>
            ) : (
                <div className={styles.directoryGrid}>
                    {filteredOrganizers.map((org) => (
                        <div key={org.id} className={styles.organizerCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.logoBadge}>
                                    {org.image ? (
                                        <img src={org.image} alt={org.name} className={styles.logoImage} />
                                    ) : (
                                        <FontAwesomeIcon icon={faBuildingUser} />
                                    )}
                                </div>
                                <div className={styles.badgeInfo}>
                                    <span className={styles.typeTag}>{getApprovalLabel(org.approvalStatus)}</span>
                                    <h3>{org.name}</h3>
                                    <span className={styles.facultyName}>Ban tổ chức trong hệ thống</span>
                                </div>
                            </div>

                            <div className={styles.contactInfo}>
                                <div className={styles.infoRow}>
                                    <FontAwesomeIcon icon={faEnvelope} /> <span>{org.email}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <FontAwesomeIcon icon={faPhoneAlt} /> <span>{org.phone}</span>
                                </div>
                            </div>

                            <p className={styles.description}>
                                {org.description || (org.approvalStatus === 'APPROVED'
                                    ? 'Ban tổ chức đã được phê duyệt và sẵn sàng quản lý các hoạt động trong hệ thống.'
                                    : org.approvalStatus === 'REJECTED'
                                        ? 'Ban tổ chức này đã bị từ chối trong đợt xét duyệt gần nhất.'
                                        : 'Ban tổ chức đang chờ quản trị viên phê duyệt trước khi sử dụng đầy đủ tính năng.')}
                            </p>

                            <div className={styles.cardActions}>
                                <button className={styles.btnView} type="button" onClick={() => navigate('/create-activity')}>
                                    Tạo hoạt động
                                </button>
                                <button
                                    className={styles.btnContact}
                                    type="button"
                                    onClick={() => navigate(`/members-management?organizerId=${org.id}`)}
                                >
                                    Thành viên
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Organizers;