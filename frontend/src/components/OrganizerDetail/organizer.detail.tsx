import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarCheck,
    faUsers,
    faClipboardCheck,
    faEnvelope,
    faPhone,
    faArrowRight,
    faPenToSquare,
    faCamera,
    faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import organizerService from '../../services/organizer.service';
import authService from '../../services/auth.service';
import type { OrganizerOverviewResponse } from '@/types/organizer.types';
import { formatTime } from '../../utils/date-time';
import styles from './organizer.detail.module.scss';
import { resolveImageSrc } from '../../utils/image-url';

const OrganizerDetail: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const organizerId = searchParams.get('id') || '';

    const [overview, setOverview] = useState<OrganizerOverviewResponse | null>(null);
    const [myOrganizerIds, setMyOrganizerIds] = useState<string[]>([]);
    const [myManagerOrganizerIds, setMyManagerOrganizerIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        const fetchOverview = async () => {
            if (!organizerId) {
                setError('Thiếu mã ban tổ chức.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response = await organizerService.overview(organizerId);
                const data = response.data?.data ?? response.data;
                setOverview(data);
            } catch (fetchError: any) {
                console.error('Lỗi tải chi tiết ban tổ chức:', fetchError);
                setError(fetchError?.response?.data?.message || 'Không thể tải chi tiết ban tổ chức.');
                setOverview(null);
            } finally {
                setLoading(false);
            }
        };

        void fetchOverview();
    }, [organizerId]);

    useEffect(() => {
        const fetchMyOrganizations = async () => {
            if (!currentUser?.id) {
                setMyOrganizerIds([]);
                return;
            }

            try {
                const response = await organizerService.myOrganizations(currentUser.id);
                const rows = Array.isArray(response.data?.data) ? response.data.data : [];
                const ids = rows
                    .map((item: any) => String(item?.organizerId?._id || item?.organizerId || ''))
                    .filter((id: string) => Boolean(id));
                const managerIds = rows
                    .filter((item: any) => item?.role === 'MANAGER')
                    .map((item: any) => String(item?.organizerId?._id || item?.organizerId || ''))
                    .filter((id: string) => Boolean(id));

                setMyOrganizerIds(ids);
                setMyManagerOrganizerIds(managerIds);
            } catch (fetchError) {
                console.error('Không thể tải danh sách tổ chức của người dùng:', fetchError);
                setMyOrganizerIds([]);
                setMyManagerOrganizerIds([]);
            }
        };

        void fetchMyOrganizations();
    }, [currentUser?.id]);

    const organizerImage = useMemo(() => resolveImageSrc(overview?.organizer?.image) || '', [overview?.organizer?.image]);
    const canManageOrganization = useMemo(() => {
        if (!organizerId) {
            return false;
        }

        return myOrganizerIds.includes(organizerId);
    }, [myOrganizerIds, organizerId]);
    const canEditOrganization = useMemo(() => {
        if (!organizerId) {
            return false;
        }

        return myManagerOrganizerIds.includes(organizerId);
    }, [myManagerOrganizerIds, organizerId]);
    const approvalStatus = overview?.organizer?.approvalStatus || 'PENDING';
    const isRejected = approvalStatus === 'REJECTED';
    const isNeedsEdit = approvalStatus === 'NEEDS_EDIT';
    const canResubmit = isRejected || isNeedsEdit;
    const approvalBadgeText = isRejected
        ? 'Bị từ chối'
        : isNeedsEdit
            ? 'Cần bổ sung'
            : approvalStatus === 'APPROVED'
                ? 'Đã duyệt'
                : 'Chờ duyệt';

    useEffect(() => {
        if (!overview?.organizer) {
            return;
        }

        setFormName(overview.organizer.name || '');
        setFormEmail(overview.organizer.email || '');
        setFormPhone(overview.organizer.phone || '');
        setFormDescription(overview.organizer.description || '');
        setImageFile(null);
        setImagePreview(resolveImageSrc(overview.organizer.image) || '');
        setEditSuccess('');
    }, [overview]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            setEditError('Vui lòng chọn tệp hình ảnh hợp lệ.');
            event.target.value = '';
            return;
        }

        setEditError('');
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const resetEditState = () => {
        if (!overview?.organizer) {
            return;
        }

        setFormName(overview.organizer.name || '');
        setFormEmail(overview.organizer.email || '');
        setFormPhone(overview.organizer.phone || '');
        setFormDescription(overview.organizer.description || '');
        setImageFile(null);
        setImagePreview(resolveImageSrc(overview.organizer.image) || '');
        setEditError('');
        setEditSuccess('');
        setEditing(false);
    };

    const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canEditOrganization) {
            setEditError('Chỉ manager của tổ chức mới có quyền cập nhật thông tin.');
            return;
        }

        if (!overview?.organizer) {
            setEditError('Không xác định được ban tổ chức để cập nhật.');
            return;
        }

        if (!organizerId) {
            setEditError('Không xác định được ban tổ chức để cập nhật.');
            return;
        }

        if (!formName.trim() || !formEmail.trim() || !formPhone.trim() || !formDescription.trim()) {
            setEditError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
            return;
        }

        setSaving(true);
        setEditError('');
        setEditSuccess('');

        try {
            const formData = new FormData();
            formData.append('name', formName.trim());
            formData.append('email', formEmail.trim());
            formData.append('phone', formPhone.trim());
            formData.append('description', formDescription.trim());

            if (imageFile) {
                formData.append('image', imageFile);
            }

            const targetId = organizerId || overview!.organizer.id;
            const wasResubmitting = canResubmit;
            await organizerService.update(targetId, formData);

            const refreshed = await organizerService.overview(targetId);
            const refreshedData = refreshed.data?.data ?? refreshed.data;
            setOverview(refreshedData);
            setEditing(false);
            setEditSuccess(
                wasResubmitting
                    ? 'Đã cập nhật thông tin và gửi lại yêu cầu duyệt cho admin.'
                    : 'Đã cập nhật thông tin ban tổ chức thành công.',
            );
        } catch (submitError: any) {
            console.error('Lỗi cập nhật ban tổ chức:', submitError);
            setEditError(submitError?.response?.data?.message || 'Không thể cập nhật thông tin ban tổ chức.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className={styles.statePanel}>Đang tải trang chi tiết ban tổ chức...</div>;
    }

    if (error || !overview) {
        return (
            <div className={styles.statePanel}>
                <p>{error || 'Không tìm thấy dữ liệu ban tổ chức.'}</p>
                <button type="button" onClick={() => navigate('/organizations')}>
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className={styles.detailPage}>
            <div className={styles.bannerWrapper}>
                {organizerImage ? (
                    <img src={organizerImage} alt={overview.organizer.name} />
                ) : (
                    <div className={styles.placeholderBanner}>
                        <h2>{overview.organizer.name}</h2>
                    </div>
                )}
                <span className={styles.badge}>{approvalBadgeText}</span>
            </div>

            <div className={styles.contentGrid}>
                <main className={styles.mainContent}>
                    <section className={styles.whiteCard}>
                        <div className={styles.headerInfo}>
                            <h1>{overview.organizer.name}</h1>
                            <p>
                                {overview.organizer.description ||
                                    'Ban tổ chức chưa cập nhật mô tả. Thống kê được tính từ các hoạt động đã duyệt.'}
                            </p>
                        </div>

                        <div className={styles.headerActions}>
                            <button
                                type="button"
                                className={styles.linkButton}
                                disabled={!canEditOrganization}
                                title={!canEditOrganization ? 'Chỉ manager của tổ chức mới có quyền chỉnh sửa' : undefined}
                                onClick={() => {
                                    if (!canEditOrganization) {
                                        return;
                                    }
                                    setEditing((prev) => !prev);
                                    setEditError('');
                                    setEditSuccess('');
                                }}
                            >
                                <FontAwesomeIcon icon={faPenToSquare} /> {canResubmit ? 'Chỉnh sửa và gửi lại duyệt' : 'Chỉnh sửa thông tin'}
                            </button>
                            {canEditOrganization && (
                                <button
                                    type="button"
                                    className={styles.linkButton}
                                    onClick={() => navigate(`/admin/complaints?organizerId=${organizerId}`)}
                                    title="Mở danh sách khiếu nại của tổ chức"
                                >
                                    <FontAwesomeIcon icon={faClipboardCheck} /> Xử lý khiếu nại
                                </button>
                            )}
                        </div>

                        {canResubmit && overview.organizer.reviewNote && (
                            <div className={styles.reviewNoteBox}>
                                <strong>Phản hồi từ admin</strong>
                                <p>{overview.organizer.reviewNote}</p>
                                <small>Hãy cập nhật thông tin bên dưới để gửi lại yêu cầu duyệt.</small>
                            </div>
                        )}

                        {editSuccess && <p className={styles.editSuccess}>{editSuccess}</p>}

                        <div className={styles.contactGrid}>
                            <div className={styles.contactItem}>
                                <FontAwesomeIcon icon={faEnvelope} />
                                <span>{overview.organizer.email || 'Chưa cập nhật email'}</span>
                            </div>
                            <div className={styles.contactItem}>
                                <FontAwesomeIcon icon={faPhone} />
                                <span>{overview.organizer.phone || 'Chưa cập nhật số điện thoại'}</span>
                            </div>
                        </div>

                        {editing && (
                            <form className={styles.editForm} onSubmit={handleSubmitEdit}>
                                <div className={styles.editImageRow}>
                                    <div className={styles.editPreviewFrame}>
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Ảnh ban tổ chức" />
                                        ) : (
                                            <span>Chưa có ảnh</span>
                                        )}
                                    </div>

                                    <label className={styles.uploadButton}>
                                        <FontAwesomeIcon icon={faCamera} />
                                        <span>{imageFile ? 'Đổi ảnh' : 'Tải ảnh mới'}</span>
                                        <input type="file" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                </div>

                                {editError && <p className={styles.editError}>{editError}</p>}

                                <div className={styles.editGrid}>
                                    <label>
                                        <span>Tên ban tổ chức</span>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(event) => setFormName(event.target.value)}
                                            disabled={saving}
                                        />
                                    </label>

                                    <label>
                                        <span>Email</span>
                                        <input
                                            type="email"
                                            value={formEmail}
                                            onChange={(event) => setFormEmail(event.target.value)}
                                            disabled={saving}
                                        />
                                    </label>

                                    <label>
                                        <span>Số điện thoại</span>
                                        <input
                                            type="text"
                                            value={formPhone}
                                            onChange={(event) => setFormPhone(event.target.value)}
                                            disabled={saving}
                                        />
                                    </label>

                                    <label className={styles.fullWidth}>
                                        <span>Mô tả</span>
                                        <textarea
                                            rows={4}
                                            value={formDescription}
                                            onChange={(event) => setFormDescription(event.target.value)}
                                            disabled={saving}
                                        />
                                    </label>
                                </div>

                                <div className={styles.editActions}>
                                    <button type="button" className={styles.secondaryAction} onClick={resetEditState} disabled={saving}>
                                        <FontAwesomeIcon icon={faXmark} /> Hủy
                                    </button>
                                    <button type="submit" className={styles.primaryAction} disabled={saving}>
                                        {saving ? 'Đang gửi...' : (canResubmit ? 'Lưu và gửi lại duyệt' : 'Lưu thay đổi')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>

                    <section className={styles.whiteCard}>
                        <div className={styles.sectionHeader}>
                            <h2>Hoạt động gần đây</h2>
                            <div className={styles.sectionActions}>
                                <button
                                    className={`${styles.linkButton} ${styles.primaryAction}`}
                                    type="button"
                                    disabled={!canManageOrganization}
                                    title={!canManageOrganization ? 'Bạn không thuộc ban tổ chức này' : undefined}
                                    onClick={() => {
                                        if (!canManageOrganization) {
                                            return;
                                        }
                                        navigate(`/create-activity?organizerId=${overview.organizer.id || organizerId}`);
                                    }}
                                >
                                    Tạo hoạt động
                                </button>
                                <button
                                    className={styles.linkButton}
                                    type="button"
                                    disabled={!canManageOrganization}
                                    title={!canManageOrganization ? 'Bạn không thuộc ban tổ chức này' : undefined}
                                    onClick={() => {
                                        if (!canManageOrganization) {
                                            return;
                                        }
                                        navigate(`/members-management?organizerId=${overview.organizer.id || organizerId}`);
                                    }}
                                >
                                    Quản lý thành viên <FontAwesomeIcon icon={faArrowRight} />
                                </button>
                            </div>
                        </div>

                        {overview.recentActivities.length === 0 ? (
                            <div className={styles.emptyState}>Chưa có hoạt động nào được phê duyệt.</div>
                        ) : (
                            <div className={styles.activitiesGrid}>
                                {overview.recentActivities.map((activity) => (
                                    <article
                                        key={activity.id}
                                        className={styles.activityCard}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => navigate(`/activity-detail?id=${activity.id}`)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                navigate(`/activity-detail?id=${activity.id}`);
                                            }
                                        }}
                                    >
                                        <div className={styles.activityImageWrap}>
                                            {activity.image ? (
                                                <img src={resolveImageSrc(activity.image) || ''} alt={activity.title} />
                                            ) : (
                                                <div className={styles.activityPlaceholder}>Không có ảnh</div>
                                            )}
                                        </div>
                                        <div className={styles.activityBody}>
                                            <h3>{activity.title}</h3>
                                            <p>{formatTime(activity.startAt)}</p>
                                            <div className={styles.activityMeta}>
                                                <span>{activity.participantCount} lượt đăng ký</span>
                                                <strong>{activity.attendanceRate}% điểm danh</strong>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                <aside className={styles.sidebar}>
                    <section className={styles.whiteCard}>
                        <h3>Tổng quan tổ chức</h3>
                        <div className={styles.metricList}>
                            <div className={styles.metricItem}>
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faCalendarCheck} />
                                </div>
                                <div>
                                    <span>Số hoạt động đã tổ chức</span>
                                    <strong>{overview.stats.activityCount}</strong>
                                </div>
                            </div>
                            <div className={styles.metricItem}>
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faUsers} />
                                </div>
                                <div>
                                    <span>Tổng lượt tham gia</span>
                                    <strong>{overview.stats.totalParticipants}</strong>
                                </div>
                            </div>
                            <div className={styles.metricItem}>
                                <div className={styles.metricIcon}>
                                    <FontAwesomeIcon icon={faClipboardCheck} />
                                </div>
                                <div>
                                    <span>Tỉ lệ điểm danh trung bình</span>
                                    <strong>{overview.stats.averageAttendanceRate}%</strong>
                                </div>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default OrganizerDetail;
