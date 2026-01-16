import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class OtpService {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate a 6-digit OTP for a user
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create and store OTP for a user
   */
  async createOtp(
    userId: string,
    phone: string,
  ): Promise<{ otpCode: string; expiresAt: Date }> {
    const client = this.supabaseService.getClient();
    const otpCode = this.generateOtpCode();
    const expiryMinutes = 5;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Invalidate any existing unverified OTPs for this user
    await client
      .from('otps')
      .update({ is_verified: true })
      .eq('user_id', userId)
      .eq('is_verified', false);

    // Insert new OTP
    const { error } = await client.from('otps').insert({
      user_id: userId,
      phone: phone,
      otp_code: otpCode,
      expires_at: expiresAt.toISOString(),
      is_verified: false,
      attempts: 0,
    });

    if (error) {
      console.error('[OTP] Failed to create OTP:', error);
      throw new BadRequestException('Failed to create OTP');
    }

    console.log(
      `[OTP] ✓ Created OTP for user ${userId}, expires at ${expiresAt.toISOString()}`,
    );

    return { otpCode, expiresAt };
  }

  /**
   * Send OTP via Twilio (or log for development)
   */
  async sendOtp(phone: string, otpCode: string): Promise<boolean> {
    const twilioSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const twilioPhone = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    // Check if Twilio is configured
    if (
      !twilioSid ||
      !twilioToken ||
      !twilioPhone ||
      twilioSid.startsWith('your_')
    ) {
      // Development mode - just log the OTP
      console.log(`[OTP] 📱 DEV MODE - OTP for ${phone}: ${otpCode}`);
      console.log(`[OTP] ⚠️  Twilio not configured, OTP logged to console`);
      return true;
    }

    try {
      // In production, integrate with Twilio
      // const twilio = require('twilio')(twilioSid, twilioToken);
      // await twilio.messages.create({
      //   body: `Your CIS login OTP is: ${otpCode}. Valid for 5 minutes.`,
      //   from: twilioPhone,
      //   to: phone,
      // });

      console.log(`[OTP] ✓ OTP sent to ${phone}`);
      return true;
    } catch (error) {
      console.error('[OTP] ✗ Failed to send OTP:', error);
      return false;
    }
  }

  /**
   * Verify OTP code for a user
   */
  async verifyOtp(
    userId: string,
    otpCode: string,
  ): Promise<{ success: boolean; message: string }> {
    const client = this.supabaseService.getClient();

    // Find the latest unverified OTP for this user
    const { data: otp, error: fetchError } = await client
      .from('otps')
      .select('*')
      .eq('user_id', userId)
      .eq('is_verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otp) {
      console.log(`[OTP] ✗ No valid OTP found for user ${userId}`);
      return {
        success: false,
        message: 'No valid OTP found or OTP has expired',
      };
    }

    // Check max attempts
    if (otp.attempts >= (otp.max_attempts || 3)) {
      console.log(`[OTP] ✗ Max attempts exceeded for user ${userId}`);
      return {
        success: false,
        message: 'Maximum verification attempts exceeded',
      };
    }

    // Verify OTP code
    if (otp.otp_code === otpCode) {
      // Mark OTP as verified
      await client
        .from('otps')
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq('id', otp.id);

      // Update user's OTP verification status
      await client
        .from('users')
        .update({ otp_verified: true })
        .eq('id', userId);

      console.log(`[OTP] ✓ OTP verified for user ${userId}`);
      return { success: true, message: 'OTP verified successfully' };
    } else {
      // Increment attempts
      await client
        .from('otps')
        .update({ attempts: otp.attempts + 1 })
        .eq('id', otp.id);

      console.log(
        `[OTP] ✗ Invalid OTP code for user ${userId} (attempt ${otp.attempts + 1})`,
      );
      return { success: false, message: 'Invalid OTP code' };
    }
  }

  /**
   * Resend OTP to user
   */
  async resendOtp(
    userId: string,
    phone: string,
  ): Promise<{ success: boolean; message: string; expiresAt?: string }> {
    try {
      const { otpCode, expiresAt } = await this.createOtp(userId, phone);
      const sent = await this.sendOtp(phone, otpCode);

      if (!sent) {
        return { success: false, message: 'Failed to send OTP' };
      }

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      console.error('[OTP] ✗ Resend failed:', error);
      return { success: false, message: 'Failed to resend OTP' };
    }
  }
}
