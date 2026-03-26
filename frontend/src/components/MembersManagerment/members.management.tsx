import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './members.management.module.scss';
import organizerService from '../../services/organizer.service';
import authService from '../../services/auth.service';

type RoleKey = 'manager' | 'moderator' | 'member';

interface MemberItem {
    id: string;
    name: string;
    email: string;
    roleKey: RoleKey;
}

const ROLE_META: Record<RoleKey, { label: string; permissions: string[] }> = {
    manager: {
        label: 'Manager',
        permissions: [
            'Tạo và cập nhật hoạt động',
            'Duyệt đăng ký tham gia hoạt động',
            'Quản lý điểm danh và theo dõi tiến độ',
            'Gửi thông báo cho thành viên',
        ],
    },
    moderator: {
        label: 'Moderator',
        permissions: [
            'Kiểm tra nội dung hoạt động và bình luận',
            'Hỗ trợ điểm danh và xử lý thành viên vi phạm',
            'Theo dõi trạng thái hoạt động được phân công',
        ],
    },
    member: {
        label: 'Member',
        permissions: [
            'Xem danh sách hoạt động được phân công',
            'Tham gia hỗ trợ vận hành hoạt động',
            'Nhận và phản hồi thông báo nội bộ',
        ],
    },
};

const toRoleKey = (role: string): RoleKey => {
    const normalized = String(role || '').toUpperCase();
    if (normalized === 'MANAGER') return 'manager';
    if (normalized === 'MEMBER') return 'member';
    return 'moderator';
};

const toApiRole = (roleKey: RoleKey): 'MANAGER' | 'MEMBER' => {
    if (roleKey === 'manager') return 'MANAGER';
    return 'MEMBER';
};

const MembersManagement: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [members, setMembers] = useState<MemberItem[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [draftRoleKey, setDraftRoleKey] = useState<RoleKey>('manager');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState<RoleKey>('member');
    const [organizerId, setOrganizerId] = useState<string>(searchParams.get('organizerId') || '');
    const [organizerName, setOrganizerName] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const userInfo = authService.getCurrentUser();

    const mapApiMembers = (rows: any[]): MemberItem[] => {
        return rows.map((row) => ({
            id: String(row.id || row._id),
            name: row.name || 'Chưa cập nhật',
            email: row.email || 'Chưa cập nhật',
            roleKey: toRoleKey(row.role),
        }));
    };

    useEffect(() => {
        const bootstrap = async () => {
            if (organizerId || !userInfo?.id) {
                return;
            }

            try {
                const response = await organizerService.myOrganizations(userInfo.id);
                const rows = response.data?.data || [];
                const first = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
                const nextOrganizerId = first?.organizerId?._id || first?.organizerId || '';
                const nextOrganizerName = first?.organizerId?.name || '';

                if (nextOrganizerId) {
                    setOrganizerId(String(nextOrganizerId));
                    setOrganizerName(String(nextOrganizerName || ''));
                }
            } catch (error) {
                console.error('Không thể tải danh sách tổ chức của bạn:', error);
            }
        };

        void bootstrap();
    }, [organizerId, userInfo?.id]);

    useEffect(() => {
        const fetchMembers = async () => {
            if (!organizerId) {
                setMembers([]);
                setSelectedId('');
                return;
            }

            try {
                setLoading(true);
                const response = await organizerService.getMembersByOrganizer(organizerId);
                const rows = response.data?.data || [];
                const mapped = mapApiMembers(Array.isArray(rows) ? rows : []);
                setMembers(mapped);

                if (mapped.length > 0) {
                    setSelectedId((prev) => (prev && mapped.some((item) => item.id === prev) ? prev : mapped[0].id));
                } else {
                    setSelectedId('');
                }
            } catch (error: any) {
                console.error('Không thể tải danh sách thành viên:', error);
                alert(error?.response?.data?.message || 'Không thể tải danh sách thành viên.');
                setMembers([]);
                setSelectedId('');
            } finally {
                setLoading(false);
            }
        };

        void fetchMembers();
    }, [organizerId]);

    const selectedMember = useMemo(
        () => members.find((member) => member.id === selectedId) || null,
        [members, selectedId],
    );

    useEffect(() => {
        if (selectedMember) {
            setDraftRoleKey(selectedMember.roleKey);
        }
    }, [selectedMember]);

    const filteredMembers = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();
        if (!keyword) return members;

        return members.filter((member) => {
            return member.name.toLowerCase().includes(keyword) || member.email.toLowerCase().includes(keyword);
        });
    }, [members, searchTerm]);

    const hasRoleChange = Boolean(selectedMember && selectedMember.roleKey !== draftRoleKey);

    const handleSaveRole = () => {
        if (!selectedMember || !hasRoleChange) {
            return;
        }

        const save = async () => {
            try {
                const response = await organizerService.updateMemberRole(selectedMember.id, toApiRole(draftRoleKey));
                const rows = response.data?.data || [];
                const mapped = mapApiMembers(Array.isArray(rows) ? rows : []);
                setMembers(mapped);
            } catch (error: any) {
                alert(error?.response?.data?.message || 'Không thể cập nhật vai trò.');
            }
        };

        void save();
    };

    const handleCancelRoleChange = () => {
        if (!selectedMember) {
            return;
        }

        setDraftRoleKey(selectedMember.roleKey);
    };

    const handleAddMember = () => {
        const email = newMemberEmail.trim();

        if (!email) {
            alert('Vui lòng nhập email.');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert('Email không đúng định dạng.');
            return;
        }

        if (!organizerId) {
            alert('Chưa xác định tổ chức để thêm thành viên.');
            return;
        }

        const addMember = async () => {
            try {
                const response = await organizerService.addMemberByEmail(organizerId, {
                    email,
                    role: toApiRole(newMemberRole),
                });
                const rows = response.data?.data || [];
                const mapped = mapApiMembers(Array.isArray(rows) ? rows : []);
                setMembers(mapped);
                const createdMember = mapped.find((member) => member.email.toLowerCase() === email.toLowerCase());
                if (createdMember) {
                    setSelectedId(createdMember.id);
                }
                setShowAddForm(false);
                setNewMemberEmail('');
                setNewMemberRole('member');
            } catch (error: any) {
                alert(error?.response?.data?.message || 'Không thể thêm thành viên.');
            }
        };

        void addMember();
    };

    const handleRemoveSelectedMember = () => {
        if (!selectedMember) {
            return;
        }

        const confirmed = window.confirm(`Bạn có chắc muốn xóa thành viên ${selectedMember.name}?`);
        if (!confirmed) {
            return;
        }

        const remove = async () => {
            try {
                const response = await organizerService.deleteMember(selectedMember.id);
                const rows = response.data?.data || [];
                const mapped = mapApiMembers(Array.isArray(rows) ? rows : []);
                setMembers(mapped);
                setSelectedId(mapped[0]?.id || '');
            } catch (error: any) {
                alert(error?.response?.data?.message || 'Không thể xóa thành viên.');
            }
        };

        void remove();
    };

    return (
        <div className={styles.container}>
            {/* HEADER */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Quản lý thành viên & Phân quyền</h1>
                    <p>Quản lý danh sách thành viên trong tổ chức, phân vai trò và xem các quyền tương ứng theo từng vai trò.</p>
                    {organizerName && <p>Tổ chức hiện tại: <strong>{organizerName}</strong></p>}
                </div>
                <button className={styles.btnAdd} onClick={() => setShowAddForm((prev) => !prev)}>
                    {showAddForm ? 'Đóng biểu mẫu' : '+ Thêm thành viên'}
                </button>
            </div>

            {showAddForm && (
                <div className={styles.addFormCard}>
                    <h3>Thêm thành viên mới</h3>
                    <div className={styles.addFormGrid}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={newMemberEmail}
                            onChange={(event) => setNewMemberEmail(event.target.value)}
                        />
                        <select
                            value={newMemberRole}
                            onChange={(event) => setNewMemberRole(event.target.value as RoleKey)}
                        >
                            {(Object.keys(ROLE_META) as RoleKey[]).map((roleKey) => (
                                <option key={roleKey} value={roleKey}>{ROLE_META[roleKey].label}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.addFormActions}>
                        <button className={styles.btnSave} onClick={handleAddMember}>Lưu thành viên</button>
                        <button
                            className={styles.btnCancel}
                            onClick={() => {
                                setShowAddForm(false);
                                setNewMemberEmail('');
                                setNewMemberRole('member');
                            }}
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.mainLayout}>
                {/* BẢNG DANH SÁCH */}
                <section className={styles.memberCard}>
                    <div className={styles.tableHeader}>
                        <h2>Danh sách thành viên</h2>
                        <div className={styles.tableActions}>
                            <input
                                className={styles.searchInput}
                                placeholder="Tìm theo tên hoặc email"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Thành viên</th>
                                <th>Vai trò</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((m) => (
                                <tr key={m.id} className={selectedId === m.id ? styles.selected : ''}>
                                    <td>
                                        <div className={styles.userInfo}>
                                            <div className={styles.avatar} style={{ background: '#ffd8a8' }}></div>
                                            <div className={styles.details}>
                                                <strong>{m.name}</strong>
                                                <small>{m.email}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${styles[m.roleKey]}`}>{ROLE_META[m.roleKey].label}</span>
                                    </td>
                                    <td>
                                        <button
                                            style={{ border: 'none', background: 'none', color: selectedId === m.id ? '#0056d2' : '#6b7280', fontWeight: 600, cursor: 'pointer' }}
                                            onClick={() => setSelectedId(m.id)}
                                        >
                                            {selectedId === m.id ? 'Đang chọn' : 'Chỉnh sửa'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredMembers.length === 0 && (
                                <tr>
                                    <td colSpan={3} className={styles.emptyState}>
                                        {loading ? 'Đang tải danh sách thành viên...' : 'Không tìm thấy thành viên phù hợp.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>

                {/* CÀI ĐẶT QUYỀN HẠN */}
                <aside className={styles.permissionPanel}>
                    {selectedMember ? (
                        <>
                            <div className={styles.userBrief}>
                                <div className={styles.panelAvatar} style={{ background: '#ddd' }}></div>
                                <div>
                                    <h3>Thiết lập vai trò</h3>
                                    <span>{selectedMember.name}</span>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Vai trò hệ thống</label>
                                <select
                                    className={styles.roleSelect}
                                    value={draftRoleKey}
                                    onChange={(event) => setDraftRoleKey(event.target.value as RoleKey)}
                                >
                                    {(Object.keys(ROLE_META) as RoleKey[]).map((roleKey) => (
                                        <option key={roleKey} value={roleKey}>
                                            {ROLE_META[roleKey].label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.permissionList}>
                                <label>Quyền được cấp theo vai trò</label>
                                <p className={styles.permissionHint}>
                                    Vai trò <strong>{ROLE_META[draftRoleKey].label}</strong> hiện có các quyền sau:
                                </p>
                                {ROLE_META[draftRoleKey].permissions.map((permission, idx) => (
                                    <div key={idx} className={styles.permItem}>
                                        <span>{permission}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.footerActions}>
                                <button className={styles.btnSave} onClick={handleSaveRole} disabled={!hasRoleChange}>Lưu thay đổi</button>
                                <button className={styles.btnCancel} onClick={handleCancelRoleChange} disabled={!hasRoleChange}>Hủy</button>
                            </div>
                            <button className={styles.btnDanger} onClick={handleRemoveSelectedMember}>Xóa thành viên</button>
                        </>
                    ) : (
                        <div className={styles.emptyPanel}>Chọn một thành viên để xem và cập nhật vai trò.</div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default MembersManagement;