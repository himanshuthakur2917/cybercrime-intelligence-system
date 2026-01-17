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
import { CasesService } from './cases.service';
import type {
  CreateCaseDto,
  UpdateCaseDto,
  AssignCaseDto,
  AddNoteDto,
  Case,
  CaseWithNotes,
  CaseNote,
  CaseStatus,
} from './cases.service';
import { LoggerService } from '../common/logger/logger.service';

@Controller('cases')
export class CasesController {
  constructor(
    private readonly casesService: CasesService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  async getCases(
    @Query('status') status?: CaseStatus,
    @Query('createdBy') createdBy?: string,
  ): Promise<Case[]> {
    this.logger.log(
      `Fetching cases with status: ${status || 'all'}, createdBy: ${createdBy || 'all'}`,
      'CasesController',
    );
    return this.casesService.getCases(status, createdBy);
  }

  @Get(':id')
  async getCase(@Param('id') id: string): Promise<CaseWithNotes | null> {
    return this.casesService.getCase(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCase(@Body() dto: CreateCaseDto): Promise<Case> {
    this.logger.log(`Creating case: ${dto.title}`, 'CasesController');
    return this.casesService.createCase(dto);
  }

  @Patch(':id')
  async updateCase(
    @Param('id') id: string,
    @Body() dto: UpdateCaseDto,
  ): Promise<Case> {
    this.logger.log(`Updating case: ${id}`, 'CasesController');
    return this.casesService.updateCase(id, dto);
  }

  @Post(':id/assign')
  async assignCase(
    @Param('id') id: string,
    @Body() dto: AssignCaseDto,
  ): Promise<Case> {
    this.logger.log(
      `Assigning case ${id} to officer ${dto.officer_id}`,
      'CasesController',
    );
    return this.casesService.assignCase(id, dto.officer_id);
  }

  @Post(':id/verify')
  async verifyCase(
    @Param('id') id: string,
    @Body('user_id') userId: string,
  ): Promise<Case> {
    this.logger.log(`Verifying case: ${id}`, 'CasesController');
    return this.casesService.verifyCase(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCase(@Param('id') id: string): Promise<void> {
    this.logger.warn(`Deleting case: ${id}`, 'CasesController');
    return this.casesService.deleteCase(id);
  }

  @Get(':id/notes')
  async getNotes(@Param('id') id: string): Promise<CaseNote[]> {
    return this.casesService.getNotes(id);
  }

  @Post(':id/notes')
  @HttpCode(HttpStatus.CREATED)
  async addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
  ): Promise<CaseNote> {
    this.logger.log(`Adding note to case: ${id}`, 'CasesController');
    return this.casesService.addNote(id, dto.user_id, dto.content);
  }
}
