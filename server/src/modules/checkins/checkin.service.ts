import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CheckinRepository } from './checkin.repository';
import { CreateCheckinDto } from './dtos/create.checkin.dto';
import { Checkin } from './checkin.entity';
import { CheckinSessionService } from '../checkin-sessions/checkin-session.service';
import { calculateHaversineDistance, isLocationWithinRadius } from 'src/utils/haversine.util';
import { CheckinStatus, UserRole } from 'src/global/globalEnum';
import { ActivityParticipantService } from '../activity-participants/activity-participant.service';
import { CheckinGateway } from 'src/events/checkin.gateway';
import StudentService from '../students/student.service';
import UserService from '../users/user.service';
import { StudentProfile } from 'src/global/globalInterface';
import { ManualCheckinDto } from './dtos/manual.checkin.dto';
import { MyAttendanceHistoryQueryDto } from './dtos/my-attendance-history.query.dto';
import { TrainingScoreReportQueryDto } from './dtos/training-score-report.query.dto';
import { StudentStatsQueryDto } from './dtos/student-stats.query.dto';
import { StudentStatsFilterOptionsQueryDto } from './dtos/student-stats-filter-options.query.dto';
import {
    TrainingScoreClassItem,
    TrainingScoreFacultyItem,
    TrainingScoreReportView,
    TrainingScoreStudentItem,
} from './checkin.repository';
import { AcademicService } from '../academic/academic.services';

interface StudentStatsRecord {
    studentId: string;
    name: string;
    studentCode: string;
    className: string;
    activityTitle: string;
    trainingScore: number;
    firstCheckinAt: Date;
}

interface StudentStatsFilter {
    startDate: Date;
    endDate: Date;
    facultyId?: string;
    classId?: string;
}

interface CheckinRepositoryStudentStatsAdapter {
    findStudentStatsRecords(filter: StudentStatsFilter): Promise<StudentStatsRecord[]>;
}

interface AcademicFacultyRow {
    _id: string | Types.ObjectId;
    name?: string;
}

interface AcademicClassRow {
    _id: string | Types.ObjectId;
    name?: string;
    facultyId?: string | Types.ObjectId;
}

interface AcademicServiceFilterOptionsAdapter {
    findAllFaculties(): Promise<AcademicFacultyRow[]>;
    findClassesByFacultyId(facultyId: string): Promise<AcademicClassRow[]>;
    findAllClasses(): Promise<AcademicClassRow[]>;
}

export interface MyAttendanceHistorySummary {
    totalParticipatedActivities: number;
    cumulativeTrainingScore: number;
    attendanceRate: number;
    totalSessions: number;
    successCount: number;
    lateCount: number;
    failedCount: number;
}

export interface MyAttendanceHistoryItem {
    checkinId: string;
    activityId: string;
    activityTitle: string;
    organizerName?: string;
    activityStartAt?: Date;
    activityEndAt?: Date;
    sessionId: string;
    sessionTitle: string;
    checkinTime: Date;
    locationAddress: string;
    status: CheckinStatus;
    trainingScore: number;
    awardedPoints: number;
}

export interface MyAttendanceHistoryResponse {
    summary: MyAttendanceHistorySummary;
    items: MyAttendanceHistoryItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface TrainingScoreReportResponse {
    view: TrainingScoreReportView;
    summary: {
        totalTrainingScore: number;
        totalCompletedActivities: number;
        totalStudents: number;
        averageTrainingScore: number;
    };
    items: Array<TrainingScoreStudentItem | TrainingScoreClassItem | TrainingScoreFacultyItem>;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface StudentStatsResponse {
    kpi: {
        totalStudents: number;
        averageScore: number;
        mostActiveActivity: string;
    };
    leaderboard: Array<{
        rank: number;
        name: string;
        studentCode: string;
        className: string;
        activityCount: number;
        trainingScore: number;
    }>;
}

export interface StudentStatsFilterOptionsResponse {
    faculties: Array<{
        value: string;
        label: string;
    }>;
    classes: Array<{
        value: string;
        label: string;
        facultyId: string;
    }>;
}

@Injectable()
export class CheckinService {
    constructor(
        private readonly checkinRepository: CheckinRepository,
        private readonly checkinSessionService: CheckinSessionService,
        private readonly activityParticipantService: ActivityParticipantService,
        private readonly checkinGateway: CheckinGateway,
        private readonly studentService: StudentService,
        private readonly userService: UserService,
        private readonly academicService: AcademicService,
    ) { }

    private parsePaginationNumber(rawValue: string | undefined, defaultValue: number, fieldName: string): number {
        if (!rawValue) {
            return defaultValue;
        }

        const parsed = Number(rawValue);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new BadRequestException(`${fieldName} phải là số nguyên dương`);
        }

        return parsed;
    }

    private parseDate(rawValue: string | undefined, fieldName: string, endOfDay: boolean = false): Date | undefined {
        if (!rawValue) {
            return undefined;
        }

        const parsed = new Date(rawValue);
        if (Number.isNaN(parsed.getTime())) {
            throw new BadRequestException(`${fieldName} không hợp lệ`);
        }

        if (endOfDay) {
            parsed.setHours(23, 59, 59, 999);
        }

        return parsed;
    }

    private parseMonth(rawValue: string | undefined): number {
        const now = new Date();
        if (!rawValue) {
            return now.getMonth() + 1;
        }

        const parsed = Number(rawValue);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) {
            throw new BadRequestException('month phải nằm trong khoảng 1..12');
        }
        return parsed;
    }

    private parseYear(rawValue: string | undefined): number {
        const now = new Date();
        if (!rawValue) {
            return now.getFullYear();
        }

        const parsed = Number(rawValue);
        if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 3000) {
            throw new BadRequestException('year không hợp lệ');
        }
        return parsed;
    }

    private parseStatuses(rawStatuses: string | undefined): CheckinStatus[] | undefined {
        if (!rawStatuses) {
            return undefined;
        }

        const statuses = rawStatuses
            .split(',')
            .map((value) => value.trim().toUpperCase())
            .filter(Boolean) as CheckinStatus[];

        if (statuses.length === 0) {
            return undefined;
        }

        const validStatuses = new Set(Object.values(CheckinStatus));
        const invalidStatus = statuses.find((status) => !validStatuses.has(status));

        if (invalidStatus) {
            throw new BadRequestException(`status không hợp lệ: ${invalidStatus}`);
        }

        return Array.from(new Set(statuses));
    }

    /**
     * Kiểm tra xem thiết bị đã check-in thành công (SUCCESS hoặc LATE) trong session này chưa
     */
    private async hasDeviceCheckedInSuccessfully(
        checkinSessionId: string,
        deviceId: string,
    ): Promise<boolean> {
        try {
            const existingCheckin = await this.checkinRepository.findOneBySessionAndDevice(
                checkinSessionId,
                deviceId,
                [CheckinStatus.SUCCESS, CheckinStatus.LATE],
            );
            return !!existingCheckin;
        } catch {
            return false;
        }
    }

    private async hasUserCheckedInSuccessfully(
        checkinSessionId: string,
        userId: string,
    ): Promise<boolean> {
        try {
            const existingCheckin = await this.checkinRepository.findOneBySessionAndUser(
                checkinSessionId,
                userId,
                [CheckinStatus.SUCCESS, CheckinStatus.LATE],
            );
            return !!existingCheckin;
        } catch {
            return false;
        }
    }

    async create(
        createCheckinDto: CreateCheckinDto,
        actorUserId: string,
        actorRole?: string,
    ) {
        if (actorRole !== UserRole.ADMIN && createCheckinDto.userId !== actorUserId) {
            throw new ForbiddenException('Bạn không thể điểm danh thay người khác');
        }

        const checkinSession = await this.checkinSessionService.findById(createCheckinDto.checkinSessionId);
        if (!checkinSession) {
            throw new NotFoundException('Không tìm thấy check-in session');
        }

        // Kiểm tra xem check-in session có đang hoạt động không
        const now = new Date();
        if (now < checkinSession.startTime) {
            throw new BadRequestException('Check-in session chưa diễn ra');
        }

        if (now > checkinSession.endTime) {
            throw new BadRequestException('Check-in session đã kết thúc');
        }

        // Kiểm tra xem thiết bị đã check-in thành công trong session này chưa
        const hasDeviceCheckedIn = await this.hasDeviceCheckedInSuccessfully(
            createCheckinDto.checkinSessionId,
            createCheckinDto.deviceId,
        );

        if (hasDeviceCheckedIn) {
            throw new BadRequestException('Thiết bị này đã check-in thành công cho session này rồi. Chỉ cho phép 1 check-in thành công/thiết bị/session');
        }

        const hasUserCheckedIn = await this.hasUserCheckedInSuccessfully(
            createCheckinDto.checkinSessionId,
            createCheckinDto.userId,
        );
        if (hasUserCheckedIn) {
            throw new BadRequestException('Người dùng này đã điểm danh thành công cho session này rồi');
        }

        // Tính khoảng cách
        const distance = calculateHaversineDistance(
            createCheckinDto.latitude,
            createCheckinDto.longitude,
            checkinSession.location.latitude,
            checkinSession.location.longitude,
        );

        const participant = await this.activityParticipantService.findByActivityAndUserId(
            checkinSession.activityId.toString(),
            createCheckinDto.userId
        );

        if (!participant) {
            throw new BadRequestException('Bạn chưa tham gia hoạt động này');
        }

        let checkin: Checkin;

        // Kiểm tra vị trí người dùng có trong vòng tròn chưa
        if (!isLocationWithinRadius(
            createCheckinDto.latitude,
            createCheckinDto.longitude,
            checkinSession.location.latitude,
            checkinSession.location.longitude,
            checkinSession.radiusMetters)) {

            checkin = {
                checkinSessionId: new Types.ObjectId(createCheckinDto.checkinSessionId),
                userId: new Types.ObjectId(createCheckinDto.userId),
                latitude: createCheckinDto.latitude,
                longitude: createCheckinDto.longitude,
                distance,
                status: CheckinStatus.FAILED,
                failReason: `Vị trí cách ${distance.toFixed(2)}m, giới hạn ${checkinSession.radiusMetters}m`,
                deviceId: createCheckinDto.deviceId,
            } as Checkin;
        } else {
            // Xác định LATE nếu phiên có cấu hình lateAfter và thời điểm hiện tại vượt quá ngưỡng
            const checkinStatus = (checkinSession.lateAfter && now > checkinSession.lateAfter)
                ? CheckinStatus.LATE
                : CheckinStatus.SUCCESS;

            checkin = {
                checkinSessionId: new Types.ObjectId(createCheckinDto.checkinSessionId),
                userId: new Types.ObjectId(createCheckinDto.userId),
                latitude: createCheckinDto.latitude,
                longitude: createCheckinDto.longitude,
                distance,
                status: checkinStatus,
                deviceId: createCheckinDto.deviceId,
            } as Checkin;
        }

        const savedCheckin = await this.checkinRepository.create(checkin);

        // Emit event khi checkin xong (non-blocking)
        void this.emitCheckinEventAsync(savedCheckin, createCheckinDto.userId);

        return savedCheckin;
    }

    async createManual(
        manualCheckinDto: ManualCheckinDto,
        actorUserId: string,
        actorRole?: string,
    ) {
        const checkinSession = await this.checkinSessionService.findById(manualCheckinDto.checkinSessionId);
        if (!checkinSession) {
            throw new NotFoundException('Không tìm thấy check-in session');
        }

        const now = new Date();
        if (now < checkinSession.startTime) {
            throw new BadRequestException('Check-in session chưa diễn ra');
        }

        if (now > checkinSession.endTime) {
            throw new BadRequestException('Check-in session đã kết thúc');
        }

        const activity = await this.checkinSessionService.findActivityBySessionId(manualCheckinDto.checkinSessionId);
        if (!activity) {
            throw new NotFoundException('Không tìm thấy hoạt động của check-in session');
        }

        const isOwner = activity.createdBy?.toString() === actorUserId;
        const isAdmin = actorRole === UserRole.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Chỉ chủ hoạt động hoặc admin mới có quyền điểm danh thủ công');
        }

        const participant = await this.activityParticipantService.findByActivityAndUserId(
            checkinSession.activityId.toString(),
            manualCheckinDto.userId,
        );

        if (!participant) {
            throw new BadRequestException('Người dùng này chưa tham gia hoạt động');
        }

        const hasUserCheckedIn = await this.hasUserCheckedInSuccessfully(
            manualCheckinDto.checkinSessionId,
            manualCheckinDto.userId,
        );
        if (hasUserCheckedIn) {
            throw new BadRequestException('Người dùng này đã điểm danh thành công cho session này rồi');
        }

        const manualCheckin: Checkin = {
            checkinSessionId: new Types.ObjectId(manualCheckinDto.checkinSessionId),
            userId: new Types.ObjectId(manualCheckinDto.userId),
            latitude: checkinSession.location.latitude,
            longitude: checkinSession.location.longitude,
            distance: 0,
            status: CheckinStatus.SUCCESS,
            deviceId: `manual:${actorUserId}:${manualCheckinDto.userId}`,
        } as Checkin;

        const savedCheckin = await this.checkinRepository.create(manualCheckin);

        void this.emitCheckinEventAsync(savedCheckin, manualCheckinDto.userId);

        return savedCheckin;
    }

    /**
     * Helper method to emit checkin event with fallback for non-student users
     */
    private async emitCheckinEventAsync(checkin: Checkin, userId: string) {
        try {
            let studentProfile: StudentProfile;

            try {
                // Thử lấy thông tin student đầy đủ
                studentProfile = await this.studentService.getStudentFullInfo(userId);
                console.log('Student profile loaded:', studentProfile);
            } catch (studentError) {
                // Nếu không tìm thấy student record, fallback lấy từ user
                const errorMessage = studentError instanceof Error ? studentError.message : String(studentError);
                console.warn('Student record not found, using user fallback:', errorMessage);

                const user = await this.userService.getProfile(userId);
                studentProfile = {
                    id: userId,
                    mssv: 'N/A',
                    name: user.name || 'Unknown',
                    email: user.email || '',
                    avatar: user.avatar || '',
                    class: 'N/A',
                    faculty: 'N/A',
                };
                console.log('Fallback user profile created:', studentProfile);
            }

            this.checkinGateway.emitNewCheckin({
                checkin: checkin,
                student: studentProfile,
            });
            console.log('CheckinGateway.emitNewCheckin called successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : '';
            console.error('Error in emitNewCheckin flow:', errorMessage);
            console.error('Stack:', errorStack);
        }
    }

    /**
     * Lấy danh sách người đã checkin theo sessionId kèm thông tin đầy đủ
     * @param checkinSessionId - ID của checkin session
     * @param status - (Optional) Lọc theo trạng thái (SUCCESS, FAILED, etc.)
     */
    async getCheckinsBySessionId(checkinSessionId: string, status?: CheckinStatus) {
        // Validate session tồn tại
        const session = await this.checkinSessionService.findById(checkinSessionId);
        if (!session) {
            throw new NotFoundException('Không tìm thấy checkin session');
        }

        // Lấy danh sách checkin
        const checkins = await this.checkinRepository.findBySessionId(checkinSessionId, status);

        // Populate thông tin user/student cho từng checkin
        const checkinList = await Promise.all(
            checkins.map(async (checkin) => {
                try {
                    // Thử lấy thông tin student đầy đủ
                    const studentProfile = await this.studentService.getStudentFullInfo(
                        checkin.userId.toString(),
                    );

                    return {
                        _id: checkin._id,
                        userId: checkin.userId,
                        latitude: checkin.latitude,
                        longitude: checkin.longitude,
                        distance: checkin.distance,
                        status: checkin.status,
                        failReason: checkin.failReason,
                        createdAt: checkin.createdAt,
                        student: studentProfile,
                    };
                } catch {
                    // Fallback: nếu không tìm thấy student, lấy từ user
                    const user = await this.userService.getProfile(checkin.userId.toString());
                    return {
                        _id: checkin._id,
                        userId: checkin.userId,
                        latitude: checkin.latitude,
                        longitude: checkin.longitude,
                        distance: checkin.distance,
                        status: checkin.status,
                        failReason: checkin.failReason,
                        createdAt: checkin.createdAt,
                        student: {
                            id: user.id.toString(),
                            mssv: 'N/A',
                            name: user.name || 'Unknown',
                            email: user.email || '',
                            avatar: user.avatar || '',
                            class: 'N/A',
                            faculty: 'N/A',
                        },
                    };
                }
            }),
        );

        return {
            total: checkinList.length,
            data: checkinList,
        };
    }

    async getMyAttendanceHistory(
        userId: string,
        query: MyAttendanceHistoryQueryDto,
    ): Promise<MyAttendanceHistoryResponse> {
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('userId phải là MongoDB ObjectId hợp lệ');
        }

        const page = this.parsePaginationNumber(query.page, 1, 'page');
        const limit = Math.min(this.parsePaginationNumber(query.limit, 10, 'limit'), 100);
        const startDate = this.parseDate(query.startDate, 'startDate');
        const endDate = this.parseDate(query.endDate, 'endDate', true);
        const statuses = this.parseStatuses(query.status);

        if (startDate && endDate && startDate > endDate) {
            throw new BadRequestException('startDate không được lớn hơn endDate');
        }

        const { items, total, summary } = await this.checkinRepository.findMyAttendanceHistory({
            userId,
            statuses,
            startDate,
            endDate,
            page,
            limit,
        });

        const attendanceRate = summary.totalSessions > 0
            ? Number((((summary.successCount + summary.lateCount) / summary.totalSessions) * 100).toFixed(2))
            : 0;

        const mappedItems: MyAttendanceHistoryItem[] = items.map((item) => ({
            ...item,
            awardedPoints: [CheckinStatus.SUCCESS, CheckinStatus.LATE].includes(item.status)
                ? item.trainingScore
                : 0,
        }));

        const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

        return {
            summary: {
                totalParticipatedActivities: summary.totalParticipatedActivities,
                cumulativeTrainingScore: summary.cumulativeTrainingScore,
                attendanceRate,
                totalSessions: summary.totalSessions,
                successCount: summary.successCount,
                lateCount: summary.lateCount,
                failedCount: summary.failedCount,
            },
            items: mappedItems,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    async getTrainingScoreReport(query: TrainingScoreReportQueryDto): Promise<TrainingScoreReportResponse> {
        const page = this.parsePaginationNumber(query.page, 1, 'page');
        const limit = Math.min(this.parsePaginationNumber(query.limit, 20, 'limit'), 1000);
        const fromDate = this.parseDate(query.fromDate, 'fromDate');
        const toDate = this.parseDate(query.toDate, 'toDate', true);
        const view: TrainingScoreReportView = query.view || 'student';

        if (fromDate && toDate && fromDate > toDate) {
            throw new BadRequestException('fromDate không được lớn hơn toDate');
        }

        if (query.facultyId && !Types.ObjectId.isValid(query.facultyId)) {
            throw new BadRequestException('facultyId không hợp lệ');
        }

        if (query.classId && !Types.ObjectId.isValid(query.classId)) {
            throw new BadRequestException('classId không hợp lệ');
        }

        const { items, total, summary } = await this.checkinRepository.findTrainingScoreReport({
            view,
            fromDate,
            toDate,
            facultyId: query.facultyId,
            classId: query.classId,
            page,
            limit,
        });

        const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

        return {
            view,
            summary,
            items,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        };
    }

    async getStudentStats(query: StudentStatsQueryDto): Promise<StudentStatsResponse> {
        const month = this.parseMonth(query.month);
        const year = this.parseYear(query.year);
        const facultyId = query.faculty && query.faculty !== 'all' ? query.faculty : undefined;
        const classId = query.className && query.className !== 'all' ? query.className : undefined;

        const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const studentStatsRepository = this.checkinRepository as unknown as CheckinRepositoryStudentStatsAdapter;
        const records = await studentStatsRepository.findStudentStatsRecords({
            startDate,
            endDate,
            facultyId,
            classId,
        });

        const studentMap = new Map<string, {
            name: string;
            studentCode: string;
            className: string;
            activityCount: number;
            trainingScore: number;
        }>();

        const activityMap = new Map<string, number>();

        for (const record of records) {
            const current = studentMap.get(record.studentId) || {
                name: record.name,
                studentCode: record.studentCode,
                className: record.className,
                activityCount: 0,
                trainingScore: 0,
            };

            current.activityCount += 1;
            current.trainingScore += Number(record.trainingScore || 0);
            studentMap.set(record.studentId, current);

            activityMap.set(
                record.activityTitle,
                (activityMap.get(record.activityTitle) || 0) + 1,
            );
        }

        const students = Array.from(studentMap.values());
        const totalStudents = students.length;
        const totalScore = students.reduce((sum, item) => sum + item.trainingScore, 0);
        const averageScore = totalStudents > 0
            ? Number((totalScore / totalStudents).toFixed(2))
            : 0;

        let mostActiveActivity = 'Chưa có dữ liệu';
        let mostActiveCount = 0;
        for (const [title, count] of activityMap.entries()) {
            if (count > mostActiveCount) {
                mostActiveActivity = title;
                mostActiveCount = count;
            }
        }

        const leaderboard = students
            .sort((a, b) => {
                if (b.trainingScore !== a.trainingScore) {
                    return b.trainingScore - a.trainingScore;
                }
                if (b.activityCount !== a.activityCount) {
                    return b.activityCount - a.activityCount;
                }
                return a.name.localeCompare(b.name, 'vi');
            })
            .slice(0, 10)
            .map((item, index) => ({
                rank: index + 1,
                name: item.name,
                studentCode: item.studentCode,
                className: item.className,
                activityCount: item.activityCount,
                trainingScore: item.trainingScore,
            }));

        return {
            kpi: {
                totalStudents,
                averageScore,
                mostActiveActivity,
            },
            leaderboard,
        };
    }

    async getStudentStatsFilterOptions(
        query: StudentStatsFilterOptionsQueryDto,
    ): Promise<StudentStatsFilterOptionsResponse> {
        const academicService = this.academicService as unknown as AcademicServiceFilterOptionsAdapter;
        const facultiesRaw = await academicService.findAllFaculties();
        const classesRaw = query.facultyId
            ? await academicService.findClassesByFacultyId(query.facultyId)
            : await academicService.findAllClasses();

        const faculties = facultiesRaw
            .map((faculty) => ({
                value: String(faculty?._id || ''),
                label: String(faculty?.name || 'N/A'),
            }))
            .filter((item) => Boolean(item.value))
            .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

        const classes = classesRaw
            .map((classItem) => ({
                value: String(classItem?._id || ''),
                label: String(classItem?.name || 'N/A'),
                facultyId: String(classItem?.facultyId || ''),
            }))
            .filter((item) => Boolean(item.value) && Boolean(item.facultyId))
            .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

        return {
            faculties,
            classes,
        };
    }

}
