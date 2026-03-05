import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faFilter, faFileExport, faPlus,
    faUserFriends, faMapMarkerAlt,
    faCheckCircle, faTimesCircle,
    faFeed
} from '@fortawesome/free-solid-svg-icons';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { socketService } from '../../services/socket.service';
import type { CheckinEvent, CheckinResponse } from '../../types/checkin.types';
import type { ActivityDetailResponse } from '../../types/activity.types';
import checkinSessionService from '../../services/checkin-session.service';
import checkinService from '../../services/checkin.service';
import activityService from '../../services/activity.service';
import { formatTime } from '../../utils/date-time';
import styles from './attendance.dashboard.module.scss';

const methodData = [
    { name: 'QR Code', value: 142 },
    { name: 'Vân tay', value: 29 },
    { name: 'Thủ công', value: 14 },
];

const completionColors = ['#2563eb', '#e2e8f0'];

interface AttendanceDashboardProps {
    sessionId: string;
}

const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ sessionId }) => {
    const [checkins, setCheckins] = useState<CheckinResponse[]>([]);
    const [activity, setActivity] = useState<ActivityDetailResponse | null>(null);
    const [checkinSession, setCheckinSession] = useState<any>(null);
    const [totalRegistered, setTotalRegistered] = useState(0);
    const [loading, setLoading] = useState(true);
    const [remainingSeconds, setRemainingSeconds] = useState(0);

    // Fetch danh sách checkin ban đầu khi load trang
    useEffect(() => {
        if (!sessionId) return;

        const fetchInitialCheckins = async () => {
            try {
                setLoading(true);
                const response = await checkinService.getCheckinsBySessionId(sessionId, 'SUCCESS');
                console.log('Initial checkins fetched:', response.data); // Kiểm tra dữ liệu trả về
                // response = { total: number, data: CheckinResponse[] }
                setCheckins(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Không lấy được danh sách checkin:', error);
                setCheckins([]);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialCheckins();
    }, [sessionId]);

    // Realtime socket connection cho checkin mới
    useEffect(() => {
        if (!sessionId) return;

        const fetchCheckinSession = async () => {
            try {
                const response = await checkinSessionService.getById(sessionId);
                setCheckinSession(response.data?.data);
            } catch (error) {
                console.error('Không lấy được checkin session:', error);
            }
        };

        fetchCheckinSession();
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) return;

        const socket = socketService.connect('checking');

        const handleNewCheckin = (payload: CheckinEvent) => {
            setCheckins((prev) => {
                // Kiểm tra xem user này đã checkin chưa (dựa vào student.id)
                const existingIndex = prev.findIndex(
                    (item) => item.student.id === payload.student.id
                );

                // Nếu đã tồn tại, không thêm vào (tránh duplicate)
                if (existingIndex !== -1) {
                    return prev;
                }

                // Convert CheckinEvent sang CheckinResponse format
                const newCheckin: CheckinResponse = {
                    distance: payload.checkin.distance,
                    status: payload.checkin.status,
                    failReason: payload.checkin.failReason,
                    createdAt: new Date(payload.checkin.createdAt).toISOString(),
                    student: payload.student,
                };

                // Nếu chưa có, thêm vào đầu danh sách và giữ tối đa 30 items
                return [newCheckin, ...prev].slice(0, 30);
            });
        };

        socketService.on('checkin:new', handleNewCheckin);

        // Chờ socket connected trước khi emit join-session
        if (socket.connected) {
            socketService.emit('join-session', { sessionId });
        } else {
            socket.once('connect', () => {
                socketService.emit('join-session', { sessionId });
            });
        }

        return () => {
            socketService.emit('leave-session', { sessionId });
            socketService.off('checkin:new', handleNewCheckin);
        };
    }, [sessionId]);

    useEffect(() => {
        if (!sessionId) return;

        const fetchActivityBySessionId = async () => {
            try {
                const activityData = await checkinSessionService.getActivityBySessionId(sessionId);
                setActivity(activityData);
            } catch (error) {
                console.error('Không lấy được hoạt động từ sessionId:', error);
            }
        };

        fetchActivityBySessionId();
    }, [sessionId]);

    useEffect(() => {
        if (!activity?.id) {
            setTotalRegistered(0);
            return;
        }

        const fetchParticipantCount = async () => {
            try {
                const participantCount = await activityService.participantsCountByActivity(activity.id);
                setTotalRegistered(participantCount);
            } catch (error) {
                console.error('Không lấy được tổng số đăng ký:', error);
                setTotalRegistered(0);
            }
        };

        fetchParticipantCount();
    }, [activity?.id]);

    useEffect(() => {
        if (!checkinSession?.endTime) {
            setRemainingSeconds(0);
            return;
        }

        const updateRemainingTime = () => {
            const endTimeMs = new Date(checkinSession.endTime).getTime();
            const nowMs = Date.now();
            const diffSeconds = Math.max(Math.floor((endTimeMs - nowMs) / 1000), 0);
            setRemainingSeconds(diffSeconds);
        };

        updateRemainingTime();
        const timerId = window.setInterval(updateRemainingTime, 1000);

        return () => {
            window.clearInterval(timerId);
        };
    }, [checkinSession?.endTime]);

    const getRelativeTime = (timestamp: Date | string) => {
        const date = new Date(timestamp);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 10) return 'VỪA XONG';
        if (seconds < 60) return `${seconds}s trước`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} phút trước`;
        return formatTime(date);
    };

    const attendancePercent = totalRegistered > 0
        ? Math.round((checkins.length / totalRegistered) * 100)
        : 0;

    const attendanceProgress = totalRegistered > 0
        ? Math.min((checkins.length / totalRegistered) * 100, 100)
        : 0;

    const generateVelocityData = () => {
        if (!checkinSession?.startTime || !checkinSession?.endTime || checkins.length === 0) return [];

        const startTime = new Date(checkinSession.startTime);
        const endTime = new Date(checkinSession.endTime);

        const slots: Array<{ minute: string; checkins: number }> = [];

        // Tạo các slot 5 phút
        for (let time = new Date(startTime); time <= endTime; time.setMinutes(time.getMinutes() + 5)) {
            const hours = String(time.getHours()).padStart(2, '0');
            const minutes = String(time.getMinutes()).padStart(2, '0');
            const slotKey = `${hours}:${minutes}`;
            slots.push({ minute: slotKey, checkins: 0 });
        }

        // Đếm checkins vào từng slot 5 phút
        checkins.forEach((item) => {
            const checkinTime = new Date(item.createdAt);
            const hours = String(checkinTime.getHours()).padStart(2, '0');
            let currentMin = checkinTime.getMinutes();
            currentMin = Math.floor(currentMin / 5) * 5; // Làm tròn xuống đến 5 phút gần nhất
            const slotKey = `${hours}:${String(currentMin).padStart(2, '0')}`;

            const slot = slots.find((s) => s.minute === slotKey);
            if (slot) slot.checkins++;
        });

        return slots;
    };

    const chartData = generateVelocityData();

    const generateCompletionData = () => {
        const successCount = checkins.filter((item) => item.status === 'SUCCESS').length;
        const absentCount = Math.max(totalRegistered - successCount, 0);
        return [
            { name: 'Có mặt', value: successCount },
            { name: 'Vắng mặt', value: absentCount },
        ];
    };

    const dynamicCompletionData = generateCompletionData();
    const presentPercent = totalRegistered > 0
        ? Math.round((dynamicCompletionData[0].value / totalRegistered) * 100)
        : 0;

    const remainingHours = String(Math.floor(remainingSeconds / 3600)).padStart(2, '0');
    const remainingMinutes = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0');
    const remainingDisplaySeconds = String(remainingSeconds % 60).padStart(2, '0');

    const getSessionStatusLabel = () => {
        if (!checkinSession?.startTime || !checkinSession?.endTime) return 'CHƯA XÁC ĐỊNH';

        const now = Date.now();
        const startTimeMs = new Date(checkinSession.startTime).getTime();
        const endTimeMs = new Date(checkinSession.endTime).getTime();

        if (now < startTimeMs) return 'CHƯA DIỄN RA';
        if (now > endTimeMs) return 'ĐÃ KẾT THÚC';
        return 'ĐANG DIỄN RA';
    };

    return (
        <div className={styles.dashboardContainer}>
            {/* 1. Header Section */}
            <header className={styles.header}>
                <div className={styles.headerInfo}>
                    <span className={styles.activeBadge}>{getSessionStatusLabel()}</span>
                    <p className={styles.timeInfo}>
                        Bắt đầu: {formatTime(checkinSession?.startTime)} | Kết thúc: {formatTime(checkinSession?.endTime)}
                    </p>
                    <h1>{activity?.title || 'Đang tải hoạt động...'}</h1>
                    <p className={styles.location}>
                        <FontAwesomeIcon icon={faMapMarkerAlt} /> {activity?.location?.address || 'Đang tải địa điểm...'}
                    </p>
                </div>
                <div className={styles.timer}>
                    <span className={styles.timerLabel}>THỜI GIAN CÒN LẠI</span>
                    <div className={styles.countdown}>
                        <div className={styles.timeBlock}><span>{remainingHours}</span><small>GIỜ</small></div>
                        <div className={styles.timeBlock}><span>{remainingMinutes}</span><small>PHÚT</small></div>
                        <div className={styles.timeBlock}><span>{remainingDisplaySeconds}</span><small>GIÂY</small></div>
                    </div>
                </div>
            </header>

            {/* 2. Search & Action Bar */}
            <div className={styles.actionBar}>
                <div className={styles.searchBox}>
                    <FontAwesomeIcon icon={faSearch} />
                    <input type="text" placeholder="Tìm theo tên hoặc mã sinh viên..." />
                </div>
                <div className={styles.actions}>
                    <button className={styles.btnSecondary}><FontAwesomeIcon icon={faFilter} /> Bộ lọc</button>
                    <button className={styles.btnSecondary}><FontAwesomeIcon icon={faFileExport} /> Xuất CSV</button>
                    <button className={styles.btnPrimary}><FontAwesomeIcon icon={faPlus} /> Nhập thủ công</button>
                </div>
            </div>

            {/* 3. Stat Cards Grid */}
            <div className={styles.statGrid}>
                <div className={styles.statCard}>
                    <label>Tổng đăng ký</label>
                    <div className={styles.statValue}>{totalRegistered}</div>
                    <small><FontAwesomeIcon icon={faUserFriends} /> Sĩ số lớp</small>
                </div>
                <div className={`${styles.statCard} ${styles.green}`}>
                    <div className={styles.statHeader}>
                        <label>Đã check-in</label>
                        <span className={styles.percentage}>
                            {attendancePercent}%
                        </span>
                    </div>
                    <div className={styles.statValue}>{checkins.length}</div>
                    <progress className={styles.progressBarNative} value={attendanceProgress} max={100} />
                </div>
                {/* Tương tự cho Not Checked-in và Late Check-ins... */}
            </div>

            {/* 4. Main Content Grid */}
            <div className={styles.contentGrid}>
                {/* Left: Live Feed */}
                <aside className={styles.liveFeed}>
                    <div className={styles.feedHeader}>
                        <h3><FontAwesomeIcon icon={faFeed} /> Luồng điểm danh trực tiếp</h3>
                        <span className={styles.realtimeTag}>REAL-TIME</span>
                    </div>
                    <div className={styles.feedList}>
                        {loading && (
                            <div className={styles.feedPlaceholder}>
                                Đang tải danh sách checkin...
                            </div>
                        )}
                        {!loading && checkins.length === 0 && (
                            <div className={styles.feedPlaceholder}>
                                Chưa có ai checkin
                            </div>
                        )}
                        {!loading && checkins.map((item, index) => (
                            <div className={styles.feedItem} key={`${item.student.id}-${index}`}>
                                <div className={styles.avatar}>
                                    {item.student.name?.slice(0, 2).toUpperCase()}
                                </div>
                                <div className={styles.itemInfo}>
                                    <strong>{item.student.name}</strong>
                                    <small>MSSV: {item.student.mssv}</small>
                                    <span className={`${styles.method} ${item.status === 'SUCCESS' ? styles.success : styles.failed}`}>
                                        {item.status === 'SUCCESS' ? (
                                            <><FontAwesomeIcon icon={faCheckCircle} /> Thành công</>
                                        ) : (
                                            <><FontAwesomeIcon icon={faTimesCircle} /> {item.failReason || 'Thất bại'}</>
                                        )}
                                    </span>
                                </div>
                                <span className={styles.time}>{getRelativeTime(item.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Right: Charts */}
                <main className={styles.chartsArea}>
                    <div className={styles.velocityChart}>
                        <div className={styles.chartHeader}>
                            <h3>Tốc độ check-in</h3>
                            <select><option>15 phút gần nhất</option></select>
                        </div>
                        <div className={styles.chartPlaceholder}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                    <XAxis dataKey="minute" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value) => [`${value}`, 'Số lượt check-in']} />
                                    <Line
                                        type="monotone"
                                        dataKey="checkins"
                                        name="Số lượt check-in"
                                        stroke="#2563eb"
                                        strokeWidth={2}
                                        dot={{ r: 2 }}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={styles.bottomCharts}>
                        <div className={styles.methodDist}>
                            <h3>Phân bố phương thức</h3>
                            <div className={styles.distChartWrap}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={methodData} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                        <XAxis type="number" tick={{ fontSize: 11 }} />
                                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(value) => [`${value}`, 'Số lượt']} />
                                        <Bar dataKey="value" name="Số lượt" fill="#10b981" radius={[0, 6, 6, 0]} barSize={18} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className={styles.overallComp}>
                            <h3>Tổng quan hoàn thành</h3>
                            <div className={styles.pieChartWrap}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dynamicCompletionData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={46}
                                            outerRadius={66}
                                            paddingAngle={2}
                                        >
                                            {dynamicCompletionData.map((entry, index) => (
                                                <Cell key={entry.name} fill={completionColors[index % completionColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className={styles.pieCenterLabel}>
                                    <strong>{presentPercent}%</strong>
                                    <small>CÓ MẶT</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AttendanceDashboard;