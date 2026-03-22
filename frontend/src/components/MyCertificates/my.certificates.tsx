import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faDownload, faEye, faCertificate,
    faCheckCircle, faFilter, faChevronDown, faCode
} from '@fortawesome/free-solid-svg-icons';
import certificateService from '../../services/certificate.service';
import { CertificateItem } from '../../types/certificate.types';
import styles from './my.certificates.module.scss';

const MyCertificates: React.FC = () => {
    const [certs, setCerts] = useState<CertificateItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [search, setSearch] = useState<string>('');

    const fetchCertificates = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await certificateService.getMyCertificates({ page: 1, limit: 100 });
            setCerts(response.data.data.items || []);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Không thể tải danh sách chứng nhận');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificates();
    }, []);

    const filteredCerts = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) {
            return certs;
        }

        return certs.filter((item) => {
            const title = String(item.meta?.activityTitle || '').toLowerCase();
            const code = item.certificateCode.toLowerCase();
            return title.includes(keyword) || code.includes(keyword);
        });
    }, [certs, search]);

    const avgAttendance = useMemo(() => {
        if (!certs.length) {
            return 0;
        }

        const total = certs.reduce((sum, item) => sum + (item.attendanceRate || 0), 0);
        return total / certs.length;
    }, [certs]);

    const latestCertificate = useMemo(() => {
        if (!certs.length) {
            return null;
        }

        return [...certs].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0];
    }, [certs]);

    const formatDate = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'N/A';
        }

        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getRelativeDate = (value: string) => {
        const date = new Date(value);
        const diffInMs = Date.now() - date.getTime();
        const diffInDays = Math.max(0, Math.floor(diffInMs / (24 * 60 * 60 * 1000)));

        if (diffInDays === 0) return 'Hôm nay';
        if (diffInDays === 1) return '1 ngày trước';
        if (diffInDays < 30) return `${diffInDays} ngày trước`;
        return formatDate(value);
    };

    const handleDownload = async (certificate: CertificateItem) => {
        try {
            const response = await certificateService.downloadById(certificate._id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `${certificate.certificateCode}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        } catch {
            setError('Không thể tải chứng nhận, vui lòng thử lại');
        }
    };

    const renderStatus = (status: CertificateItem['status']) => {
        if (status === 'REVOKED') {
            return <span className={`${styles.statusTag} ${styles.statusRevoked}`}>Đã thu hồi</span>;
        }

        return (
            <span className={styles.statusTag}>
                <FontAwesomeIcon icon={faCheckCircle} /> Đã xác thực
            </span>
        );
    };

    return (
        <div className={styles.container}>
            {/* 1. Page Header */}
            <header className={styles.header}>
                <h1>Chứng nhận của tôi</h1>
                <p>Truy cập và quản lý các chứng nhận bạn đã đạt được. Tải về chứng chỉ, kiểm tra tỷ lệ tham dự và theo dõi quá trình rèn luyện trên một bảng điều khiển tập trung.</p>
            </header>

            {/* 2. Overview Stats */}
            <section className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.blueBorder}`}>
                    <label>Tổng số chứng nhận</label>
                    <div className={styles.val}>{certs.length}</div>
                </div>
                <div className={styles.statCard}>
                    <label>Mới nhận gần đây</label>
                    {latestCertificate ? (
                        <div className={styles.recentItem}>
                            <div className={styles.recentIcon}><FontAwesomeIcon icon={faCertificate} /></div>
                            <div>
                                <strong>{String(latestCertificate.meta?.activityTitle || latestCertificate.certificateCode)}</strong>
                                <small>Nhận {getRelativeDate(latestCertificate.issuedAt)}</small>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.mutedText}>Chưa có chứng nhận</div>
                    )}
                </div>
                <div className={styles.statCard}>
                    <label>Tỷ lệ tham dự trung bình</label>
                    <div className={styles.val}>{avgAttendance.toFixed(1)}%</div>
                    <div className={styles.progressTrack}><div className={styles.progressBar} style={{ width: `${Math.min(100, Math.max(0, avgAttendance))}%` }} /></div>
                </div>
            </section>

            {/* 3. Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchBox}>
                    <FontAwesomeIcon icon={faSearch} />
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoạt động hoặc mã chứng nhận..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>
                <div className={styles.dropdowns}>
                    <button className={styles.dropBtn}>Tất cả năm <FontAwesomeIcon icon={faChevronDown} /></button>
                    <button className={styles.dropBtn}>Tất cả danh mục <FontAwesomeIcon icon={faChevronDown} /></button>
                    <button className={styles.filterIconBtn}><FontAwesomeIcon icon={faFilter} /></button>
                </div>
            </div>

            {/* 4. Certificate List */}
            <div className={styles.certList}>
                {isLoading && <div className={styles.infoBox}>Đang tải danh sách chứng nhận...</div>}
                {!isLoading && error && (
                    <div className={styles.errorBox}>
                        <span>{error}</span>
                        <button type="button" className={styles.retryBtn} onClick={fetchCertificates}>Thử lại</button>
                    </div>
                )}
                {!isLoading && !error && filteredCerts.length === 0 && (
                    <div className={styles.infoBox}>Không có chứng nhận nào để hiển thị.</div>
                )}

                {!isLoading && !error && filteredCerts.map((cert) => (
                    <div key={cert._id} className={styles.certRow}>
                        <div className={styles.certMain}>
                            <div className={styles.certIcon}><FontAwesomeIcon icon={faCode} /></div>
                            <div className={styles.certInfo}>
                                <h3>{String(cert.meta?.activityTitle || cert.certificateCode)}</h3>
                                <div className={styles.certMeta}>
                                    <span>🗓️ {formatDate(cert.issuedAt)}</span>
                                    <span>💠 {cert.certificateCode}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.certStats}>
                            <div className={styles.scoreCol}>
                                <small>THAM DỰ</small>
                                <span className={styles.scoreTag}>{cert.attendanceRate}%</span>
                            </div>
                            <div className={styles.statusCol}>
                                <small>TRẠNG THÁI</small>
                                {renderStatus(cert.status)}
                            </div>
                        </div>

                        <div className={styles.certActions}>
                            <button type="button" className={styles.btnView}>
                                <FontAwesomeIcon icon={faEye} /> Xem chứng nhận
                            </button>
                            <button type="button" className={styles.btnDownload} onClick={() => handleDownload(cert)}>
                                <FontAwesomeIcon icon={faDownload} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MyCertificates;