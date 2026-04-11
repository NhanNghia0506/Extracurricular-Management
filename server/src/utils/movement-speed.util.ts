import { calculateHaversineDistance } from './haversine.util';

export interface CheckinRecord {
    latitude: number;
    longitude: number;
    createdAt: Date;
}

export interface MovementSpeedResult {
    isAnomalous: boolean;
    speedKmh: number;
    distanceMeters: number;
    timeIntervalSeconds: number;
    anomalyReason?: string;
}

/**
 * Tính tốc độ di chuyển giữa 2 lần check-in
 * @param previousCheckin Check-in trước
 * @param currentCheckin Check-in hiện tại
 * @param speedThresholdKmh Ngưỡng tốc độ cảnh báo (mặc định 100 km/h)
 * @returns Kết quả phân tích tốc độ
 */
export function calculateMovementSpeed(
    previousCheckin: CheckinRecord,
    currentCheckin: CheckinRecord,
    speedThresholdKmh: number = 100,
): MovementSpeedResult {
    // Tính khoảng cách (mét)
    const distanceMeters = calculateHaversineDistance(
        previousCheckin.latitude,
        previousCheckin.longitude,
        currentCheckin.latitude,
        currentCheckin.longitude,
    );

    // Tính khoảng thời gian (giây)
    const prevTime = new Date(previousCheckin.createdAt).getTime();
    const currTime = new Date(currentCheckin.createdAt).getTime();
    const timeIntervalMs = currTime - prevTime;
    const timeIntervalSeconds = timeIntervalMs / 1000;

    // Tránh chia cho 0 (nếu 2 check-in cùng thời điểm)
    if (timeIntervalSeconds <= 0) {
        return {
            isAnomalous: true,
            speedKmh: Infinity,
            distanceMeters,
            timeIntervalSeconds: 0,
            anomalyReason: 'Check-in cùng thời điểm - có khả năng giả mạo',
        };
    }

    // Tính tốc độ: distance (m) / time (s) * 3.6 = km/h
    const speedKmh = (distanceMeters / timeIntervalSeconds) * 3.6;

    // Kiểm tra bất thường
    const isAnomalous = speedKmh > speedThresholdKmh;
    let anomalyReason: string | undefined;

    if (isAnomalous) {
        anomalyReason = `Tốc độ di chuyển ${speedKmh.toFixed(2)} km/h vượt ngưỡng ${speedThresholdKmh} km/h (khoảng cách: ${distanceMeters.toFixed(2)}m, thời gian: ${timeIntervalSeconds.toFixed(0)}s)`;
    }

    return {
        isAnomalous,
        speedKmh: parseFloat(speedKmh.toFixed(2)),
        distanceMeters: parseFloat(distanceMeters.toFixed(2)),
        timeIntervalSeconds: parseFloat(timeIntervalSeconds.toFixed(2)),
        anomalyReason,
    };
}

/**
 * Kiểm tra bất thường dựa trên tốc độ di chuyển
 * @param previousCheckin Check-in trước
 * @param currentCheckin Check-in hiện tại
 * @param speedThresholdKmh Ngưỡng tốc độ (mặc định 100)
 * @returns true nếu phát hiện bất thường
 */
export function isMovementAnomalous(
    previousCheckin: CheckinRecord,
    currentCheckin: CheckinRecord,
    speedThresholdKmh: number = 100,
): boolean {
    const result = calculateMovementSpeed(previousCheckin, currentCheckin, speedThresholdKmh);
    return result.isAnomalous;
}
