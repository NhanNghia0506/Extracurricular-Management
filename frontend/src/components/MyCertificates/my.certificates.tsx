import React, { useEffect, useState } from 'react';
import certificateService from '../../services/certificate.service';
import { CertificateItem } from '../../types/certificate.types';
import styles from './my.certificates.module.scss';

const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const MyCertificates: React.FC = () => {
    const [items, setItems] = useState<CertificateItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await certificateService.getMyCertificates({ page: 1, limit: 20 });
                setItems(response.data.data.items || []);
            } catch (err: any) {
                setError(err?.response?.data?.message || 'Không thể tải danh sách chứng nhận');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const handleDownload = async (certificate: CertificateItem) => {
        try {
            setDownloadingId(certificate._id);
            const response = await certificateService.downloadById(certificate._id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = certificate.fileName || `${certificate.certificateCode}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download certificate error:', err);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>Chứng nhận của tôi</h2>
                    <p className={styles.subtitle}>Danh sách chứng nhận đã được cấp sau khi hoàn thành hoạt động.</p>
                </div>
            </div>

            {loading ? <div className={styles.state}>Đang tải chứng nhận...</div> : null}
            {!loading && error ? <div className={styles.state}>{error}</div> : null}
            {!loading && !error && items.length === 0 ? (
                <div className={styles.state}>Bạn chưa có chứng nhận nào.</div>
            ) : null}

            {!loading && !error && items.map((item) => (
                <div key={item._id} className={styles.card}>
                    <div className={styles.meta}>
                        <h4 className={styles.name}>{String(item.meta?.activityTitle || 'Hoạt động')}</h4>
                        <p className={styles.detail}>Mã chứng nhận: {item.certificateCode}</p>
                        <p className={styles.detail}>Ngày cấp: {formatDate(item.issuedAt)}</p>
                        <p className={styles.detail}>Điểm danh: {item.attendedSessions}/{item.totalSessions} phiên ({item.attendanceRate}%)</p>
                        <span className={styles.status}>{item.status}</span>
                    </div>

                    <button
                        type="button"
                        className={styles.action}
                        disabled={downloadingId === item._id}
                        onClick={() => handleDownload(item)}
                    >
                        {downloadingId === item._id ? 'Đang tải...' : 'Tải PDF'}
                    </button>
                </div>
            ))}
        </div>
    );
};

export default MyCertificates;