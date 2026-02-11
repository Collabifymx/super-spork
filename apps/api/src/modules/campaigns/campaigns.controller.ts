import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators/current-user.decorator';
import { CampaignsService } from './campaigns.service';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BRAND')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create campaign' })
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.campaignsService.create(user.brandId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List live campaigns' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findLive(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.campaignsService.findLive(page, limit);
  }

  @Get('brand/:brandId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List brand campaigns' })
  async findByBrand(@Param('brandId') brandId: string, @Query('page') page?: number) {
    return this.campaignsService.findByBrand(brandId, page);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  async findById(@Param('id') id: string) {
    return this.campaignsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BRAND')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update campaign' })
  async update(@Param('id') id: string, @CurrentUser() user: any, @Body() body: any) {
    return this.campaignsService.update(id, user.brandId, body);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BRAND')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update campaign status' })
  async updateStatus(@Param('id') id: string, @CurrentUser() user: any, @Body() body: { status: string }) {
    return this.campaignsService.updateStatus(id, user.brandId, body.status);
  }
}
