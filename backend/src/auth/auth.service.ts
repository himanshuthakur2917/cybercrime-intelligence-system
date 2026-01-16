import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { OtpService } from './otp.service';
import { FaceService } from './face.service';
import { PasswordService } from './password.service';
import type {
  LoginRequest,
  LoginResponse,
  OtpResponse,
  FaceVerifyResponse,
  AuthToken,
  JwtPayload,
  CreateUserRequest,
  User,
} from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private supabaseService: SupabaseService,
    private otpService: OtpService,
    private faceService: FaceService,
  ) {}

  /**
   * Step 1: Login with username and password
   * Returns user info and triggers OTP sending
   */
  async login(loginRequest: LoginRequest): Promise<LoginResponse> {
    const { username, password } = loginRequest;

    console.log(`[AUTH] Login attempt for user: ${username}`);

    // Query user from Supabase users table
    const { data: user, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      console.log(`[AUTH] ✗ User not found: ${username}`);
      throw new UnauthorizedException('Invalid username or password');
    }

    // Check if user is active
    if (!user.is_active) {
      console.log(`[AUTH] ✗ User account deactivated: ${username}`);
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      console.log(`[AUTH] ✗ Invalid password for user: ${username}`);
      throw new UnauthorizedException('Invalid username or password');
    }

    console.log(`[AUTH] ✓ Password verified for user: ${username}`);

    // Reset verification status for new login session
    await this.supabaseService
      .getClient()
      .from('users')
      .update({ otp_verified: false, face_verified: false })
      .eq('id', user.id);

    // Generate and send OTP
    const { otpCode, expiresAt } = await this.otpService.createOtp(
      user.id,
      user.phone,
    );
    await this.otpService.sendOtp(user.phone, otpCode);

    console.log(
      `[AUTH] OTP sent to ${user.phone}, expires at ${expiresAt.toISOString()}`,
    );

    // Log activity
    await this.logActivity(
      user.id,
      'User logged in with credentials',
      'login_attempt',
    );

    return {
      success: true,
      message: 'Credentials verified. OTP sent to registered phone.',
      userId: user.id,
      requiresOtp: true,
      requiresFace: user.face_registered,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        faceRegistered: user.face_registered,
      },
    };
  }

  /**
   * Step 2: Verify OTP
   */
  async verifyOtp(userId: string, otpCode: string): Promise<OtpResponse> {
    console.log(`[AUTH] OTP verification attempt for user: ${userId}`);

    const result = await this.otpService.verifyOtp(userId, otpCode);

    if (result.success) {
      await this.logActivity(
        userId,
        'OTP verified successfully',
        'otp_verified',
      );
    } else {
      await this.logActivity(userId, 'OTP verification failed', 'otp_failed');
    }

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Step 3: Verify face encoding
   */
  async verifyFace(
    userId: string,
    faceEncoding: number[],
  ): Promise<FaceVerifyResponse> {
    console.log(`[AUTH] Face verification attempt for user: ${userId}`);

    // Check if OTP was verified first
    const { data: user } = await this.supabaseService
      .getClient()
      .from('users')
      .select('otp_verified, face_registered')
      .eq('id', userId)
      .single();

    if (!user?.otp_verified) {
      console.log(`[AUTH] ✗ OTP not verified for user: ${userId}`);
      throw new BadRequestException(
        'OTP must be verified before face verification',
      );
    }

    if (!user?.face_registered) {
      // Skip face verification if not registered
      console.log(`[AUTH] Face not registered, skipping for user: ${userId}`);
      return {
        success: true,
        message: 'Face verification skipped - not registered',
      };
    }

    const result = await this.faceService.verifyFace(userId, faceEncoding);

    if (result.success) {
      await this.logActivity(
        userId,
        'Face verified successfully',
        'face_verified',
      );
    } else {
      await this.logActivity(userId, 'Face verification failed', 'face_failed');
    }

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * Step 4: Get final auth token after all verifications
   */
  async getAuthToken(userId: string): Promise<AuthToken> {
    console.log(`[AUTH] Generating token for user: ${userId}`);

    // Get user and verify all steps completed
    const { data: user, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify OTP was completed
    if (!user.otp_verified) {
      throw new UnauthorizedException('OTP verification required');
    }

    // Verify face was completed (if registered)
    if (user.face_registered && !user.face_verified) {
      throw new UnauthorizedException('Face verification required');
    }

    // Update last login
    await this.supabaseService
      .getClient()
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    // Generate JWT token (iat and exp are set automatically by JWT module)
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      phone: user.phone,
      otpVerified: true,
      faceVerified: user.face_registered ? true : false,
    };

    const access_token = this.jwtService.sign(payload);

    await this.logActivity(
      userId,
      'User logged in successfully',
      'login_success',
    );

    console.log(`[AUTH] ✓ Token generated for user: ${user.username}`);

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: 24 * 60 * 60,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        department: user.department,
        designation: user.designation,
      },
    };
  }

  /**
   * Resend OTP to user
   */
  async resendOtp(userId: string): Promise<OtpResponse> {
    // Get user phone
    const { data: user, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('phone')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new BadRequestException('User not found');
    }

    const result = await this.otpService.resendOtp(userId, user.phone);

    await this.logActivity(userId, 'OTP resent', 'otp_sent');

    return result;
  }

  /**
   * Logout - reset verification status
   */
  async logout(userId: string): Promise<{ success: boolean; message: string }> {
    await this.supabaseService
      .getClient()
      .from('users')
      .update({ otp_verified: false, face_verified: false })
      .eq('id', userId);

    await this.logActivity(userId, 'User logged out', 'logout');

    console.log(`[AUTH] ✓ User logged out: ${userId}`);

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Validate user by ID and username
   */
  async validateUser(userId: string, username: string): Promise<User> {
    const { data: user, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('username', username)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // =====================================================
  // Admin functions for user management
  // =====================================================

  /**
   * Create a new user (Admin only)
   */
  async createUser(
    userData: CreateUserRequest,
  ): Promise<{ success: boolean; userId: string }> {
    console.log(`[AUTH] Creating new user: ${userData.username}`);

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(
      userData.password,
    );

    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .insert({
        ...userData,
        password: hashedPassword,
        is_active: true,
        face_registered: false,
        otp_verified: false,
        face_verified: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[AUTH] ✗ Failed to create user:', error);
      throw new BadRequestException(error.message);
    }

    console.log(`[AUTH] ✓ User created: ${userData.username} (${data.id})`);

    return { success: true, userId: data.id };
  }

  /**
   * Register face for a user (Admin only)
   */
  async registerUserFace(
    userId: string,
    faceEncoding: number[],
    profileImageUrl?: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.faceService.registerFace(userId, faceEncoding, profileImageUrl);
  }

  /**
   * Get all users (Admin only)
   */
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException('Failed to fetch users');
    }

    return data;
  }

  /**
   * Log user activity
   */
  private async logActivity(
    userId: string,
    action: string,
    actionType: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.supabaseService
        .getClient()
        .from('activity_log')
        .insert({
          user_id: userId,
          action,
          action_type: actionType,
          details: details || {},
        });
    } catch (error) {
      console.error('[AUTH] Failed to log activity:', error);
    }
  }
}
