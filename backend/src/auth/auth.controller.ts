import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import type {
  LoginRequest,
  LoginResponse,
  OtpVerifyRequest,
  OtpResponse,
  FaceVerifyRequest,
  FaceVerifyResponse,
  AuthToken,
  CreateUserRequest,
  UpdateFaceEncodingRequest,
} from './interfaces/auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Step 1: Login with username and password
   * Returns user info and sends OTP to registered phone
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginRequest: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(loginRequest);
  }

  /**
   * Step 2: Verify OTP
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() request: OtpVerifyRequest): Promise<OtpResponse> {
    return this.authService.verifyOtp(request.userId, request.otpCode);
  }

  /**
   * Step 3: Verify face encoding
   */
  @Post('verify-face')
  @HttpCode(HttpStatus.OK)
  async verifyFace(
    @Body() request: FaceVerifyRequest,
  ): Promise<FaceVerifyResponse> {
    return this.authService.verifyFace(request.userId, request.faceEncoding);
  }

  /**
   * Step 4: Get auth token after all verifications complete
   */
  @Post('token')
  @HttpCode(HttpStatus.OK)
  async getToken(@Body() body: { userId: string }): Promise<AuthToken> {
    return this.authService.getAuthToken(body.userId);
  }

  /**
   * Resend OTP
   */
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  async resendOtp(@Body() body: { userId: string }): Promise<OtpResponse> {
    return this.authService.resendOtp(body.userId);
  }

  /**
   * Logout - reset verification status
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req: { user: { sub: string } }) {
    return this.authService.logout(req.user.sub);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Request() req: { user: { sub: string; username: string } },
  ) {
    return this.authService.validateUser(req.user.sub, req.user.username);
  }

  // =====================================================
  // Admin endpoints for user management
  // =====================================================

  /**
   * Create a new user (Admin only)
   */
  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  async createUser(@Body() userData: CreateUserRequest) {
    return this.authService.createUser(userData);
  }

  /**
   * Register face encoding for a user (Admin only)
   */
  @Post('users/:userId/face')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  async registerFace(
    @Param('userId') userId: string,
    @Body() body: UpdateFaceEncodingRequest,
  ) {
    return this.authService.registerUserFace(
      userId,
      body.faceEncoding,
      body.profileImageUrl,
    );
  }

  /**
   * Get all users (Admin only)
   */
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }
}
