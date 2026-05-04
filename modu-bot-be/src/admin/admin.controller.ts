import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AccessTokenGuard } from 'src/common/guards/access-token.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UsersRole } from 'src/users/enum/user-role.enum';
import { GetCurrentUserId } from 'src/common/decorators/get-current-user-id.decorator';
import { UsersService } from 'src/users/users.service';
import { RejectRequestDto } from './dto/reject-request.dto';
import { PendingKnowledgeStatus } from 'src/knowledge/enum/pending-knowledge-status.enum';

@Roles(UsersRole.ADMIN)
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  @Get('pending-requests')
  async getPendingRequests(@Query('status') status?: PendingKnowledgeStatus) {
    return this.adminService.getPendingRequests(status);
  }

  @Post('approve/:requestId')
  async approveRequest(
    @Param('requestId') requestId: string,
    @GetCurrentUserId() adminId: string,
  ) {
    const admin = await this.usersService.getUserById(adminId);
    const result = await this.adminService.approveRequest(requestId, admin.walletAddress);
    return {
      message: '승인이 완료되었습니다.',
      requestId: result.id,
      status: result.status,
    };
  }

  @Post('reject/:requestId')
  async rejectRequest(
    @Param('requestId') requestId: string,
    @Body() dto: RejectRequestDto,
  ) {
    const result = await this.adminService.rejectRequest(requestId, dto.reason);
    return {
      message: '반려 처리되었습니다.',
      requestId: result.id,
      status: result.status,
    };
  }
}
