import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OfficersService } from './officers.service';
import type {
  CreateOfficerDto,
  UpdateOfficerDto,
  Officer,
} from './officers.service';
import { LoggerService } from '../common/logger/logger.service';

@Controller('officers')
export class OfficersController {
  constructor(
    private readonly officersService: OfficersService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * GET /officers - List all officers
   * Optional query: ?status=ACTIVE
   */
  @Get()
  async getOfficers(@Query('status') status?: string): Promise<Officer[]> {
    this.logger.log(
      `Fetching officers with status: ${status || 'all'}`,
      'OfficersController',
    );
    return this.officersService.getOfficers(status);
  }

  /**
   * GET /officers/stats - Get officer statistics
   */
  @Get('stats')
  async getStats() {
    return this.officersService.getStats();
  }

  /**
   * GET /officers/:id - Get single officer
   */
  @Get(':id')
  async getOfficer(@Param('id') id: string): Promise<Officer | null> {
    return this.officersService.getOfficer(id);
  }

  /**
   * POST /officers - Create new officer
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOfficer(@Body() dto: CreateOfficerDto): Promise<Officer> {
    this.logger.log(`Creating officer: ${dto.name}`, 'OfficersController');
    return this.officersService.createOfficer(dto);
  }

  /**
   * PATCH /officers/:id - Update officer
   */
  @Patch(':id')
  async updateOfficer(
    @Param('id') id: string,
    @Body() dto: UpdateOfficerDto,
  ): Promise<Officer> {
    this.logger.log(`Updating officer: ${id}`, 'OfficersController');
    return this.officersService.updateOfficer(id, dto);
  }

  /**
   * POST /officers/:id/deactivate - Deactivate officer
   */
  @Post(':id/deactivate')
  async deactivateOfficer(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<Officer> {
    this.logger.warn(`Deactivating officer: ${id}`, 'OfficersController');
    return this.officersService.deactivateOfficer(
      id,
      reason || 'No reason provided',
    );
  }

  /**
   * POST /officers/:id/reactivate - Reactivate officer
   */
  @Post(':id/reactivate')
  async reactivateOfficer(@Param('id') id: string): Promise<Officer> {
    this.logger.log(`Reactivating officer: ${id}`, 'OfficersController');
    return this.officersService.reactivateOfficer(id);
  }

  /**
   * DELETE /officers/:id - Delete officer (hard delete)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOfficer(@Param('id') id: string): Promise<void> {
    this.logger.warn(`Deleting officer: ${id}`, 'OfficersController');
    return this.officersService.deleteOfficer(id);
  }
}
