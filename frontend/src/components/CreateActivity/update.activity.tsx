import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import activityService from '../../services/activity.service';
import { useActivityForm } from '../../hooks/useActivityForm';
import { useLocationMap } from '../../hooks/useLocationMap';
import { useActivityData } from '../../hooks/useActivityData';
import { useToast } from '../../contexts/ToastContext';
import CreateActivityForm from './CreateActivityForm';
import styles from './create.activity.module.scss';
import type { ActivityDetailResponse } from '@/types/activity.types';

const formatDateTimeLocal = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (num: number) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const UpdateActivity: React.FC = () => {
    const { organizers, categories } = useActivityData();
    const form = useActivityForm();
    const location = useLocationMap();
    const { showToast } = useToast();
    const { search } = useLocation();

    const activityId = useMemo(() => {
        const params = new URLSearchParams(search);
        return params.get('activityId') || '';
    }, [search]);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

    const {
        setTitle,
        setDescription,
        setCategoryId,
        setOrganizerId,
        setStartAt,
        setEndAt,
        setTrainingScore,
        setParticipantCount,
        setCoverPreview,
    } = form;

    const {
        setLocation,
        setCoordinates,
        setMarkerPosition,
    } = location;

    useEffect(() => {
        const fetchActivityDetail = async () => {
            if (!activityId) {
                setLoadError('Thiếu activityId trong query.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await activityService.getDetail(activityId);
                const activity: ActivityDetailResponse = response.data.data;

                setTitle(activity.title || '');
                setDescription(activity.description || '');
                setCategoryId(activity.category?._id || '');
                setOrganizerId(activity.organizer?._id || '');
                setStartAt(formatDateTimeLocal(activity.startAt));
                setEndAt(formatDateTimeLocal(activity.endAt));
                setTrainingScore(activity.trainingScore ?? 0);
                setParticipantCount(activity.participantCount ?? 0);

                if (activity.image) {
                    setCoverPreview(`${baseUrl}/uploads/${activity.image}`);
                }

                if (activity.location) {
                    setLocation(activity.location.address || '');
                    setCoordinates([activity.location.latitude, activity.location.longitude]);
                    setMarkerPosition([activity.location.latitude, activity.location.longitude]);
                }
            } catch (error: any) {
                console.error('Lỗi tải activity:', error);
                setLoadError(error?.message || 'Không thể tải dữ liệu hoạt động.');
            } finally {
                setLoading(false);
            }
        };

        fetchActivityDetail();
    }, [
        activityId,
        baseUrl,
        setTitle,
        setDescription,
        setCategoryId,
        setOrganizerId,
        setStartAt,
        setEndAt,
        setTrainingScore,
        setParticipantCount,
        setCoverPreview,
        setLocation,
        setCoordinates,
        setMarkerPosition,
    ]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.setErrorMessage('');

        const errors: string[] = [];
        if (!form.title.trim()) errors.push('Tên hoạt động không được để trống.');
        if (!form.description.trim()) errors.push('Mô tả không được để trống.');
        if (!form.categoryId) errors.push('Vui lòng chọn danh mục.');
        if (!form.organizerId) errors.push('Vui lòng chọn người tổ chức.');
        if (!location.location.trim()) errors.push('Địa điểm không được để trống.');
        if (!form.startAt) errors.push('Vui lòng chọn thời gian bắt đầu.');
        if (form.endAt && form.startAt && new Date(form.startAt) >= new Date(form.endAt)) {
            errors.push('Thời gian kết thúc phải sau thời gian bắt đầu.');
        }

        if (errors.length) {
            form.setErrorMessage(errors.join(' '));
            return;
        }

        if (!activityId) {
            form.setErrorMessage('Thiếu activityId để cập nhật.');
            return;
        }

        form.setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('location', JSON.stringify({
                address: location.location,
                latitude: location.coordinates[0],
                longitude: location.coordinates[1]
            }));
            formData.append('startAt', new Date(form.startAt).toISOString());
            if (form.endAt) {
                formData.append('endAt', new Date(form.endAt).toISOString());
            }
            formData.append('trainingScore', form.trainingScore.toString());
            formData.append('participantCount', form.participantCount.toString());

            if (form.coverFile) {
                formData.append('image', form.coverFile);
            }

            await activityService.updateWithFile(activityId, formData);

            showToast({
                type: 'success',
                title: 'Cập nhật hoạt động thành công!',
                message: 'Thông tin hoạt động đã được cập nhật.',
            });
        } catch (error) {
            console.error('Lỗi cập nhật activity:', error);
            showToast({
                type: 'error',
                title: 'Cập nhật hoạt động thất bại!',
                message: 'Không thể cập nhật hoạt động. Vui lòng kiểm tra lại thông tin và thử lại.',
                actionText: 'Thử lại',
            });
            form.setErrorMessage('Không thể cập nhật hoạt động. Vui lòng thử lại.');
        } finally {
            form.setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center py-5">Đang tải...</div>;
    }

    if (loadError) {
        return <div className="text-center py-5 text-danger">{loadError}</div>;
    }

    return (
        <div className={styles.createWrapper}>
            <CreateActivityForm
                title={form.title}
                description={form.description}
                categoryId={form.categoryId}
                organizerId={form.organizerId}
                startAt={form.startAt}
                endAt={form.endAt}
                coverPreview={form.coverPreview}
                uploading={form.uploading}
                submitting={form.submitting}
                errorMessage={form.errorMessage}
                categories={categories}
                organizers={organizers}
                fileInputRef={form.fileInputRef as React.RefObject<HTMLInputElement>}
                onTitleChange={form.setTitle}
                onDescriptionChange={form.setDescription}
                onCategoryChange={form.setCategoryId}
                onOrganizerChange={form.setOrganizerId}
                onStartAtChange={form.setStartAt}
                onEndAtChange={form.setEndAt}
                trainingScore={form.trainingScore}
                participantCount={form.participantCount}
                onTrainingScoreChange={form.setTrainingScore}
                onParticipantCountChange={form.setParticipantCount}
                onUploadClick={form.handleUploadClick}
                onCoverFileChange={form.handleCoverFileChange}
                onSubmit={handleSubmit}
                coordinates={location.coordinates}
                markerPosition={location.markerPosition}
                location={location.location}
                loading={location.loading}
                mapKey={location.mapKey}
                onLocationChange={location.handleLocationChange}
                onGetCurrentLocation={location.getCurrentLocation}
                onMapClick={(lat, lng) => {
                    location.setMarkerPosition([lat, lng]);
                    location.setCoordinates([lat, lng]);
                }}
            />
        </div>
    );
};

export default UpdateActivity;
