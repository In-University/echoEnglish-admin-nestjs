import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { GetTranscriptDto } from './dto/get-transcript.dto';
import { Response } from '../../common/interfaces/response.interface';
import { Public } from '../../common/decorators/public.decorator';

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  // GET /resources - Search resources
  @Get()
  @Public()
  async searchResource(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('sort') sort?: string,
    @Query() filters?: Record<string, string>,
  ): Promise<Response<any>> {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || isNaN(limitNum)) {
      throw new Error('Invalid page or limit');
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'newest') {
      sortOption = { publishedAt: -1 };
    }

    // Remove page, limit, sort from filters
    const { page: _, limit: __, sort: ___, ...filterRecord } = filters || {};

    const result = await this.resourceService.searchResource(
      filterRecord,
      pageNum,
      limitNum,
      sortOption,
    );

    return {
      message: 'Resources fetched successfully',
      data: result,
    };
  }

  // POST /resources - Get transcript
  @Post()
  async getTranscript(
    @Body() getTranscriptDto: GetTranscriptDto,
  ): Promise<Response<any>> {
    const transcript = await this.resourceService.getTranscript(
      getTranscriptDto.url,
    );
    return {
      message: 'Transcript fetched successfully',
      data: transcript,
    };
  }

  // POST /resources/save - Save transcript as resource
  @Post('save')
  async saveTranscript(
    @Body() getTranscriptDto: GetTranscriptDto,
  ): Promise<Response<any>> {
    const resource = await this.resourceService.saveTranscript(
      getTranscriptDto.url,
    );
    return {
      message: 'Resource created successfully',
      data: resource,
    };
  }

  // PUT /resources/:id - Update resource (Admin only)
  @Put(':id')
  async updateResource(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ): Promise<Response<any>> {
    const updated = await this.resourceService.updateResource(
      id,
      updateResourceDto,
    );
    return {
      message: 'Resource updated successfully',
      data: updated,
    };
  }

  // DELETE /resources/:id - Delete resource (Admin only)
  @Delete(':id')
  async deleteResource(@Param('id') id: string): Promise<Response<void>> {
    await this.resourceService.deleteResource(id);
    return {
      message: 'Resource deleted successfully',
    };
  }

  // GET /resources/rss/trigger - Trigger RSS fetch
  @Get('rss/trigger')
  async triggerRss(): Promise<Response<any>> {
    try {
      const newResources = await this.resourceService.triggerRss();
      return {
        message: 'RSS triggered successfully',
        data: newResources,
      };
    } catch (error) {
      console.error('[RSS Controller] Error:', error);
      throw error;
    }
  }
}
