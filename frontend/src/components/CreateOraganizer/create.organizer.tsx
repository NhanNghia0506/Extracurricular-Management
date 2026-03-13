import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faBuildingUser,
    faCamera,
    faCircleInfo,
    faEnvelope,
    faPhone,
    faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import organizerService from '../../services/organizer.service';
import { useToast } from '../../contexts/ToastContext';
import styles from './create.organizer.module.scss';

const CreateOraganizer: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const helperItems = useMemo(
        () => [
            'Ban tổ chức mới sẽ được tạo với trạng thái chờ duyệt.',
            'Tài khoản gửi yêu cầu sẽ được gán vai trò quản lý đầu tiên.',
            'Ảnh đại diện giúp nhận diện ban tổ chức rõ hơn trong hệ thống.',
        ],
        [],
    );

    const handleSelectImage = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] ?? null;

        if (!selectedFile) {
            setImageFile(null);
            setImagePreview(null);
            return;
        }

        if (!selectedFile.type.startsWith('image/')) {
            setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ.');
            event.target.value = '';
            return;
        }

        setErrorMessage('');
        setImageFile(selectedFile);
        setImagePreview(URL.createObjectURL(selectedFile));
    };

    const validateForm = () => {
        const errors: string[] = [];

        if (!name.trim()) {
            errors.push('Tên ban tổ chức không được để trống.');
        }

        if (!email.trim()) {
            errors.push('Email không được để trống.');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            errors.push('Email không đúng định dạng.');
        }

        if (!phone.trim()) {
            errors.push('Số điện thoại không được để trống.');
        }

        if (!description.trim()) {
            errors.push('Mô tả ban tổ chức không được để trống.');
        }

        return errors;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const errors = validateForm();

        if (errors.length > 0) {
            setErrorMessage(errors.join(' '));
            return;
        }

        setSubmitting(true);
        setErrorMessage('');

        try {
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('email', email.trim());
            formData.append('phone', phone.trim());
            formData.append('description', description.trim());

            if (imageFile) {
                formData.append('image', imageFile);
            }

            await organizerService.create(formData);

            showToast({
                type: 'success',
                title: 'Tạo ban tổ chức thành công',
                message: 'Yêu cầu của bạn đã được gửi lên hệ thống và đang chờ phê duyệt.',
            });

            navigate('/organizations');
        } catch (error) {
            console.error('Lỗi tạo ban tổ chức:', error);
            setErrorMessage('Không thể gửi yêu cầu tạo ban tổ chức. Vui lòng thử lại.');
            showToast({
                type: 'error',
                title: 'Gửi yêu cầu thất bại',
                message: 'Không thể tạo ban tổ chức ở thời điểm hiện tại.',
                actionText: 'Thử lại',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Quay lại</span>
                </button>

                <div className={styles.heroContent}>
                    <div>
                        <p className={styles.eyebrow}>Organizer Request</p>
                        <h1>Tạo ban tổ chức mới</h1>
                        <p className={styles.heroText}>
                            Gửi thông tin ban tổ chức để tham gia quản lý hoạt động, thành viên và thông báo ngay trong hệ thống.
                        </p>
                    </div>

                    <div className={styles.heroBadge}>
                        <FontAwesomeIcon icon={faShieldHalved} />
                        <span>Trạng thái khởi tạo: Chờ duyệt</span>
                    </div>
                </div>
            </section>

            <div className={styles.layout}>
                <form className={styles.formCard} onSubmit={handleSubmit}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>Thông tin cơ bản</h2>
                            <p>Điền các trường bắt buộc và tải ảnh đại diện nếu đã có.</p>
                        </div>
                    </div>

                    <div className={styles.uploadPanel}>
                        <div className={styles.previewFrame}>
                            {imagePreview ? (
                                <img src={imagePreview} alt="Xem trước ảnh ban tổ chức" />
                            ) : (
                                <div className={styles.emptyPreview}>
                                    <FontAwesomeIcon icon={faBuildingUser} />
                                    <span>Chưa có ảnh đại diện</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.uploadContent}>
                            <h3>Ảnh đại diện ban tổ chức</h3>
                            <p>Ưu tiên ảnh PNG hoặc JPG rõ nét để hiển thị tốt trong danh sách và chi tiết hoạt động.</p>
                            <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={handleSelectImage}
                                disabled={submitting}
                            >
                                <FontAwesomeIcon icon={faCamera} />
                                <span>{imageFile ? 'Đổi ảnh đại diện' : 'Tải ảnh lên'}</span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className={styles.hiddenInput}
                                onChange={handleImageChange}
                            />
                            {imageFile && <span className={styles.fileName}>{imageFile.name}</span>}
                        </div>
                    </div>

                    {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

                    <div className={styles.fieldGrid}>
                        <label className={styles.field}>
                            <span>Tên ban tổ chức</span>
                            <input
                                type="text"
                                placeholder="Ví dụ: Câu lạc bộ Truyền thông Sinh viên"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                disabled={submitting}
                            />
                        </label>

                        <label className={styles.field}>
                            <span>Email liên hệ</span>
                            <div className={styles.inputIconWrap}>
                                <FontAwesomeIcon icon={faEnvelope} />
                                <input
                                    type="email"
                                    placeholder="contact@club.edu.vn"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                        </label>

                        <label className={styles.field}>
                            <span>Số điện thoại</span>
                            <div className={styles.inputIconWrap}>
                                <FontAwesomeIcon icon={faPhone} />
                                <input
                                    type="tel"
                                    placeholder="0901 234 567"
                                    value={phone}
                                    onChange={(event) => setPhone(event.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                        </label>

                        <label className={styles.field}>
                            <span>Mô tả ban tổ chức</span>
                            <textarea
                                placeholder="Giới thiệu ngắn gọn về mục tiêu, phạm vi hoạt động và đối tượng phụ trách của ban tổ chức"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                disabled={submitting}
                                rows={4}
                            />
                        </label>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.ghostButton} onClick={() => navigate('/organizations')}>
                            Hủy
                        </button>
                        <button type="submit" className={styles.primaryButton} disabled={submitting}>
                            {submitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu tạo ban tổ chức'}
                        </button>
                    </div>
                </form>

                <aside className={styles.sideCard}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2>Lưu ý trước khi gửi</h2>
                            <p>Thông tin này giúp admin duyệt nhanh và giảm số lần yêu cầu chỉnh sửa.</p>
                        </div>
                        <FontAwesomeIcon icon={faCircleInfo} className={styles.infoIcon} />
                    </div>

                    <ul className={styles.helperList}>
                        {helperItems.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>

                    <div className={styles.noticeBox}>
                        <strong>Gợi ý</strong>
                        <p>
                            Nếu ban tổ chức đại diện cho một câu lạc bộ hoặc đơn vị chính thức, hãy dùng email và số điện thoại đang hoạt động để phục vụ xác minh.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CreateOraganizer;