import {
  Controller, Get, Patch, Post, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators/current-user.decorator';
import { CreatorsService } from './creators.service';

@ApiTags('creators')
@Controller('creators')
export class CreatorsController {
  constructor(private creatorsService: CreatorsService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get creator profile by slug' })
  async getProfile(@Param('slug') slug: string) {
    return this.creatorsService.getProfile(slug);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own creator profile' })
  async updateProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.creatorsService.updateProfile(user.sub, body);
  }

  @Post('me/social-accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add/update social account' })
  async addSocialAccount(@CurrentUser() user: any, @Body() body: any) {
    return this.creatorsService.addSocialAccount(user.sub, body);
  }

  @Delete('me/social-accounts/:platform')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  async removeSocialAccount(@CurrentUser() user: any, @Param('platform') platform: string) {
    return this.creatorsService.removeSocialAccount(user.sub, platform);
  }

  @Post('me/portfolio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add portfolio item' })
  async addPortfolioItem(@CurrentUser() user: any, @Body() body: any) {
    return this.creatorsService.addPortfolioItem(user.sub, body);
  }

  @Delete('me/portfolio/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  async removePortfolioItem(@CurrentUser() user: any, @Param('id') id: string) {
    return this.creatorsService.removePortfolioItem(user.sub, id);
  }

  @Post('me/rates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CREATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add rate' })
  async addRate(@CurrentUser() user: any, @Body() body: any) {
    return this.creatorsService.addRate(user.sub, body);
  }
}
