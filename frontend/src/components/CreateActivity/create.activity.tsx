import React from 'react';
import activityService from '../../services/activity.service';
import { useActivityForm } from '../../hooks/useActivityForm';
import { useLocationMap } from '../../hooks/useLocationMap';
import { useActivityData } from '../../hooks/useActivityData';
import { useToast } from '../../contexts/ToastContext';
import CreateActivityForm from './CreateActivityForm';
import styles from './create.activity.module.scss';

const CreateActivity: React.FC = () => {
    // Fetch data
    const { organizers, categories } = useActivityData();

    // Form state
    const form = useActivityForm();

    // Location & Map state
    const location = useLocationMap();

    // Toast notification
    const { showToast } = useToast();

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

        form.setSubmitting(true);
        try {
            // Tạo FormData để gửi file + data
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
            if (form.trainingScore) {
                formData.append('trainingScore', form.trainingScore.toString());
            }
            if (form.participantCount) {
                formData.append('participantCount', form.participantCount.toString());
            }

            // Thêm file nếu có
            if (form.coverFile) {
                formData.append('image', form.coverFile);
            }

            await activityService.createWithFile(form.organizerId, form.categoryId, formData);

            showToast({
                type: 'success',
                title: 'Tạo hoạt động thành công!',
                message: 'Hoạt động của bạn đã được tạo và sẽ hiển thị trong danh sách hoạt động.',
            });

            form.resetForm();
        } catch (error) {
            console.error('Lỗi tạo activity:', error);
            showToast({
                type: 'error',
                title: 'Tạo hoạt động thất bại!',
                message: 'Không thể tạo hoạt động. Vui lòng kiểm tra lại thông tin và thử lại.',
                actionText: 'Thử lại',
            });
            form.setErrorMessage('Không thể tạo hoạt động. Vui lòng thử lại.');
        } finally {
            form.setSubmitting(false);
        }
    };

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
                // Location props
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

export default CreateActivity;