import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DeliverablesService } from './deliverables.service';

@ApiTags('deliverables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deliverables')
export class DeliverablesController {
  constructor(private deliverablesService: DeliverablesService) {}

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Get deliverables for contract' })
  async getByContract(@Param('contractId') contractId: string) {
    return this.deliverablesService.getByContract(contractId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit deliverable (creator)' })
  async submit(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.deliverablesService.submit(id, user.sub, body);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Review deliverable (brand)' })
  async review(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { approved: boolean; feedback?: string }) {
    return this.deliverablesService.review(id, user.sub, body.approved, body.feedback);
  }
}
