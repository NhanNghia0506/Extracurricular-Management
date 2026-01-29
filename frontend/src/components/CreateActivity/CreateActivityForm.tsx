import React from 'react';
import LocationMap from './LocationMap';
import styles from './create.activity.module.scss';

interface CreateActivityFormProps {
    title: string;
    description: string;
    categoryId: string;
    organizerId: string;
    startAt: string;
    endAt: string;
    coverPreview: string | null;
    uploading: boolean;
    submitting: boolean;
    errorMessage: string;
    categories: Array<{ id: string; name: string }>;
    organizers: Array<{ id: string; name: string }>;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
    onOrganizerChange: (value: string) => void;
    onStartAtChange: (value: string) => void;
    onEndAtChange: (value: string) => void;
    onUploadClick: () => void;
    onCoverFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    // Location props
    coordinates: [number, number];
    markerPosition: [number, number];
    location: string;
    loading: boolean;
    mapKey: number;
    onLocationChange: (value: string) => void;
    onGetCurrentLocation: () => void;
    onMapClick: (lat: number, lng: number) => void;
}

const CreateActivityForm: React.FC<CreateActivityFormProps> = ({
    title,
    description,
    categoryId,
    organizerId,
    startAt,
    endAt,
    coverPreview,
    uploading,
    submitting,
    errorMessage,
    categories,
    organizers,
    fileInputRef,
    onTitleChange,
    onDescriptionChange,
    onCategoryChange,
    onOrganizerChange,
    onStartAtChange,
    onEndAtChange,
    onUploadClick,
    onCoverFileChange,
    onSubmit,
    // Location props
    coordinates,
    markerPosition,
    location,
    loading,
    mapKey,
    onLocationChange,
    onGetCurrentLocation,
    onMapClick
}) => {
    return (
        <>
            {/* 1. Header Bar */}
            <div className={styles.topHeader}>
                <button className="btn p-0"><i className="fa-solid fa-arrow-left"></i></button>
                <h4>Đăng hoạt động</h4>
            </div>

            {/* 2. Upload Cover Photo */}
            <div className={styles.uploadSection}>
                <div className={styles.uploadBox}>
                    <div className={styles.uploadIcon}>
                        <i className="fa-solid fa-camera-retro"></i>
                    </div>
                    <h6>Thêm Ảnh Bìa</h6>
                    <p>Tải lên ảnh JPG hoặc PNG chất lượng cao (tỷ lệ 16:9)</p>
                    <button
                        type="button"
                        className={styles.cyanBtnSmall}
                        onClick={onUploadClick}
                        disabled={uploading}
                    >
                        {uploading ? 'Đang tải...' : 'Tải Lên Ảnh'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={onCoverFileChange}
                    />
                    {coverPreview && (
                        <div className={styles.previewWrapper}>
                            <img src={coverPreview} alt="Ảnh bìa xem trước" />
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Form Fields */}
            <form className={styles.formBody} onSubmit={onSubmit}>
                {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

                {/* Tên Hoạt Động */}
                <label>Tên Hoạt Động</label>
                <input
                    type="text"
                    className={styles.customInput}
                    placeholder="Ví dụ: Hội thảo Công nghệ Hàng năm"
                    value={title}
                    onChange={(e) => onTitleChange(e.target.value)}
                />

                {/* Danh Mục */}
                <label>Danh Mục Hoạt Động</label>
                <select
                    className={styles.customSelect}
                    value={categoryId}
                    onChange={(e) => onCategoryChange(e.target.value)}
                >
                    <option value="">Chọn loại hoạt động</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                {/* Gán Người Tổ Chức */}
                <label>Gán Người Tổ Chức</label>
                <select
                    className={styles.customSelect}
                    value={organizerId}
                    onChange={(e) => onOrganizerChange(e.target.value)}
                >
                    <option value="">Chọn người tổ chức</option>
                    {organizers.map((org) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                </select>

                {/* Mô Tả */}
                <label>Mô Tả</label>
                <textarea
                    className={styles.customTextarea}
                    rows={4}
                    placeholder="Mô tả mục tiêu, lịch trình và yêu cầu của hoạt động ngoài khóa..."
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                ></textarea>

                {/* Thời gian bắt đầu */}
                <label>Thời Gian Bắt Đầu</label>
                <input
                    type="datetime-local"
                    className={styles.customInput}
                    value={startAt}
                    onChange={(e) => onStartAtChange(e.target.value)}
                />

                {/* Thời gian kết thúc */}
                <label>Thời Gian Kết Thúc</label>
                <input
                    type="datetime-local"
                    className={styles.customInput}
                    value={endAt}
                    min={startAt || undefined}
                    onChange={(e) => onEndAtChange(e.target.value)}
                />

                {/* Location & Map */}
                <LocationMap
                    coordinates={coordinates}
                    markerPosition={markerPosition}
                    location={location}
                    loading={loading}
                    mapKey={mapKey}
                    onLocationChange={onLocationChange}
                    onGetCurrentLocation={onGetCurrentLocation}
                    onMapClick={onMapClick}
                />

                {/* Final Actions */}
                <div className={styles.mainActions}>
                    <button className={styles.btnPrimaryLarge} type="submit" disabled={submitting}>
                        <i className="fa-solid fa-paper-plane"></i>
                        {submitting ? 'Đang gửi...' : 'Đăng bài'}
                    </button>
                    <button className={styles.btnDraft} type="button" disabled={submitting}>Lưu Bản Nháp</button>
                </div>
            </form>
        </>
    );
};

export default CreateActivityForm;
