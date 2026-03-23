import React, { useEffect, useMemo, useRef, useState } from 'react';
import authService from '../../services/auth.service';
import checkinService from '../../services/checkin.service';
import studentService from '../../services/student.service';
import { AttendanceHistoryItem, AttendanceHistorySummary } from '../../types/attendance-history.types';
import styles from './student.dashboard.module.scss';

const DEFAULT_SUMMARY: AttendanceHistorySummary = {
    totalParticipatedActivities: 0,
    cumulativeTrainingScore: 0,
    attendanceRate: 0,
    totalSessions: 0,
    successCount: 0,
    lateCount: 0,
    failedCount: 0,
};

interface DashboardProfile {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
    faculty?: string;
    className?: string;
    studentCode?: string;
}

interface EditProfileForm {
    name: string;
    phone: string;
}

const buildAvatarUrl = (avatar?: string) => {
    if (!avatar) {
        return '';
    }

    if (/^https?:\/\//i.test(avatar)) {
        return avatar;
    }

    const baseUrl = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    const normalizedAvatar = avatar.replace(/^\/+/, '');

    if (normalizedAvatar.startsWith('uploads/')) {
        return `${baseUrl}/${normalizedAvatar}`;
    }

    return `${baseUrl}/uploads/${normalizedAvatar}`;
};

const normalizeProfile = (raw: any): DashboardProfile => ({
    id: String(raw?.id || raw?._id || ''),
    name: String(raw?.name || 'Chưa cập nhật'),
    email: String(raw?.email || 'Chưa cập nhật'),
    avatar: buildAvatarUrl(raw?.avatar || ''),
    phone: String(raw?.phone || raw?.phoneNumber || ''),
    faculty: String(raw?.faculty || raw?.facultyName || ''),
    className: String(raw?.className || raw?.class || ''),
    studentCode: String(raw?.mssv || raw?.studentCode || raw?.code || ''),
});

const getStatusLabel = (status: AttendanceHistoryItem['status']) => {
    switch (status) {
        case 'SUCCESS':
            return 'Điểm danh thành công';
        case 'LATE':
            return 'Điểm danh trễ';
        default:
            return 'Điểm danh thất bại';
    }
};

const getStatusClass = (status: AttendanceHistoryItem['status']) => {
    switch (status) {
        case 'SUCCESS':
            return styles.success;
        case 'LATE':
            return styles.warning;
        default:
            return styles.danger;
    }
};

const toRelativeTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Không xác định thời gian';
    }

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
};

const StudentDashboard: React.FC = () => {
    const [profile, setProfile] = useState<DashboardProfile | null>(null);
    const [summary, setSummary] = useState<AttendanceHistorySummary>(DEFAULT_SUMMARY);
    const [recentActivities, setRecentActivities] = useState<AttendanceHistoryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
    const [showAvatarConfirm, setShowAvatarConfirm] = useState<boolean>(false);
    const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
    const avatarInputRef = useRef<HTMLInputElement | null>(null);
    const [editForm, setEditForm] = useState<EditProfileForm>({
        name: '',
        phone: '',
    });

    const loadDashboardData = async () => {
        setLoading(true);
        setError('');

        try {
            const currentUser = authService.getCurrentUser();
            const currentUserId = String(currentUser?.id || '');

            const [studentResponse, historyResponse] = await Promise.all([
                currentUserId ? studentService.getStudentFullInfo(currentUserId) : Promise.resolve(null),
                checkinService.getMyAttendanceHistory({ page: 1, limit: 5 }),
            ]);

            const profilePayload = studentResponse?.data?.data || currentUser;

            setProfile(normalizeProfile(profilePayload));
            setSummary(historyResponse?.summary || DEFAULT_SUMMARY);
            setRecentActivities((historyResponse?.items || []).slice(0, 3));

            const normalized = normalizeProfile(profilePayload);
            setEditForm({
                name: normalized.name || '',
                phone: normalized.phone || '',
            });
        } catch (err: any) {
            const fallbackUser = authService.getCurrentUser();
            if (fallbackUser) {
                const normalizedFallback = normalizeProfile(fallbackUser);
                setProfile(normalizedFallback);
                setEditForm({
                    name: normalizedFallback.name || '',
                    phone: normalizedFallback.phone || '',
                });
            }

            setSummary(DEFAULT_SUMMARY);
            setRecentActivities([]);
            setError(err?.response?.data?.message || 'Không thể tải dữ liệu hồ sơ sinh viên');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadDashboardData();
    }, []);

    const profileCode = useMemo(() => {
        return profile?.studentCode || 'Chưa cập nhật';
    }, [profile]);

    const handleOpenAvatarPicker = () => {
        avatarInputRef.current?.click();
    };

    const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setPendingAvatarFile(file);
        setShowAvatarConfirm(true);
    };

    const handleConfirmAvatarChange = async () => {
        if (!pendingAvatarFile) {
            return;
        }

        setIsUploadingAvatar(true);
        setError('');
        setShowAvatarConfirm(false);

        try {
            const response = await authService.uploadAvatar(pendingAvatarFile);
            if (response.success) {
                await loadDashboardData();
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Không thể tải ảnh đại diện lên');
        } finally {
            setIsUploadingAvatar(false);
            setPendingAvatarFile(null);
            if (avatarInputRef.current) {
                avatarInputRef.current.value = '';
            }
        }
    };

    const handleCancelAvatarChange = () => {
        setShowAvatarConfirm(false);
        setPendingAvatarFile(null);
        if (avatarInputRef.current) {
            avatarInputRef.current.value = '';
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setError('');

        try {
            const updated = await authService.updateProfile({
                name: editForm.name,
                phone: editForm.phone,
            });

            if (updated.success) {
                setIsEditOpen(false);
                await loadDashboardData();
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Không thể cập nhật thông tin cá nhân');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.dashboardContainer}>
                <section className={styles.card}>Đang tải thông tin người dùng...</section>
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            {/* HEADER SECTION */}
            <header className={styles.header}>
                <div className={styles.profileSection}>
                    <div className={styles.avatarWrapper}>
                        {profile?.avatar ? (
                            <img src={profile.avatar} alt="Profile" />
                        ) : (
                            <span className={styles.emptyAvatarText}>AVT</span>
                        )}
                        <button
                            type="button"
                            className={styles.plusIcon}
                            onClick={handleOpenAvatarPicker}
                            disabled={isUploadingAvatar}
                            aria-label="Tải ảnh đại diện"
                            title="Tải ảnh đại diện"
                        >
                            {isUploadingAvatar ? '...' : '+'}
                        </button>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className={styles.hiddenFileInput}
                            onChange={handleAvatarFileChange}
                        />
                    </div>
                    <div className={styles.nameInfo}>
                        <span className={styles.statusTag}>Sinh viên đang hoạt động</span>
                        <h1>{profile?.name || 'Chưa cập nhật'}</h1>
                        <div className={styles.meta}>
                            <span>🆔 {profileCode}</span>
                            <span>📍 {profile?.faculty || 'Chưa cập nhật khoa'}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.btnEdit} onClick={() => setIsEditOpen((prev) => !prev)}>
                        {isEditOpen ? 'Đóng chỉnh sửa' : 'Chỉnh sửa thông tin'}
                    </button>
                    <button className={styles.btnEdit} onClick={() => void loadDashboardData()}>Làm mới</button>
                </div>
            </header>

            {error && <p className={styles.errorText}>{error}</p>}

            {showAvatarConfirm && (
                <div className={styles.confirmDialogOverlay}>
                    <div className={styles.confirmDialog}>
                        <h3>Xác nhận thay đổi ảnh đại diện</h3>
                        <p>Bạn có chắc chắn muốn cập nhật ảnh đại diện không?</p>
                        <div className={styles.confirmDialogActions}>
                            <button onClick={handleCancelAvatarChange} className={styles.btnCancel}>Hủy</button>
                            <button onClick={handleConfirmAvatarChange} className={styles.btnConfirm} disabled={isUploadingAvatar}>
                                {isUploadingAvatar ? 'Đang cập nhật...' : 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditOpen && (
                <section className={`${styles.card} ${styles.editProfileCard}`}>
                    <h3>Chỉnh sửa thông tin cá nhân</h3>
                    <div className={styles.editGrid}>
                        <div className={styles.formItem}>
                            <label>Họ và tên</label>
                            <input
                                value={editForm.name}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                                placeholder="Nhập họ và tên"
                            />
                        </div>
                        <div className={styles.formItem}>
                            <label>Số điện thoại</label>
                            <input
                                value={editForm.phone}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
                                placeholder="Nhập số điện thoại"
                            />
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <button className={styles.btnEdit} onClick={() => setIsEditOpen(false)} disabled={isSaving}>Hủy</button>
                        <button className={styles.btnSave} onClick={() => void handleSaveProfile()} disabled={isSaving}>
                            {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                        </button>
                    </div>
                </section>
            )}

            {/* CONTENT SECTION */}
            <div className={styles.contentGrid}>
                <div className={styles.leftCol}>
                    {/* Personal Info */}
                    <section className={`${styles.card} ${styles.personalInfo}`}>
                        <h2>Thông tin cá nhân</h2>
                        <div className={styles.infoGrid}>
                            <div className={styles.item}><label>Họ và tên</label><span>{profile?.name || 'Chưa cập nhật'}</span></div>
                            <div className={styles.item}><label>Mã sinh viên</label><span>{profileCode}</span></div>
                            <div className={styles.item}><label>Email</label><span>{profile?.email || 'Chưa cập nhật'}</span></div>
                            <div className={styles.item}><label>Số điện thoại</label><span>{profile?.phone || 'Chưa cập nhật'}</span></div>
                            <div className={styles.item}><label>Khoa</label><span>{profile?.faculty || 'Chưa cập nhật'}</span></div>
                            <div className={styles.item}><label>Lớp</label><span>{profile?.className || 'Chưa cập nhật'}</span></div>
                        </div>
                    </section>

                    {/* Recent Activity */}
                    <section className={`${styles.card} ${styles.recentActivity}`}>
                        <h3>Hoạt động gần đây</h3>
                        {recentActivities.length === 0 && <p>Chưa có dữ liệu điểm danh gần đây.</p>}
                        {recentActivities.map((activity) => (
                            <div key={activity.checkinId} className={styles.activityItem}>
                                <div className={`${styles.icon} ${getStatusClass(activity.status)}`}>
                                    {activity.status === 'SUCCESS' ? '✓' : activity.status === 'LATE' ? '⏱' : '!'}
                                </div>
                                <div className={styles.details}>
                                    <strong>{getStatusLabel(activity.status)}</strong>
                                    <small>{activity.activityTitle} • {toRelativeTime(activity.checkinTime)}</small>
                                </div>
                            </div>
                        ))}
                    </section>
                </div>

                {/* Right Sidebar */}
                <aside className={`${styles.card} ${styles.trainingSummary}`}>
                    <h3>Điểm rèn luyện</h3>
                    <p>Tổng hợp từ lịch sử điểm danh hoạt động</p>
                    <div className={styles.gpaArea}>
                        <div className={styles.gpaLabel}>Tổng điểm hiện tại</div>
                        <div className={styles.gpaValue}>{summary.cumulativeTrainingScore}</div>
                    </div>
                    <div className={styles.stats}>
                        <div className={styles.statBox}>
                            <span>HOẠT ĐỘNG</span>
                            <strong>{summary.totalParticipatedActivities}</strong>
                        </div>
                        <div className={styles.statBox}>
                            <span>TỶ LỆ THAM DỰ</span>
                            <strong>{summary.attendanceRate}%</strong>
                        </div>
                    </div>
                    <button className={styles.viewFullBtn}>Xem chi tiết lịch sử</button>
                </aside>
            </div>
        </div>
    );
};

export default StudentDashboard;