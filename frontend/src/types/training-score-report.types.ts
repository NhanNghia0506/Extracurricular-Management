export type TrainingScoreReportView = 'student' | 'class' | 'faculty';

export interface TrainingScoreReportSummary {
    totalTrainingScore: number;
    totalCompletedActivities: number;
    totalStudents: number;
    averageTrainingScore: number;
}

export interface TrainingScoreStudentRow {
    studentId: string;
    studentName: string;
    studentCode: string;
    email: string;
    classId: string;
    className: string;
    facultyId: string;
    facultyName: string;
    completedActivities: number;
    totalTrainingScore: number;
}

export interface TrainingScoreClassRow {
    classId: string;
    className: string;
    facultyId: string;
    facultyName: string;
    studentCount: number;
    completedActivities: number;
    totalTrainingScore: number;
    averageTrainingScore: number;
}

export interface TrainingScoreFacultyRow {
    facultyId: string;
    facultyName: string;
    classCount: number;
    studentCount: number;
    completedActivities: number;
    totalTrainingScore: number;
    averageTrainingScore: number;
}

export type TrainingScoreReportRow =
    | TrainingScoreStudentRow
    | TrainingScoreClassRow
    | TrainingScoreFacultyRow;

export interface TrainingScoreReportPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface TrainingScoreReportResponse {
    view: TrainingScoreReportView;
    summary: TrainingScoreReportSummary;
    items: TrainingScoreReportRow[];
    pagination: TrainingScoreReportPagination;
}

export interface TrainingScoreReportQueryParams {
    fromDate?: string;
    toDate?: string;
    facultyId?: string;
    classId?: string;
    page?: number;
    limit?: number;
    view?: TrainingScoreReportView;
}