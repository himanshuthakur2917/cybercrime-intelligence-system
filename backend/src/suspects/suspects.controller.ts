import {
  Controller,
  Post,
  Get,
  Query,
  Param,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SuspectsService } from './suspects.service';
import { LoggerService } from '../common/logger/logger.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Controller('suspects')
export class SuspectsController {
  constructor(
    private readonly suspectsService: SuspectsService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Upload suspects CSV file
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSuspects(
    @UploadedFile() file: MulterFile,
    @Query('user_id') userId: string,
  ) {
    this.logger.log(
      `Uploading suspects CSV: ${file.originalname}`,
      'SuspectsController',
    );

    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new HttpException(
        'Invalid file type. Only CSV files are allowed',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.suspectsService.uploadSuspectsCSV(
        file.buffer,
        userId,
      );

      this.logger.success(
        `Suspects upload completed: ${result.created + result.updated} records`,
        'SuspectsController',
      );

      return {
        success: true,
        message: 'Suspects uploaded successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload suspects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SuspectsController',
      );
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to upload suspects',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all suspects with optional filters
   */
  @Get()
  async getSuspects(
    @Query('risk') risk?: string,
    @Query('status') status?: string,
    @Query('network_role') networkRole?: string,
  ) {
    this.logger.log('Fetching suspects', 'SuspectsController');

    try {
      const suspects = await this.suspectsService.getSuspects({
        risk,
        status,
        network_role: networkRole,
      });

      return {
        success: true,
        data: suspects,
        count: suspects.length,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch suspects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SuspectsController',
      );
      throw new HttpException(
        'Failed to fetch suspects',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get suspect by phone number
   */
  @Get(':phone')
  async getSuspect(@Param('phone') phone: string) {
    this.logger.log(`Fetching suspect: ${phone}`, 'SuspectsController');

    try {
      const suspect = await this.suspectsService.getSuspect(phone);

      if (!suspect) {
        throw new HttpException('Suspect not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: suspect,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch suspect: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SuspectsController',
      );
      throw new HttpException(
        'Failed to fetch suspect',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
