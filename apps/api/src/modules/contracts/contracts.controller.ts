import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ContractsService } from './contracts.service';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  async findById(@Param('id') id: string) {
    return this.contractsService.findById(id);
  }

  @Get('brand/:brandId')
  @ApiOperation({ summary: 'List brand contracts' })
  async findByBrand(@Param('brandId') brandId: string, @Query('page') page?: number) {
    return this.contractsService.findByBrand(brandId, page);
  }

  @Get('me/creator')
  @ApiOperation({ summary: 'List my contracts (creator)' })
  async findByCreator(@CurrentUser() user: any, @Query('page') page?: number) {
    return this.contractsService.findByCreator(user.sub, page);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update contract status' })
  async updateStatus(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { status: string }) {
    return this.contractsService.updateStatus(id, body.status, user.sub);
  }
}
