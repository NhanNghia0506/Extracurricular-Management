import React, { useEffect, useRef, useState } from 'react';
import activityService from '../../services/activity.service';
import styles from './create.activity.module.scss';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const CreateActivity: React.FC = () => {
    // Dữ liệu mẫu cho Organizers
    const [organizers, setOrganizers] = useState([
        { id: 'org-1', name: 'Sarah Jenkins' },
        { id: 'org-2', name: 'Dr. Aris Thorne' }
    ]);
    const [categories] = useState([
        { id: 'cat-1', name: 'Học Tập' },
        { id: 'cat-2', name: 'Thể Thao' },
        { id: 'cat-3', name: 'Nghệ Thuật' },
    ]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [organizerId, setOrganizerId] = useState('');
    const [location, setLocation] = useState('University Central Courtyard, Wing A');
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [startAt, setStartAt] = useState('');
    const [endAt, setEndAt] = useState('');
    const [coordinates, setCoordinates] = useState<[number, number]>([20.8287, 106.6749]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [mapKey, setMapKey] = useState(0);
    const [markerPosition, setMarkerPosition] = useState<[number, number]>(coordinates);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setCoverPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return previewUrl;
        });

        setUploading(true);
        try {
            // TODO: Gọi API upload và lưu lại URL trả về từ server
            // const formData = new FormData();
            // formData.append('file', file);
            // const { data } = await axios.post('/api/upload', formData);
            // setCoverPreview(data.url);
        } catch (error) {
            console.error('Lỗi upload ảnh:', error);
            alert('Upload ảnh thất bại, vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (coverPreview) URL.revokeObjectURL(coverPreview);
        };
    }, [coverPreview]);

    // Hàm lấy vị trí hiện tại
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const newCoords: [number, number] = [latitude, longitude];
                    setCoordinates(newCoords);
                    setMarkerPosition(newCoords);
                    setMapKey(prev => prev + 1);
                    setLocation('Vị trí hiện tại');
                },
                (error) => {
                    // alert(error.message);
                    alert('Không thể lấy vị trí hiện tại. Vui lòng bật định vị GPS.');
                }
            );
        } else {
            alert('Trình duyệt không hỗ trợ định vị GPS.');
        }
    };
    const searchLocation = async (query: string) => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: query,
                    format: 'json',
                    limit: 1
                }
            });

            if (response.data.length > 0) {
                const { lat, lon } = response.data[0];
                const newCoords: [number, number] = [parseFloat(lat), parseFloat(lon)];
                setCoordinates(newCoords);
                setMarkerPosition(newCoords);
                setMapKey(prev => prev + 1);
            }
        } catch (error) {
            console.error('Lỗi tìm kiếm địa điểm:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle location input change với debounce
    const handleLocationChange = (value: string) => {
        setLocation(value);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchLocation(value);
        }, 1000);
    };

    // Component để xử lý click trên map
    const MapClickHandler = () => {
        useMapEvents({
            click(e) {
                setMarkerPosition([e.latlng.lat, e.latlng.lng]);
                setCoordinates([e.latlng.lat, e.latlng.lng]);
            },
        });
        return null;
    };

    const removeOrganizer = (id: string) => {
        setOrganizers(organizers.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage('');

        const errors: string[] = [];
        if (!title.trim()) errors.push('Tên hoạt động không được để trống.');
        if (!description.trim()) errors.push('Mô tả không được để trống.');
        if (!categoryId) errors.push('Vui lòng chọn danh mục.');
        if (!organizerId) errors.push('Vui lòng chọn người tổ chức.');
        if (!location.trim()) errors.push('Địa điểm không được để trống.');
        if (!startAt) errors.push('Vui lòng chọn thời gian bắt đầu.');
        if (!endAt) errors.push('Vui lòng chọn thời gian kết thúc.');
        if (startAt && endAt && new Date(startAt) >= new Date(endAt)) {
            errors.push('Thời gian kết thúc phải sau thời gian bắt đầu.');
        }

        if (errors.length) {
            setErrorMessage(errors.join(' '));
            return;
        }

        setSubmitting(true);
        try {
            await activityService.create({
                title,
                description,
                location,
                image: coverPreview || undefined,
                organizerId,
                categoryId,
                startAt: new Date(startAt).toISOString(),
                endAt: new Date(endAt).toISOString(),
            });

            alert('Tạo hoạt động thành công');
            setTitle('');
            setDescription('');
            setCategoryId('');
            setOrganizerId('');
            setStartAt('');
            setEndAt('');
        } catch (error) {
            console.error('Lỗi tạo activity:', error);
            setErrorMessage('Không thể tạo hoạt động. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.createWrapper}>
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
                        onClick={handleUploadClick}
                        disabled={uploading}
                    >
                        {uploading ? 'Đang tải...' : 'Tải Lên Ảnh'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleCoverFileChange}
                    />
                    {coverPreview && (
                        <div className={styles.previewWrapper}>
                            <img src={coverPreview} alt="Ảnh bìa xem trước" />
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Form Fields */}
            <form className={styles.formBody} onSubmit={handleSubmit}>
                {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}

                {/* Tên Hoạt Động */}
                <label>Tên Hoạt Động</label>
                <input
                    type="text"
                    className={styles.customInput}
                    placeholder="Ví dụ: Hội thảo Công nghệ Hàng năm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                {/* Danh Mục */}
                <label>Danh Mục Hoạt Động</label>
                <select
                    className={styles.customSelect}
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
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
                    onChange={(e) => setOrganizerId(e.target.value)}
                >
                    <option value="">Chọn người tổ chức</option>
                    {organizers.map((org) => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                </select>
                <div className={styles.tagContainer}>
                    {organizers.map(staff => (
                        <div key={staff.id} className={styles.tag}>
                            {staff.name}
                            <i className="fa-solid fa-xmark" onClick={() => removeOrganizer(staff.id)}></i>
                        </div>
                    ))}
                    <button type="button" className={styles.addStaffBtn}>+ Thêm Nhân Viên</button>
                </div>

                {/* Mô Tả */}
                <label>Mô Tả</label>
                <textarea
                    className={styles.customTextarea}
                    rows={4}
                    placeholder="Mô tả mục tiêu, lịch trình và yêu cầu của hoạt động ngoài khóa..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                ></textarea>

                {/* Thời gian bắt đầu */}
                <label>Thời Gian Bắt Đầu</label>
                <input
                    type="datetime-local"
                    className={styles.customInput}
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                />

                {/* Thời gian kết thúc */}
                <label>Thời Gian Kết Thúc</label>
                <input
                    type="datetime-local"
                    className={styles.customInput}
                    value={endAt}
                    min={startAt || undefined}
                    onChange={(e) => setEndAt(e.target.value)}
                />

                {/* Địa Điểm & Vòng Địa Lý */}
                <label>Địa Điểm</label>
                <div className="position-relative d-flex gap-2 align-items-start">
                    <div style={{ flex: 1, position: 'relative' }}>
                        <i className="fa-solid fa-location-dot" style={{ position: 'absolute', left: '12px', top: '15px', color: '#64748b', zIndex: 1 }}></i>
                        <input
                            type="text"
                            className={styles.customInput}
                            style={{ paddingLeft: '35px' }}
                            value={location}
                            onChange={(e) => handleLocationChange(e.target.value)}
                            placeholder="Nhập tên địa điểm..."
                        />
                    </div>
                    <span
                        onClick={(e) => {
                            e.preventDefault();
                            getCurrentLocation();
                        }}
                        style={{
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500',
                            padding: '8px 12px',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'color 0.3s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#2563eb')}
                        title="Lấy vị trí hiện tại"
                    >
                        <i className="fa-solid fa-location-crosshairs" style={{ marginRight: '6px' }}></i>
                        Vị trí hiện tại
                    </span>
                </div>
                {loading && <p style={{ color: '#2563eb', fontSize: '12px', marginTop: '5px' }}>Đang tìm kiếm...</p>}

                {/* Map Preview */}
                <div className={styles.mapContainer} key={mapKey}>
                    <MapContainer
                        center={L.latLng(coordinates[0], coordinates[1])}
                        zoom={15}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        <MapClickHandler />
                        <Marker position={markerPosition} icon={L.icon({
                            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                            shadowSize: [41, 41]
                        })} />
                    </MapContainer>
                </div>
                {/* Final Actions */}
                <div className={styles.mainActions}>
                    <button className={styles.btnPrimaryLarge} type="submit" disabled={submitting}>
                        <i className="fa-solid fa-paper-plane"></i>
                        {submitting ? 'Đang gửi...' : 'Đăng bài'}
                    </button>
                    <button className={styles.btnDraft} type="button" disabled={submitting}>Lưu Bản Nháp</button>
                </div>
            </form>
        </div>
    );
};

export default CreateActivity;