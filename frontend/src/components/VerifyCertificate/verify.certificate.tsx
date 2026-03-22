import React, { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faQrcode, faTrash, faCheckCircle, faExclamationTriangle,
    faShieldAlt, faCopy, faDownload
} from '@fortawesome/free-solid-svg-icons';
import jsQR from 'jsqr';
import certificateService from '../../services/certificate.service';
import { CertificateVerificationStatus, CertificateVerifyResponse } from '../../types/certificate.types';
import styles from './verify.certificate.module.scss';

type VerifyUiStatus = 'IDLE' | 'LOADING' | CertificateVerificationStatus;

interface VerifyHistoryItem {
    code: string;
    proof?: string;
    at: string;
    status: VerifyUiStatus;
}

interface BarcodeDetectorLike {
    detect: (source: ImageBitmap) => Promise<Array<{ rawValue?: string }>>;
}

type BarcodeDetectorCtorLike = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

const decodeQrWithJsQr = async (file: File): Promise<string> => {
    const imageBitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
        return '';
    }

    context.drawImage(imageBitmap, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
    });

    return decoded?.data || '';
};

const HISTORY_STORAGE_KEY = 'verify_certificate_history_v1';

const parseVerificationInput = (value: string): { code: string; proof: string } => {
    const raw = value.trim();
    if (!raw) return { code: '', proof: '' };

    try {
        const normalized = raw.startsWith('http://') || raw.startsWith('https://')
            ? new URL(raw)
            : new URL(raw, 'https://local.verify');

        const queryCode = normalized.searchParams.get('code') || '';
        const queryProof = normalized.searchParams.get('proof') || '';

        const pathSegments = normalized.pathname.split('/').filter(Boolean);
        const verifyIndex = pathSegments.findIndex((segment) => segment === 'verify');
        const pathCode = verifyIndex >= 0 && pathSegments[verifyIndex + 1]
            ? decodeURIComponent(pathSegments[verifyIndex + 1])
            : '';

        return {
            code: queryCode || pathCode,
            proof: queryProof,
        };
    } catch {
        return {
            code: raw,
            proof: '',
        };
    }
};

const getVerificationStatusLabel = (status: VerifyUiStatus): string => {
    switch (status) {
        case 'VALID':
            return 'Hợp lệ';
        case 'LEGACY_VALID':
            return 'Hợp lệ (bản cũ)';
        case 'NOT_FOUND':
            return 'Không tìm thấy';
        case 'REVOKED_OR_INVALID':
            return 'Đã thu hồi/không hợp lệ';
        case 'PROOF_REQUIRED':
            return 'Thiếu mã xác thực';
        case 'PROOF_MISMATCH':
            return 'Sai mã xác thực';
        case 'LOADING':
            return 'Đang kiểm tra';
        default:
            return 'Chưa kiểm tra';
    }
};

const getCertificateStateLabel = (status?: string): string => {
    switch (String(status || '').toUpperCase()) {
        case 'ISSUED':
            return 'Đã cấp';
        case 'REVOKED':
            return 'Đã thu hồi';
        default:
            return 'Không xác định';
    }
};

const buildOrganizerImageUrl = (image?: string): string => {
    if (!image) {
        return '';
    }

    if (/^https?:\/\//i.test(image)) {
        return image;
    }

    const baseUrl = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
    const normalizedImage = image.replace(/^\/+/, '');

    if (normalizedImage.startsWith('uploads/')) {
        return `${baseUrl}/${normalizedImage}`;
    }

    return `${baseUrl}/uploads/${normalizedImage}`;
};

const VerifyCertificate = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [certificateCode, setCertificateCode] = useState<string>(searchParams.get('code') || '');
    const [proof, setProof] = useState<string>(searchParams.get('proof') || '');
    const [result, setResult] = useState<VerifyUiStatus>('IDLE');
    const [verifyData, setVerifyData] = useState<CertificateVerifyResponse | null>(null);
    const [error, setError] = useState<string>('');
    const [history, setHistory] = useState<VerifyHistoryItem[]>(() => {
        try {
            const cached = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (!cached) return [];
            const parsed = JSON.parse(cached) as VerifyHistoryItem[];
            if (!Array.isArray(parsed)) return [];
            return parsed.slice(0, 10);
        } catch {
            return [];
        }
    });
    const hasAutoVerifiedRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const isValid = result === 'VALID' || result === 'LEGACY_VALID';
    const isInvalid = ['NOT_FOUND', 'REVOKED_OR_INVALID', 'PROOF_REQUIRED', 'PROOF_MISMATCH'].includes(result);
    const organizerImageUrl = buildOrganizerImageUrl(String(verifyData?.meta?.organizerImage || ''));

    const resultTitle = useMemo(() => {
        switch (result) {
            case 'VALID':
                return 'CHỨNG NHẬN HỢP LỆ';
            case 'LEGACY_VALID':
                return 'CHỨNG NHẬN HỢP LỆ (BẢN CŨ)';
            case 'PROOF_MISMATCH':
                return 'DẤU HIỆU GIAN LẬN / CHỈNH SỬA';
            case 'NOT_FOUND':
                return 'KHÔNG TÌM THẤY CHỨNG NHẬN';
            case 'PROOF_REQUIRED':
                return 'THIẾU PROOF TOKEN';
            case 'REVOKED_OR_INVALID':
                return 'CHỨNG NHẬN KHÔNG CÒN HIỆU LỰC';
            case 'LOADING':
                return 'ĐANG KIỂM TRA...';
            default:
                return 'Vui lòng nhập thông tin để bắt đầu xác thực';
        }
    }, [result]);

    const resultDescription = useMemo(() => {
        switch (result) {
            case 'VALID':
                return 'Dữ liệu đã được đối soát thành công với hệ thống server.';
            case 'LEGACY_VALID':
                return 'Chứng nhận hợp lệ nhưng thuộc dữ liệu cũ chưa có proof mới.';
            case 'PROOF_MISMATCH':
                return 'Mã xác thực (proof) không khớp với dữ liệu chứng nhận.';
            case 'NOT_FOUND':
                return 'Không tồn tại mã chứng nhận trong hệ thống.';
            case 'PROOF_REQUIRED':
                return 'Chứng nhận này yêu cầu proof để xác minh đầy đủ.';
            case 'REVOKED_OR_INVALID':
                return 'Chứng nhận đã bị thu hồi hoặc trạng thái không hợp lệ.';
            case 'LOADING':
                return 'Hệ thống đang gọi endpoint và đối soát dữ liệu.';
            default:
                return 'Nhập mã chứng nhận hoặc quét QR để xác minh thật/giả nhanh chóng.';
        }
    }, [result]);

    const formatDateTime = (value?: string) => {
        if (!value) return 'N/A';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'N/A';
        return parsed.toLocaleString('vi-VN');
    };

    useEffect(() => {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    }, [history]);

    const pushHistory = (code: string, proofValue: string, status: VerifyUiStatus) => {
        setHistory((prev) => {
            const deduped = prev.filter((item) => !(item.code === code && (item.proof || '') === proofValue));
            return [
                {
                    code,
                    proof: proofValue || undefined,
                    at: new Date().toISOString(),
                    status,
                },
                ...deduped,
            ].slice(0, 10);
        });
    };

    const handleVerify = useCallback(async (inputCode?: string, inputProof?: string) => {
        const normalizedCode = (inputCode ?? certificateCode).trim();
        const normalizedProof = (inputProof ?? proof).trim();

        if (!normalizedCode) {
            setError('Vui lòng nhập mã chứng nhận trước khi kiểm tra');
            return;
        }

        setError('');
        setResult('LOADING');
        setVerifyData(null);

        try {
            const response = await certificateService.verifyByCode(normalizedCode, normalizedProof || undefined);
            const data = response.data.data;

            setVerifyData(data);
            setResult(data.verificationStatus);
            pushHistory(normalizedCode, normalizedProof, data.verificationStatus);
            setSearchParams(normalizedProof ? { code: normalizedCode, proof: normalizedProof } : { code: normalizedCode });
        } catch (err: any) {
            setResult('IDLE');
            setError(err?.response?.data?.message || 'Không thể gọi endpoint kiểm tra chứng nhận');
        }
    }, [certificateCode, proof, setSearchParams]);

    useEffect(() => {
        if (hasAutoVerifiedRef.current) return;
        const initialCode = searchParams.get('code')?.trim() || '';
        const initialProof = searchParams.get('proof')?.trim() || '';

        if (!initialCode) {
            hasAutoVerifiedRef.current = true;
            return;
        }

        hasAutoVerifiedRef.current = true;
        void handleVerify(initialCode, initialProof);
    }, [handleVerify, searchParams]);

    const handleReset = () => {
        setCertificateCode('');
        setProof('');
        setResult('IDLE');
        setVerifyData(null);
        setError('');
        setSearchParams({});
    };

    const handleCopyCode = async () => {
        const value = verifyData?.certificateCode || certificateCode;
        if (!value) {
            return;
        }
        try {
            await navigator.clipboard.writeText(value);
        } catch {
            setError('Không thể sao chép mã trong trình duyệt hiện tại');
        }
    };

    const handleExportJson = () => {
        if (!verifyData) {
            return;
        }

        const payload = {
            exportedAt: new Date().toISOString(),
            verificationStatus: result,
            data: verifyData,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${verifyData.certificateCode || certificateCode || 'certificate'}-verify.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
    };

    const handleScanQrPaste = () => {
        const pasted = window.prompt('Dán nội dung QR hoặc URL xác thực vào đây:');
        if (!pasted) return;

        const parsed = parseVerificationInput(pasted);
        if (!parsed.code) {
            setError('Không đọc được mã chứng nhận từ dữ liệu QR/URL đã dán');
            return;
        }

        setCertificateCode(parsed.code);
        setProof(parsed.proof);
        setError('');
        void handleVerify(parsed.code, parsed.proof);
    };

    const handleSelectQrImage = () => {
        fileInputRef.current?.click();
    };

    const handleQrImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        try {
            const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtorLike }).BarcodeDetector;
            let rawValue = '';

            if (BarcodeDetectorCtor) {
                const bitmap = await createImageBitmap(file);
                const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
                const results = await detector.detect(bitmap);
                rawValue = results[0]?.rawValue || '';
            }

            if (!rawValue) {
                rawValue = await decodeQrWithJsQr(file);
            }

            if (!rawValue) {
                setError('Không tìm thấy mã QR trong ảnh đã chọn');
                return;
            }

            const parsed = parseVerificationInput(rawValue);

            if (!parsed.code) {
                setError('Ảnh QR hợp lệ nhưng không đọc được certificateCode');
                return;
            }

            setCertificateCode(parsed.code);
            setProof(parsed.proof);
            setError('');
            void handleVerify(parsed.code, parsed.proof);
        } catch {
            setError('Không thể xử lý ảnh QR. Vui lòng thử ảnh rõ hơn hoặc dán URL/mã thủ công.');
        }
    };

    const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            void handleVerify();
        }
    };

    const handleQrBoxKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleScanQrPaste();
        }
    };

    return (
        <div className={styles.wrapper}>
            <header className={styles.pageHeader}>
                <div className={styles.titleRow}>
                    <h1>Kiểm tra chứng nhận</h1>
                    <span className={styles.badge}>HỆ THỐNG XÁC THỰC TỪ SERVER</span>
                </div>
                <p>Nhập mã chứng nhận hoặc quét QR để xác minh thật/giả nhanh chóng.</p>
            </header>

            <div className={styles.mainGrid}>
                {/* Cột trái: Form & History */}
                <div className={styles.formColumn}>
                    <section className={styles.whiteCard}>
                        <h3 className={styles.cardTitle}>
                            <FontAwesomeIcon icon={faShieldAlt} className={styles.iconBlue} /> Thông tin xác thực
                        </h3>

                        <div className={styles.inputGroup}>
                            <label>Mã chứng nhận (certificateCode) *</label>
                            <input
                                type="text"
                                placeholder="VD: CERT-2024-X99"
                                value={certificateCode}
                                onChange={(event) => setCertificateCode(event.target.value)}
                                onKeyDown={handleInputKeyDown}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Bằng chứng xác thực (proof - Tùy chọn)</label>
                            <input
                                type="text"
                                placeholder="Mã bí mật hoặc chữ ký số"
                                value={proof}
                                onChange={(event) => setProof(event.target.value)}
                                onKeyDown={handleInputKeyDown}
                            />
                        </div>

                        {error && <p className={styles.errorText}>{error}</p>}

                        <div className={styles.actions}>
                            <button className={styles.btnPrimary} onClick={() => void handleVerify()}>
                                <FontAwesomeIcon icon={faSearch} /> {result === 'LOADING' ? 'Đang kiểm tra...' : 'Kiểm tra'}
                            </button>
                            <button className={styles.btnGhost} onClick={handleReset}>
                                <FontAwesomeIcon icon={faTrash} /> Xóa dữ liệu
                            </button>
                        </div>

                        <div className={styles.qrArea}>
                            <span>Hoặc sử dụng máy quét</span>
                            <div className={styles.qrBox}>
                                <FontAwesomeIcon icon={faQrcode} />
                                <p>Chọn ảnh QR hoặc dán URL để tự điền & kiểm tra</p>
                                <div className={styles.qrActions}>
                                    <button type="button" className={styles.qrActionBtn} onClick={handleSelectQrImage}>
                                        Chọn ảnh QR
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.qrActionBtn}
                                        onClick={handleScanQrPaste}
                                        onKeyDown={handleQrBoxKeyDown}
                                    >
                                        Dán URL/Mã
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className={styles.hiddenFileInput}
                                    onChange={handleQrImageChange}
                                />
                            </div>
                        </div>
                    </section>

                    <section className={styles.historyCard}>
                        <h4>Lịch sử kiểm tra gần đây</h4>
                        <div className={styles.tableScroll}>
                            <table>
                                <thead>
                                    <tr><th>Thời gian</th><th>Mã</th><th>Kết quả</th></tr>
                                </thead>
                                <tbody>
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={3}>Chưa có dữ liệu</td>
                                        </tr>
                                    )}
                                    {history.map((item, index) => (
                                        <tr
                                            key={`${item.code}-${item.proof || 'nop'}-${index}`}
                                            className={styles.historyRow}
                                            onClick={() => {
                                                setCertificateCode(item.code);
                                                setProof(item.proof || '');
                                                void handleVerify(item.code, item.proof || '');
                                            }}
                                        >
                                            <td>{formatDateTime(item.at)}</td>
                                            <td>{item.code}</td>
                                            <td>
                                                <span className={item.status === 'VALID' || item.status === 'LEGACY_VALID' ? styles.resValid : styles.resRevoked}>
                                                    {getVerificationStatusLabel(item.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Cột phải: Results */}
                <div className={styles.resultColumn}>
                    {isValid && (
                        <div className={styles.validResult}>
                            <div className={styles.resultHeader}>
                                <div className={styles.statusTitle}>
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                    <div>
                                        <h2>{resultTitle}</h2>
                                        <p>{resultDescription}</p>
                                    </div>
                                </div>
                                <div className={styles.headerIcons}>
                                    <button onClick={() => void handleCopyCode()}><FontAwesomeIcon icon={faCopy} /></button>
                                    <button onClick={handleExportJson} disabled={!verifyData}><FontAwesomeIcon icon={faDownload} /></button>
                                </div>
                            </div>

                            <div className={styles.detailGrid}>
                                <div className={styles.item}><label>Mã số chứng nhận</label><strong>{verifyData?.certificateCode || 'N/A'}</strong></div>
                                <div className={styles.item}><label>Họ và tên người nhận</label><strong>{String(verifyData?.meta?.userName || 'N/A')}</strong></div>
                                <div className={styles.item}><label>Tên hoạt động đào tạo</label><strong>{String(verifyData?.meta?.activityTitle || 'N/A')}</strong></div>
                                <div className={styles.item}><label>Ngày cấp chứng nhận</label><strong>{formatDateTime(verifyData?.issuedAt)}</strong></div>
                                <div className={styles.item}>
                                    <label>Tỷ lệ tham dự</label>
                                    <div className={styles.progressWrap}>
                                        <div className={styles.bar}><div style={{ width: `${Math.max(0, Math.min(100, verifyData?.attendanceRate || 0))}%` }} /></div>
                                        <span>{verifyData?.attendanceRate ?? 0}%</span>
                                    </div>
                                </div>
                                <div className={styles.item}><label>Trạng thái hiện tại</label><span className={styles.tagActive}>{getCertificateStateLabel(verifyData?.status)}</span></div>
                            </div>

                            <div className={styles.issuer}>
                                {organizerImageUrl ? (
                                    <img
                                        className={styles.issuerLogo}
                                        src={organizerImageUrl}
                                        alt={String(verifyData?.meta?.organizerName || 'Ban tổ chức')}
                                        onError={(event) => {
                                            event.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className={styles.issuerLogo} />
                                )}
                                <div>
                                    <strong>{String(verifyData?.meta?.organizerName || 'Ban tổ chức')}</strong>
                                    <small>{String(verifyData?.meta?.organizerLabel || 'Đơn vị xác thực chứng chỉ')}</small>
                                </div>
                            </div>
                        </div>
                    )}

                    {isInvalid && (
                        <div className={styles.resultAlert}>
                            <div className={styles.statusTitle}>
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                <div>
                                    <h2>{resultTitle}</h2>
                                    <p>{resultDescription}</p>
                                </div>
                            </div>
                            <p className={styles.alertText}>Không xác minh được nguồn gốc chứng nhận theo endpoint hệ thống.</p>
                        </div>
                    )}

                    {(result === 'IDLE' || result === 'LOADING') && (
                        <div className={styles.emptyCard}>
                            <div className={styles.skeletonLine} style={{ width: '60%' }} />
                            <div className={styles.skeletonLine} />
                            <div className={styles.skeletonLine} style={{ width: '40%' }} />
                            <p>{resultDescription}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyCertificate;