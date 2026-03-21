import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CheckinStatus } from 'src/global/globalEnum';
import { Checkin } from '../checkins/checkin.entity';
import { ActivityFeedback, ActivityFeedbackDocument } from './activity-feedback.entity';

interface CreateActivityFeedbackPayload {
    activityId: string;
    authorId: string;
    rating: number;
    comment: string;
}

@Injectable()
export class ActivityFeedbackRepository {
    constructor(
        @InjectModel(ActivityFeedback.name)
        private readonly activityFeedbackModel: Model<ActivityFeedbackDocument>,
        @InjectModel(Checkin.name)
        private readonly checkinModel: Model<Checkin>,
    ) { }

    async create(payload: CreateActivityFeedbackPayload): Promise<ActivityFeedbackDocument> {
        return this.activityFeedbackModel.create({
            activityId: new Types.ObjectId(payload.activityId),
            authorId: new Types.ObjectId(payload.authorId),
            rating: payload.rating,
            comment: payload.comment,
        });
    }

    async findById(feedbackId: string): Promise<ActivityFeedbackDocument | null> {
        return this.activityFeedbackModel.findById(feedbackId).exec();
    }

    async findByActivityAndAuthor(activityId: string, authorId: string): Promise<ActivityFeedbackDocument | null> {
        return this.activityFeedbackModel.findOne({
            activityId: new Types.ObjectId(activityId),
            authorId: new Types.ObjectId(authorId),
        }).exec();
    }

    async updateById(
        feedbackId: string,
        payload: { rating?: number; comment?: string },
    ): Promise<ActivityFeedbackDocument | null> {
        return this.activityFeedbackModel
            .findByIdAndUpdate(
                feedbackId,
                {
                    ...payload,
                    updatedAt: new Date(),
                },
                { new: true },
            )
            .exec();
    }

    async countByActivity(activityId: string): Promise<number> {
        return this.activityFeedbackModel.countDocuments({
            activityId: new Types.ObjectId(activityId),
        }).exec();
    }

    async findByActivity(
        activityId: string,
        limit: number,
        skip: number,
        sort: 'newest' | 'oldest',
    ): Promise<ActivityFeedbackDocument[]> {
        const sortDirection = sort === 'oldest' ? 1 : -1;
        return this.activityFeedbackModel
            .find({ activityId: new Types.ObjectId(activityId) })
            .sort({ createdAt: sortDirection })
            .limit(limit)
            .skip(skip)
            .exec();
    }

    async hasSuccessfulAttendanceForActivity(activityId: string, userId: string): Promise<boolean> {
        const rows = await this.checkinModel.aggregate<Array<{ _id: Types.ObjectId }>>([
            {
                $match: {
                    userId: new Types.ObjectId(userId),
                    status: { $in: [CheckinStatus.SUCCESS, CheckinStatus.LATE] },
                },
            },
            {
                $lookup: {
                    from: 'checkinsessions',
                    localField: 'checkinSessionId',
                    foreignField: '_id',
                    as: 'session',
                },
            },
            { $unwind: { path: '$session', preserveNullAndEmptyArrays: false } },
            {
                $match: {
                    'session.activityId': new Types.ObjectId(activityId),
                },
            },
            { $limit: 1 },
            { $project: { _id: 1 } },
        ]).exec();

        return rows.length > 0;
    }

    async getDashboard(activityId: string, recentLimit: number = 5): Promise<{
        totalFeedbacks: number;
        averageRating: number;
        ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>;
        recentFeedbacks: ActivityFeedbackDocument[];
    }> {
        interface FeedbackDashboardSummaryRow {
            totalFeedbacks: number;
            averageRating: number;
            oneStar: number;
            twoStar: number;
            threeStar: number;
            fourStar: number;
            fiveStar: number;
        }

        const [summaryRows, recentFeedbacks] = await Promise.all([
            this.activityFeedbackModel.aggregate<FeedbackDashboardSummaryRow>([
                { $match: { activityId: new Types.ObjectId(activityId) } },
                {
                    $group: {
                        _id: null,
                        totalFeedbacks: { $sum: 1 },
                        averageRating: { $avg: '$rating' },
                        oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
                        twoStar: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                        threeStar: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                        fourStar: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                        fiveStar: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        totalFeedbacks: 1,
                        averageRating: 1,
                        oneStar: 1,
                        twoStar: 1,
                        threeStar: 1,
                        fourStar: 1,
                        fiveStar: 1,
                    },
                },
            ]).exec(),
            this.activityFeedbackModel
                .find({ activityId: new Types.ObjectId(activityId) })
                .sort({ createdAt: -1 })
                .limit(recentLimit)
                .exec(),
        ]);

        const summary = summaryRows[0];

        return {
            totalFeedbacks: summary?.totalFeedbacks || 0,
            averageRating: summary?.averageRating || 0,
            ratingDistribution: {
                '1': summary?.oneStar || 0,
                '2': summary?.twoStar || 0,
                '3': summary?.threeStar || 0,
                '4': summary?.fourStar || 0,
                '5': summary?.fiveStar || 0,
            },
            recentFeedbacks,
        };
    }
}
