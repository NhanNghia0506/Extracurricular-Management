import React, { useState, useEffect, useRef } from 'react';
import styles from './create.activity.module.scss';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const CreateActivity: React.FC = () => {
    // Dữ liệu mẫu cho Organizers
    const [organizers, setOrganizers] = useState([
        { id: 1, name: 'Sarah Jenkins' },
        { id: 2, name: 'Dr. Aris Thorne' }
    ]);

    const [radius, setRadius] = useState(50);
    const [location, setLocation] = useState('University Central Courtyard, Wing A');
    const [coordinates, setCoordinates] = useState<[number, number]>([20.8287, 106.6749]);
    const [loading, setLoading] = useState(false);
    const [mapKey, setMapKey] = useState(0);
    const [markerPosition, setMarkerPosition] = useState<[number, number]>(coordinates);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

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
                    alert(error.message);
                    // alert('Không thể lấy vị trí hiện tại. Vui lòng bật định vị GPS.');
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

    const removeOrganizer = (id: number) => {
        setOrganizers(organizers.filter(item => item.id !== id));
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
                    <button className={styles.cyanBtnSmall}>Tải Lên Ảnh</button>
                </div>
            </div>

            {/* 3. Form Fields */}
            <form className={styles.formBody}>
                {/* Tên Hoạt Động */}
                <label>Tên Hoạt Động</label>
                <input
                    type="text"
                    className={styles.customInput}
                    placeholder="Ví dụ: Hội thảo Công nghệ Hàng năm"
                />

                {/* Danh Mục */}
                <label>Danh Mục Hoạt Động</label>
                <select className={styles.customSelect}>
                    <option>Chọn loại hoạt động</option>
                    <option>Học Tập</option>
                    <option>Thể Thao</option>
                    <option>Nghệ Thuật</option>
                </select>

                {/* Gán Người Tổ Chức */}
                <label>Gán Người Tổ Chức</label>
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
                ></textarea>

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
            </form>

            {/* Final Actions */}
            <div className={styles.mainActions}>
                <button className={styles.btnPrimaryLarge}>
                    <i className="fa-solid fa-paper-plane"></i>
                    Đăng bài
                </button>
                <button className={styles.btnDraft}>Lưu Bản Nháp</button>
            </div>
        </div>
    );
};

export default CreateActivity;