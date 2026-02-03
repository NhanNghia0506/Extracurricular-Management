import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './attendance.module.scss';

// Icon cho vị trí người dùng
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Icon cho điểm danh
const attendanceIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface AttendanceMapProps {
    // Tọa độ điểm danh từ cơ sở dữ liệu
    attendanceLocation?: LatLngExpression;
    attendanceLocationName?: string;
    attendanceRadius?: number; // Bán kính vùng điểm danh (mét)
}

const AttendanceMap: React.FC<AttendanceMapProps> = ({
    attendanceLocation = [21.0289, 105.8547],
    attendanceLocationName = 'Lecture Hall B, Level 3',
    attendanceRadius = 150
}) => {
    // Tọa độ mặc định (Hanoi, Vietnam)
    const defaultCenter: LatLngExpression = [21.0285, 105.8542];
    const [userLocation, setUserLocation] = useState<LatLngExpression>(defaultCenter);
    const mapRef = useRef(null);

    // Định vị vị trí người dùng hiện tại
    const handleLocate = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation([latitude, longitude]);
                // Flyto vị trí người dùng
                if (mapRef.current) {
                    const map = (mapRef.current as any).leafletElement || (mapRef.current as any);
                    map?.flyTo([latitude, longitude], 15);
                }
            });
        }
    };

    return (
        <div className={styles.mapColumn}>
            <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold"><i className="fa-solid fa-map me-2"></i>Campus Map</h5>
                <button className="btn btn-sm btn-light border" onClick={handleLocate}>
                    <i className="fa-solid fa-location-crosshairs me-1"></i> My Location
                </button>
            </div>

            <div className={styles.mapWrapper}>
                <MapContainer
                    center={defaultCenter}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    ref={mapRef}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* Vị trí người dùng */}
                    <Marker position={userLocation} icon={userIcon}>
                        <Popup>You are here</Popup>
                    </Marker>

                    {/* Vùng điểm danh từ cơ sở dữ liệu */}
                    <Marker position={attendanceLocation} icon={attendanceIcon}>
                        <Popup>{attendanceLocationName}</Popup>
                    </Marker>

                    {/* Vòng tròn vùng điểm danh */}
                    <Circle
                        center={attendanceLocation}
                        radius={attendanceRadius}
                        fillColor="red"
                        weight={2}
                        opacity={0.8}
                        color="red"
                        fillOpacity={0.15}
                    >
                        <Popup>Attendance Zone ({attendanceRadius}m)</Popup>
                    </Circle>
                </MapContainer>

                {/* Zoom & Locate Controls */}
                <div className="position-absolute bottom-0 end-0 m-3 d-flex flex-column gap-2">
                    <button
                        className="btn btn-white shadow-sm border p-2"
                        onClick={() => {
                            if (mapRef.current) {
                                const map = (mapRef.current as any).leafletElement || (mapRef.current as any);
                                map?.zoomIn();
                            }
                        }}
                    >
                        <i className="fa-solid fa-plus"></i>
                    </button>
                    <button
                        className="btn btn-white shadow-sm border p-2"
                        onClick={() => {
                            if (mapRef.current) {
                                const map = (mapRef.current as any).leafletElement || (mapRef.current as any);
                                map?.zoomOut();
                            }
                        }}
                    >
                        <i className="fa-solid fa-minus"></i>
                    </button>
                    <button
                        className="btn btn-white shadow-sm border p-2 text-primary"
                        onClick={handleLocate}
                    >
                        <i className="fa-solid fa-location-crosshairs"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceMap;