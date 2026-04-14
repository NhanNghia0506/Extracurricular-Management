import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from 'src/global/globalEnum';
import { Complaint, ComplaintDocument } from './complaint.entity';

interface CreateComplaintPayload {
    complainantId: string;
    category: ComplaintCategory;
    targetEntityId: string;
    title: string;
    description: string;
    priority: ComplaintPriority;
    attachmentUrls: string[];
}

interface ListComplaintFilter {
    complainantId?: string;
    status?: ComplaintStatus;
    category?: ComplaintCategory;
    priority?: ComplaintPriority;
    targetEntityIds?: string[];
}

@Injectable()
export class ComplaintRepository {
    constructor(
        @InjectModel(Complaint.name)
        private readonly complaintModel: Model<ComplaintDocument>,
    ) { }

    async create(payload: CreateComplaintPayload): Promise<ComplaintDocument> {
        return this.complaintModel.create({
            complainantId: new Types.ObjectId(payload.complainantId),
            category: payload.category,
            targetEntityId: new Types.ObjectId(payload.targetEntityId),
            title: payload.title,
            description: payload.description,
            priority: payload.priority,
            attachmentUrls: payload.attachmentUrls,
            status: ComplaintStatus.SUBMITTED,
        });
    }

    async findById(id: string): Promise<ComplaintDocument | null> {
        return this.complaintModel.findById(id).exec();
    }

    async findOpenByTargetAndComplainant(
        complainantId: string,
        category: ComplaintCategory,
        targetEntityId: string,
    ): Promise<ComplaintDocument | null> {
        return this.complaintModel
            .findOne({
                complainantId: new Types.ObjectId(complainantId),
                category,
                targetEntityId: new Types.ObjectId(targetEntityId),
                status: { $in: [ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW] },
            })
            .sort({ createdAt: -1 })
            .exec();
    }

    async findAll(filter: ListComplaintFilter, limit: number, skip: number): Promise<ComplaintDocument[]> {
        const query = this.buildFilter(filter);
        return this.complaintModel
            .find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .exec();
    }

    async countAll(filter: ListComplaintFilter): Promise<number> {
        return this.complaintModel.countDocuments(this.buildFilter(filter)).exec();
    }

    async countByStatus(status: ComplaintStatus): Promise<number> {
        return this.complaintModel.countDocuments({ status }).exec();
    }

    async updateReview(
        complaintId: string,
        payload: {
            status: ComplaintStatus;
            resolution?: string | null;
            reviewNote: string;
            reviewedBy: string;
            reviewedAt: Date;
        },
    ): Promise<ComplaintDocument | null> {
        return this.complaintModel
            .findByIdAndUpdate(
                complaintId,
                {
                    status: payload.status,
                    resolution: payload.resolution ?? null,
                    reviewNote: payload.reviewNote,
                    reviewedBy: new Types.ObjectId(payload.reviewedBy),
                    reviewedAt: payload.reviewedAt,
                    updatedAt: new Date(),
                },
                { new: true },
            )
            .exec();
    }

    private buildFilter(filter: ListComplaintFilter): Record<string, unknown> {
        const query: Record<string, unknown> = {};

        if (filter.complainantId) {
            query.complainantId = new Types.ObjectId(filter.complainantId);
        }
        if (filter.status) {
            query.status = filter.status;
        }
        if (filter.category) {
            query.category = filter.category;
        }
        if (filter.priority) {
            query.priority = filter.priority;
        }
        if (filter.targetEntityIds?.length) {
            query.targetEntityId = {
                $in: filter.targetEntityIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id)),
            };
        }

        return query;
    }
}
