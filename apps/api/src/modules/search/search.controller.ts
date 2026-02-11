import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('creators')
  @ApiOperation({ summary: 'Search creators' })
  async searchCreators(
    @Query('query') query?: string,
    @Query('categories') categories?: string[],
    @Query('platforms') platforms?: string[],
    @Query('location') location?: string,
    @Query('minFollowers') minFollowers?: number,
    @Query('maxFollowers') maxFollowers?: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('verifiedOnly') verifiedOnly?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.searchService.searchCreators({
      query, categories: categories ? (Array.isArray(categories) ? categories : [categories]) : undefined,
      platforms: platforms as any, location,
      minFollowers, maxFollowers, minPrice, maxPrice,
      verifiedOnly, sortBy: sortBy as any, page, limit,
    });
  }
}
