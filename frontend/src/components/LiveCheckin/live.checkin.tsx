import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowsRotate,
  faCircle,
  faTableColumns,
  faClock,
  faCrosshairs,
  faExpand,
  faLocationDot,
  faLocationCrosshairs,
  faMapLocationDot,
  faSignal,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L, { DivIcon, LatLngBounds, LatLngExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './live.checkin.module.scss';
import type { ActivityDetailResponse } from '../../types/activity.types';
import type { CheckinSession } from '../../types/checkin-session.types';
import type { CheckinEvent, CheckinResponse } from '../../types/checkin.types';
import checkinService from '../../services/checkin.service';
import checkinSessionService from '../../services/checkin-session.service';
import { socketService } from '../../services/socket.service';

const sessionLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultCenter: LatLngTuple = [10.7769, 106.7009];

const buildAssetUrl = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return value;
  }

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
  return `${apiBaseUrl.replace(/\/$/, '')}/uploads/${value}`;
};

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const buildInitials = (name: string) => {
  const tokens = name.trim().split(/\s+/).filter(Boolean);

  if (tokens.length >= 2) {
    return `${tokens[tokens.length - 2][0] || ''}${tokens[tokens.length - 1][0] || ''}`.toUpperCase();
  }

  return (tokens[0] || '?').slice(0, 2).toUpperCase();
};

const buildCheckinMarkerIcon = (checkin: CheckinResponse, isSelected: boolean): DivIcon => {
  const avatarUrl = buildAssetUrl(checkin.student.avatar);
  const label = escapeHtml(checkin.student.name);
  const initials = escapeHtml(buildInitials(checkin.student.name));
  const borderColor = isSelected ? '#2563eb' : '#ffffff';
  const shadow = isSelected
    ? '0 10px 22px rgba(37, 99, 235, 0.26)'
    : '0 8px 20px rgba(15, 23, 42, 0.18)';

  return L.divIcon({
    className: '',
    iconSize: [110, 54],
    iconAnchor: [28, 46],
    popupAnchor: [0, -42],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;pointer-events:none;">
        <div style="display:flex;align-items:center;gap:8px;padding:4px 10px;border-radius:999px;background:rgba(15,23,42,0.82);color:#fff;font-size:11px;font-weight:700;box-shadow:${shadow};max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          <span style="width:8px;height:8px;border-radius:999px;background:#22c55e;flex-shrink:0;"></span>
          <span style="overflow:hidden;text-overflow:ellipsis;">${label}</span>
        </div>
        ${avatarUrl
        ? `<img src="${escapeHtml(avatarUrl)}" alt="${label}" style="width:36px;height:36px;border-radius:999px;border:3px solid ${borderColor};object-fit:cover;background:#fff;box-shadow:${shadow};" />`
        : `<div style="width:36px;height:36px;border-radius:999px;border:3px solid ${borderColor};display:flex;align-items:center;justify-content:center;background:#0f766e;color:#fff;font-size:12px;font-weight:700;box-shadow:${shadow};">${initials}</div>`}
      </div>
    `,
  });
};

const formatDateTime = (value?: string | Date) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
};

const getSessionStatus = (session?: CheckinSession | null) => {
  if (!session) {
    return { label: 'Không xác định', tone: 'neutral' as const };
  }

  const now = Date.now();
  const startTime = new Date(session.startTime).getTime();
  const endTime = new Date(session.endTime).getTime();

  if (now < startTime) {
    return { label: 'Sắp diễn ra', tone: 'warning' as const };
  }

  if (now > endTime) {
    return { label: 'Đã kết thúc', tone: 'danger' as const };
  }

  return { label: 'Đang hoạt động', tone: 'success' as const };
};

const MapViewportController: React.FC<{
  center: LatLngTuple;
  checkins: CheckinResponse[];
  selectedCheckin: CheckinResponse | null;
}> = ({ center, checkins, selectedCheckin }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedCheckin) {
      map.flyTo([selectedCheckin.latitude, selectedCheckin.longitude], Math.max(map.getZoom(), 17), {
        duration: 0.7,
      });
      return;
    }

    if (checkins.length === 0) {
      map.setView(center, 16);
      return;
    }

    const bounds = new LatLngBounds([center]);
    checkins.forEach((item) => {
      bounds.extend([item.latitude, item.longitude]);
    });
    map.fitBounds(bounds.pad(0.2));
  }, [center, checkins, map, selectedCheckin]);

  return null;
};

const LiveCheckin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('checkinsession');
  const [checkinSession, setCheckinSession] = useState<CheckinSession | null>(null);
  const [activity, setActivity] = useState<ActivityDetailResponse | null>(null);
  const [checkins, setCheckins] = useState<CheckinResponse[]>([]);
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const center = useMemo<LatLngTuple>(() => {
    if (!checkinSession?.location) {
      return defaultCenter;
    }

    return [checkinSession.location.latitude, checkinSession.location.longitude];
  }, [checkinSession]);

  const sessionStatus = getSessionStatus(checkinSession);
  const latestCheckin = selectedCheckin || checkins[0] || null;

  const goToDashboard = () => {
    if (!sessionId) {
      return;
    }

    navigate(`/attendance-dashboard?sessionId=${sessionId}`);
  };

  const loadData = async (options?: { silent?: boolean }) => {
    if (!sessionId) {
      setError('Không tìm thấy checkin session trong URL. Hãy dùng dạng ?checkinsession=...');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      if (options?.silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [sessionResponse, activityData, checkinResponse] = await Promise.all([
        checkinSessionService.getById(sessionId),
        checkinSessionService.getActivityBySessionId(sessionId),
        checkinService.getCheckinsBySessionId(sessionId, 'SUCCESS'),
      ]);

      const sessionData = sessionResponse.data?.data ?? null;
      const checkinData = Array.isArray(checkinResponse.data) ? checkinResponse.data : [];

      setCheckinSession(sessionData);
      setActivity(activityData || null);
      setCheckins(checkinData);
      setSelectedCheckin((current) => {
        if (!current) {
          return checkinData[0] || null;
        }

        return checkinData.find((item) => item.student.id === current.student.id) || checkinData[0] || null;
      });
    } catch (fetchError) {
      console.error('Không tải được dữ liệu live checkin:', fetchError);
      setError('Không tải được dữ liệu live check-in cho session này.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const socket = socketService.connect('checking');

    const handleNewCheckin = (payload: CheckinEvent) => {
      if (String(payload.checkin.checkinSessionId) !== sessionId || payload.checkin.status !== 'SUCCESS') {
        return;
      }

      const realtimeItem: CheckinResponse = {
        _id: payload.checkin._id,
        userId: payload.student.id,
        latitude: payload.checkin.latitude,
        longitude: payload.checkin.longitude,
        distance: payload.checkin.distance,
        status: payload.checkin.status,
        failReason: payload.checkin.failReason ?? null,
        createdAt: new Date(payload.checkin.createdAt).toISOString(),
        student: payload.student,
      };

      setCheckins((prev) => {
        const withoutCurrent = prev.filter((item) => item.student.id !== realtimeItem.student.id);
        return [realtimeItem, ...withoutCurrent];
      });
      setSelectedCheckin(realtimeItem);
    };

    socketService.on('checkin:new', handleNewCheckin);

    if (socket.connected) {
      socket.emit('join-session', { sessionId });
    } else {
      socket.once('connect', () => {
        socket.emit('join-session', { sessionId });
      });
    }

    return () => {
      socket.emit('leave-session', { sessionId });
      socketService.off('checkin:new', handleNewCheckin);
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className={styles.stateCard}>
        <strong>Đang tải bản đồ live check-in...</strong>
        <span>Hệ thống đang lấy check-in session, hoạt động và danh sách người đã điểm danh.</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateCard}>
        <strong>Không thể hiển thị bản đồ</strong>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={styles.mapWrapper}>
      <div className={styles.mapCanvas}>
        <MapContainer center={center} zoom={16} scrollWheelZoom className={styles.leafletMap}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapViewportController center={center} checkins={checkins} selectedCheckin={selectedCheckin} />

          <Marker position={center as LatLngExpression} icon={sessionLocationIcon}>
            <Popup>
              <strong>{activity?.title || 'Vị trí check-in'}</strong>
              <div>{checkinSession?.location.address}</div>
              <div>Bán kính: {checkinSession?.radiusMetters || 0}m</div>
            </Popup>
          </Marker>

          <Circle
            center={center as LatLngExpression}
            radius={checkinSession?.radiusMetters || 0}
            pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.14, weight: 2 }}
          />

          {checkins.map((checkin) => (
            <Marker
              key={checkin._id}
              position={[checkin.latitude, checkin.longitude]}
              icon={buildCheckinMarkerIcon(checkin, latestCheckin?._id === checkin._id)}
              eventHandlers={{ click: () => setSelectedCheckin(checkin) }}
            >
              <Popup>
                <div className={styles.popupCard}>
                  <strong>{checkin.student.name}</strong>
                  <span>MSSV: {checkin.student.mssv}</span>
                  <span>Lớp: {checkin.student.class || 'N/A'}</span>
                  <span>Check-in: {formatDateTime(checkin.createdAt)}</span>
                  <span>Khoảng cách: {Math.round(checkin.distance)}m</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className={styles.mapLegend}>
          <span><i className={styles.zoneDot}></i> Vùng check-in</span>
          <span><i className={styles.userDot}></i> Sinh viên đã check-in</span>
        </div>
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.statBox}>
          <div className={styles.statHeader}>
            <div>
              <span className={styles.eyebrow}>Live Check-in Map</span>
              <h3>{activity?.title || 'Check-in session'}</h3>
            </div>
            <span className={`${styles.activeTag} ${styles[sessionStatus.tone]}`}>{sessionStatus.label}</span>
          </div>

          <div className={styles.metaRow}>
            <span><FontAwesomeIcon icon={faLocationDot} /> {checkinSession?.location.address || 'Chưa có vị trí'}</span>
            <span><FontAwesomeIcon icon={faClock} /> {formatDateTime(checkinSession?.startTime)} - {formatDateTime(checkinSession?.endTime)}</span>
          </div>

          <div className={styles.statGrid}>
            <div>
              <strong>{checkins.length}</strong>
              <small>Đã check-in</small>
            </div>
            <div>
              <strong>{checkinSession?.radiusMetters || 0}m</strong>
              <small>Bán kính hợp lệ</small>
            </div>
            <div>
              <strong>{latestCheckin ? 'Live' : '--'}</strong>
              <small>Tín hiệu</small>
            </div>
          </div>

          <div className={styles.actionRow}>
            <div className={styles.viewSwitch}>
              <button type="button" className={styles.switchBtn} onClick={goToDashboard} disabled={!sessionId}>
                <FontAwesomeIcon icon={faTableColumns} /> Dashboard
              </button>
              <button type="button" className={`${styles.switchBtn} ${styles.activeSwitchBtn}`}>
                <FontAwesomeIcon icon={faLocationCrosshairs} /> Bản đồ realtime
              </button>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={() => loadData({ silent: true })}>
              <FontAwesomeIcon icon={faArrowsRotate} /> {refreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
            </button>
          </div>
        </div>

        <div className={styles.userCard}>
          <div className={styles.userCardHeader}>
            <span><FontAwesomeIcon icon={faMapLocationDot} /> Thông tin marker đang chọn</span>
          </div>

          {latestCheckin ? (
            <>
              <div className={styles.userIdentity}>
                <img src={buildAssetUrl(latestCheckin.student.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(latestCheckin.student.name)}`} alt={latestCheckin.student.name} />
                <div>
                  <strong>{latestCheckin.student.name}</strong>
                  <span>MSSV: {latestCheckin.student.mssv}</span>
                  <small>{latestCheckin.student.class || 'Chưa có lớp'} • {latestCheckin.student.faculty || 'Chưa có khoa'}</small>
                </div>
              </div>

              <div className={styles.userFacts}>
                <div><FontAwesomeIcon icon={faCrosshairs} /> {latestCheckin.latitude.toFixed(6)}, {latestCheckin.longitude.toFixed(6)}</div>
                <div><FontAwesomeIcon icon={faSignal} /> Khoảng cách tới tâm: {Math.round(latestCheckin.distance)}m</div>
                <div><FontAwesomeIcon icon={faClock} /> Check-in lúc: {formatDateTime(latestCheckin.createdAt)}</div>
              </div>
            </>
          ) : (
            <div className={styles.emptyText}>Chưa có ai check-in thành công trong session này.</div>
          )}
        </div>

        <div className={styles.feedBox}>
          <div className={styles.feedHeader}>
            <span><FontAwesomeIcon icon={faCircle} className={styles.pulse} /> Danh sách check-in trực tuyến</span>
            <span className={styles.feedCount}><FontAwesomeIcon icon={faUsers} /> {checkins.length}</span>
          </div>
          <div className={styles.feedList}>
            {checkins.length === 0 && <div className={styles.emptyText}>Chưa có dữ liệu check-in.</div>}

            {checkins.map((checkin) => (
              <button
                key={checkin._id}
                type="button"
                className={`${styles.feedItem} ${latestCheckin?._id === checkin._id ? styles.activeFeedItem : ''}`}
                onClick={() => setSelectedCheckin(checkin)}
              >
                <div className={`${styles.icon} ${styles.enter}`}>✓</div>
                <div className={styles.feedContent}>
                  <strong>{checkin.student.name}</strong>
                  <span>{formatDateTime(checkin.createdAt)} • {Math.round(checkin.distance)}m • {checkin.student.class || 'N/A'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <footer className={styles.bottomBar}>
        <div className={styles.statusItem}><span className={styles.greenDot} /> Session: <strong>{sessionId}</strong></div>
        <div className={styles.statusItem}><span className={styles.blueDot} /> Updates: <strong>Realtime qua WebSocket</strong></div>
        <div className={styles.statusItem}><FontAwesomeIcon icon={faExpand} /> Tâm bản đồ: <strong>{center[0].toFixed(4)}, {center[1].toFixed(4)}</strong></div>
      </footer>
    </div>
  );
};

export default LiveCheckin;