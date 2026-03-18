import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { ListCommentsDto } from './dtos/list-comments.dto';

@Controller()
@UseGuards(AuthGuard)
export class CommentController {
    constructor(private readonly commentService: CommentService) { }

    @Get('activities/:activityId/comments')
    @ResponseMessage('Lấy danh sách bình luận thành công')
    async listByActivity(
        @Param('activityId') activityId: string,
        @Query() query: ListCommentsDto,
        @Req() req: Request,
    ) {
        return this.commentService.listByActivity(activityId, query, req.user?.id, req.user?.role);
    }

    @Post('activities/:activityId/comments')
    @ResponseMessage('Tạo bình luận thành công')
    async create(
        @Param('activityId') activityId: string,
        @Body() createCommentDto: CreateCommentDto,
        @Req() req: Request,
    ) {
        return this.commentService.create(
            activityId,
            createCommentDto,
            req.user!.id!,
            req.user?.name || 'Unknown User',
            req.user?.role,
        );
    }

    @Patch('comments/:commentId')
    @ResponseMessage('Cập nhật bình luận thành công')
    async update(
        @Param('commentId') commentId: string,
        @Body() updateCommentDto: UpdateCommentDto,
        @Req() req: Request,
    ) {
        return this.commentService.update(
            commentId,
            updateCommentDto,
            req.user!.id!,
            req.user?.role,
        );
    }

    @Delete('comments/:commentId')
    @ResponseMessage('Xóa bình luận thành công')
    async delete(
        @Param('commentId') commentId: string,
        @Req() req: Request,
    ) {
        return this.commentService.delete(commentId, req.user!.id!, req.user?.role);
    }
}
