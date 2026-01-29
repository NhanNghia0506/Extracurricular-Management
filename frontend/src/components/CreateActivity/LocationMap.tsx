import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './create.activity.module.scss';

interface LocationMapProps {
    coordinates: [number, number];
    markerPosition: [number, number];
    location: string;
    loading: boolean;
    mapKey: number;
    onLocationChange: (value: string) => void;
    onGetCurrentLocation: () => void;
    onMapClick: (lat: number, lng: number) => void;
}

const LocationMap: React.FC<LocationMapProps> = ({
    coordinates,
    markerPosition,
    location,
    loading,
    mapKey,
    onLocationChange,
    onGetCurrentLocation,
    onMapClick
}) => {
    const MapClickHandler = () => {
        useMapEvents({
            click(e) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            },
        });
        return null;
    };

    return (
        <div>
            <label>Địa Điểm</label>
            <div className="position-relative d-flex gap-2 align-items-start">
                <div style={{ flex: 1, position: 'relative' }}>
                    <i className="fa-solid fa-location-dot" style={{ position: 'absolute', left: '12px', top: '15px', color: '#64748b', zIndex: 1 }}></i>
                    <input
                        type="text"
                        className={styles.customInput}
                        style={{ paddingLeft: '35px' }}
                        value={location}
                        onChange={(e) => onLocationChange(e.target.value)}
                        placeholder="Nhập tên địa điểm..."
                    />
                </div>
                <span
                    onClick={(e) => {
                        e.preventDefault();
                        onGetCurrentLocation();
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
        </div>
    );
};

export default LocationMap;
