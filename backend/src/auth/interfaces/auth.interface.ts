export interface LoginRequest {
  username: string;
  password: string;
}

export interface OtpRequest {
  userId: string;
}

export interface OtpVerifyRequest {
  userId: string;
  otpCode: string;
}

export interface FaceVerifyRequest {
  userId: string;
  faceEncoding: number[]; // Face encoding array from frontend
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
  phone: string;
  otpVerified: boolean;
  faceVerified: boolean;
  iat?: number; // Added automatically by JWT module
  exp?: number; // Added automatically by JWT module
}

export interface LoginResponse {
  success: boolean;
  message: string;
  userId?: string;
  requiresOtp: boolean;
  requiresFace: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    phone: string;
    faceRegistered: boolean;
  };
}

export interface OtpResponse {
  success: boolean;
  message: string;
  expiresAt?: string;
}

export interface FaceVerifyResponse {
  success: boolean;
  message: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    phone: string;
    department?: string;
    designation?: string;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string;
  password: string;
  phone: string;
  is_active: boolean;
  face_encoding: Buffer | null;
  face_registered: boolean;
  face_registered_at: string | null;
  employee_id: string | null;
  department: string | null;
  designation: string | null;
  profile_image_url: string | null;
  last_login: string | null;
  otp_verified: boolean;
  face_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Admin interfaces for user management
export interface CreateUserRequest {
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'officer' | 'administrator';
  employee_id?: string;
  department?: string;
  designation?: string;
}

export interface UpdateFaceEncodingRequest {
  userId: string;
  faceEncoding: number[];
  profileImageUrl?: string;
}
