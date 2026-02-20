/**
 * Tính toán khoảng cách giữa hai tọa độ địa lý bằng công thức Haversine
 * @param lat1 Vĩ độ điểm 1
 * @param lon1 Kinh độ điểm 1
 * @param lat2 Vĩ độ điểm 2
 * @param lon2 Kinh độ điểm 2
 * @returns Khoảng cách tính bằng mét
 */
export function calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R = 6371000; // Bán kính Trái Đất tính bằng mét

    // Chuyển đổi từ độ sang radian
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

/**
 * Kiểm tra xem một vị trị có nằm trong vòng tròn hay không
 * @param userLat Vĩ độ của người dùng
 * @param userLon Kinh độ của người dùng
 * @param centerLat Vĩ độ tâm vòng tròn
 * @param centerLon Kinh độ tâm vòng tròn
 * @param radiusMeters Bán kính vòng tròn tính bằng mét
 * @returns true nếu người dùng nằm trong vòng tròn, false nếu không
 */
export function isLocationWithinRadius(
    userLat: number,
    userLon: number,
    centerLat: number,
    centerLon: number,
    radiusMeters: number,
): boolean {
    const distance = calculateHaversineDistance(
        userLat,
        userLon,
        centerLat,
        centerLon,
    );
    return distance <= radiusMeters;
}
