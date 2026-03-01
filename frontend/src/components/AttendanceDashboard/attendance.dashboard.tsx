import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faFilter, faFileExport, faPlus,
    faUserFriends, faRss, faMapMarkerAlt, faQrcode
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
import styles from './attendance.dashboard.module.scss';

const velocityData = [
    { minute: '09:00', checkins: 8 },
    { minute: '09:05', checkins: 14 },
    { minute: '09:10', checkins: 22 },
    { minute: '09:15', checkins: 36 },
    { minute: '09:20', checkins: 52 },
    { minute: '09:25', checkins: 67 },
    { minute: '09:30', checkins: 81 },
    { minute: '09:35', checkins: 98 },
    { minute: '09:40', checkins: 121 },
    { minute: '09:45', checkins: 145 },
    { minute: '09:50', checkins: 165 },
    { minute: '09:55', checkins: 185 },
];

const methodData = [
    { name: 'QR Code', value: 142 },
    { name: 'Vân tay', value: 29 },
    { name: 'Thủ công', value: 14 },
];

const completionData = [
    { name: 'Có mặt', value: 185 },
    { name: 'Vắng mặt', value: 65 },
];

const completionColors = ['#2563eb', '#e2e8f0'];

const AttendanceDashboard: React.FC = () => {
    return (
        <div className={styles.dashboardContainer}>
            {/* 1. Header Section */}
            <header className={styles.header}>
                <div className={styles.headerInfo}>
                    <span className={styles.activeBadge}>ĐANG DIỄN RA</span>
                    <p className={styles.timeInfo}>Bắt đầu: 09:00 | Kết thúc: 10:30</p>
                    <h1>CS101: Nhập môn Khoa học Máy tính</h1>
                    <p className={styles.location}><FontAwesomeIcon icon={faMapMarkerAlt} /> Hội trường chính, Tòa nhà A</p>
                </div>
                <div className={styles.timer}>
                    <span className={styles.timerLabel}>THỜI GIAN CÒN LẠI</span>
                    <div className={styles.countdown}>
                        <div className={styles.timeBlock}><span>00</span><small>GIỜ</small></div>
                        <div className={styles.timeBlock}><span>45</span><small>PHÚT</small></div>
                        <div className={styles.timeBlock}><span>12</span><small>GIÂY</small></div>
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
                    <div className={styles.statValue}>250</div>
                    <small><FontAwesomeIcon icon={faUserFriends} /> Sĩ số lớp</small>
                </div>
                <div className={`${styles.statCard} ${styles.green}`}>
                    <div className={styles.statHeader}>
                        <label>Đã check-in</label>
                        <span className={styles.percentage}>74%</span>
                    </div>
                    <div className={styles.statValue}>185</div>
                    <div className={styles.progressBar}><div style={{ width: '74%' }} /></div>
                </div>
                {/* Tương tự cho Not Checked-in và Late Check-ins... */}
            </div>

            {/* 4. Main Content Grid */}
            <div className={styles.contentGrid}>
                {/* Left: Live Feed */}
                <aside className={styles.liveFeed}>
                    <div className={styles.feedHeader}>
                        <h3><FontAwesomeIcon icon={faRss} /> Luồng điểm danh trực tiếp</h3>
                        <span className={styles.realtimeTag}>THỜI GIAN THỰC</span>
                    </div>
                    <div className={styles.feedList}>
                        <div className={styles.feedItem}>
                            <div className={styles.avatar}>AT</div>
                            <div className={styles.itemInfo}>
                                <strong>Alex Thompson</strong>
                                <small>MSSV: 2024-0012</small>
                                <span className={styles.method}><FontAwesomeIcon icon={faQrcode} /> Quét mã QR</span>
                            </div>
                            <span className={styles.time}>VỪA XONG</span>
                        </div>
                        {/* Thêm các FeedItem khác... */}
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
                                <LineChart data={velocityData}>
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
                                            data={completionData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={46}
                                            outerRadius={66}
                                            paddingAngle={2}
                                        >
                                            {completionData.map((entry, index) => (
                                                <Cell key={entry.name} fill={completionColors[index % completionColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className={styles.pieCenterLabel}>
                                    <strong>74%</strong>
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