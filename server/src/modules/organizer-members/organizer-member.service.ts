import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrganizerMemberRepository } from "./organizer-member.repository";
import { CreateOrganizerMemberDto } from "./dtos/create.organizer-member.dto";
import { Types } from "mongoose";
import { OrganizerMemberRole, UserRole, UserStatus } from "src/global/globalEnum";
import UserService from "../users/user.service";
import { AddOrganizerMemberDto } from "./dtos/add-organizer-member.dto";

@Injectable()
export class OrganizerMemberService {
    constructor(
        private readonly organizerMemberRepository: OrganizerMemberRepository,
        private readonly userService: UserService,
    ) { }

    create(organizerMemberData: CreateOrganizerMemberDto) {
        const organizerMember = {
            userId: new Types.ObjectId(organizerMemberData.userId),
            organizerId: new Types.ObjectId(organizerMemberData.organizerId),
            role: organizerMemberData.role || OrganizerMemberRole.MANAGER,
            isActive: organizerMemberData.isActive,
        };

        return this.organizerMemberRepository.create(organizerMember);
    }

    getMyOrganizations(userId: string) {
        return this.organizerMemberRepository.findOrganizationsByUserId(userId);
    }

    findByUserIdAndOrganizerId(userId: string, organizerId: string) {
        return this.organizerMemberRepository.findByUserIdAndOrganizerId(userId, organizerId);
    }

    private async ensureCanManageOrganizerMembers(organizerId: string, actorUserId: string, actorRole?: string) {
        if (actorRole === UserRole.ADMIN) {
            return;
        }

        const actorMember = await this.organizerMemberRepository.findByUserIdAndOrganizerId(actorUserId, organizerId);
        if (!actorMember || !actorMember.isActive) {
            throw new ForbiddenException('Bạn không thuộc tổ chức này');
        }

        if (actorMember.role !== OrganizerMemberRole.MANAGER) {
            throw new ForbiddenException('Bạn không có quyền quản lý thành viên của tổ chức');
        }
    }

    async getMembersByOrganizer(organizerId: string, actorUserId: string, actorRole?: string) {
        await this.ensureCanManageOrganizerMembers(organizerId, actorUserId, actorRole);

        const rows = await this.organizerMemberRepository.findMembersByOrganizerId(organizerId);
        return rows.map((row) => {
            const user = row.userId as unknown as { _id?: Types.ObjectId; name?: string; email?: string; avatar?: string };
            return {
                id: String(row._id),
                organizerId: String(row.organizerId),
                userId: String(user?._id || ''),
                name: user?.name || 'Chưa cập nhật',
                email: user?.email || 'Chưa cập nhật',
                avatar: user?.avatar || null,
                role: row.role,
                isActive: row.isActive,
                createdAt: (row as unknown as { createdAt?: Date }).createdAt,
            };
        });
    }

    async addMemberByEmail(organizerId: string, payload: AddOrganizerMemberDto, actorUserId: string, actorRole?: string) {
        await this.ensureCanManageOrganizerMembers(organizerId, actorUserId, actorRole);

        const user = await this.userService.findBasicByEmail(payload.email);
        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng với email đã nhập');
        }

        if (user.status !== UserStatus.ACTIVE) {
            throw new BadRequestException('Người dùng này đang không hoạt động');
        }

        const existingMember = await this.organizerMemberRepository.findByUserIdAndOrganizerId(String(user._id), organizerId);
        if (existingMember) {
            throw new BadRequestException('Người dùng đã là thành viên của tổ chức');
        }

        await this.create({
            userId: String(user._id),
            organizerId,
            isActive: true,
            role: payload.role || OrganizerMemberRole.MEMBER,
        });

        return this.getMembersByOrganizer(organizerId, actorUserId, actorRole);
    }

    async updateMemberRole(memberId: string, role: OrganizerMemberRole, actorUserId: string, actorRole?: string) {
        const member = await this.organizerMemberRepository.findById(memberId);
        if (!member) {
            throw new NotFoundException('Không tìm thấy thành viên tổ chức');
        }

        await this.ensureCanManageOrganizerMembers(String(member.organizerId), actorUserId, actorRole);

        await this.organizerMemberRepository.updateRole(memberId, role);
        return this.getMembersByOrganizer(String(member.organizerId), actorUserId, actorRole);
    }

    async deleteMember(memberId: string, actorUserId: string, actorRole?: string) {
        const member = await this.organizerMemberRepository.findById(memberId);
        if (!member) {
            throw new NotFoundException('Không tìm thấy thành viên tổ chức');
        }

        await this.ensureCanManageOrganizerMembers(String(member.organizerId), actorUserId, actorRole);

        await this.organizerMemberRepository.deleteById(memberId);
        return this.getMembersByOrganizer(String(member.organizerId), actorUserId, actorRole);
    }
}
