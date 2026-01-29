import { useState, useRef } from 'react';
import axios from 'axios';

export const useLocationMap = () => {
    const [coordinates, setCoordinates] = useState<[number, number]>([20.8287, 106.6749]);
    const [location, setLocation] = useState('University Central Courtyard, Wing A');
    const [markerPosition, setMarkerPosition] = useState<[number, number]>(coordinates);
    const [loading, setLoading] = useState(false);
    const [mapKey, setMapKey] = useState(0);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    const newCoords: [number, number] = [latitude, longitude];
                    setCoordinates(newCoords);
                    setMarkerPosition(newCoords);
                    setMapKey(prev => prev + 1);

                    // Reverse geocoding để lấy tên địa chỉ từ tọa độ
                    try {
                        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                            params: {
                                lat: latitude,
                                lon: longitude,
                                format: 'json'
                            }
                        });

                        if (response.data.address) {
                            const addressName = response.data.address.city || 
                                              response.data.address.district || 
                                              response.data.address.county || 
                                              response.data.address.village ||
                                              response.data.display_name.split(',')[0];
                            setLocation(addressName);
                        } else {
                            setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                        }
                    } catch (error) {
                        console.error('Lỗi reverse geocoding:', error);
                        setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                    }
                },
                (error) => {
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

    const handleLocationChange = (value: string) => {
        setLocation(value);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchLocation(value);
        }, 1000);
    };

    return {
        coordinates,
        location,
        markerPosition,
        loading,
        mapKey,
        setCoordinates,
        setLocation,
        setMarkerPosition,
        getCurrentLocation,
        searchLocation,
        handleLocationChange
    };
};
