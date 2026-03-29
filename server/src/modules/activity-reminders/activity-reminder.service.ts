import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ActivityRepository } from '../activities/activity.repository';
import { ActivityParticipantService } from '../activity-participants/activity-participant.service';
import { NotificationService } from '../notifications/notification.service';
import { NotificationPriority, NotificationType } from 'src/global/globalEnum';

@Injectable()
export class ActivityReminderService {
    private readonly logger = new Logger(ActivityReminderService.name);
    private static readonly REMINDER_OFFSET_MS = 60 * 60 * 1000;
    private static readonly WINDOW_MS = 5 * 60 * 1000;

    constructor(
        private readonly activityRepository: ActivityRepository,
        private readonly activityParticipantService: ActivityParticipantService,
        private readonly notificationService: NotificationService,
    ) { }

    @Cron('*/1 * * * *')
    async sendOneHourReminders(): Promise<void> {
        const now = new Date();
        const windowMs = ActivityReminderService.WINDOW_MS;
        const reminderOffsetMs = ActivityReminderService.REMINDER_OFFSET_MS;
        let createdCount = 0;
        let skippedCount = 0;
        let recipientCount = 0;

        try {
            // Lấy mọi activity sắp diễn ra (startAt > now, chưa bị hủy/hoàn thành)
            const activities = await this.activityRepository.findUpcomingActivities(now);

            if (activities.length === 0) {
                this.logger.debug('Activity reminder cron: no upcoming activities.');
                return;
            }

            for (const activity of activities) {
                try {
                    const activityId = activity._id.toString();
                    const startAt = new Date(activity.startAt);
                    const diffMs = startAt.getTime() - now.getTime();
                    // Chỉ gửi nếu còn đúng 1h ±2.5 phút
                    if (Math.abs(diffMs - reminderOffsetMs) > windowMs / 2) {
                        continue;
                    }

                    const participants = await this.activityParticipantService.findByActivityId(activityId);
                    const userIds = Array.from(
                        new Set(participants.map((participant) => participant.userId?.toString()).filter(Boolean)),
                    );
                    if (userIds.length === 0) {
                        continue;
                    }

                    const startAtText = startAt.toLocaleString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                    });

                    for (const userId of userIds) {
                        recipientCount += 1;
                        const groupKey = `activity-reminder:1h:${activityId}:${userId}`;
                        const { created } = await this.notificationService.createIfNotExistsByGroupKey({
                            userId,
                            senderName: 'Hệ thống',
                            senderType: 'system',
                            title: 'Hoạt động sắp bắt đầu trong 1 giờ',
                            message: `Hoạt động "${activity.title}" sẽ bắt đầu lúc ${startAtText}.`,
                            type: NotificationType.ACTIVITY,
                            priority: NotificationPriority.NORMAL,
                            linkUrl: `/activity-detail?id=${activityId}`,
                            groupKey,
                            meta: {
                                activityId,
                                reminderType: 'ONE_HOUR_BEFORE_START',
                                activityStartAt: activity.startAt,
                            },
                        });
                        if (created) {
                            createdCount += 1;
                        } else {
                            skippedCount += 1;
                        }
                    }
                } catch (activityError) {
                    const message = activityError instanceof Error ? activityError.message : String(activityError);
                    this.logger.error(`Activity reminder failed for activity ${activity._id.toString()}: ${message}`);
                }
            }

            this.logger.log(
                `Activity reminder cron finished: activities=${activities.length}, recipients=${recipientCount}, created=${createdCount}, skipped=${skippedCount}`,
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`Activity reminder cron failed: ${message}`);
        }
    }
}