import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import type { JwtPayload } from './interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'your-secret-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    // Fetch user from database to ensure they still exist and are active
    const { data: user, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select(
        'id, username, email, name, role, is_active, department, designation',
      )
      .eq('id', payload.sub)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Return user object that will be attached to request
    return {
      sub: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      designation: user.designation,
      otpVerified: payload.otpVerified,
      faceVerified: payload.faceVerified,
    };
  }
}
