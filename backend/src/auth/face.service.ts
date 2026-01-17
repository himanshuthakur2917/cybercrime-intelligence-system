import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FaceService {
  // Threshold for face matching (lower = more strict)
  private readonly FACE_MATCH_THRESHOLD = 0.6;

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Calculate Euclidean distance between two face encodings
   */
  private calculateDistance(encoding1: number[], encoding2: number[]): number {
    if (encoding1.length !== encoding2.length) {
      throw new Error('Encoding dimensions do not match');
    }

    let sum = 0;
    for (let i = 0; i < encoding1.length; i++) {
      sum += Math.pow(encoding1[i] - encoding2[i], 2);
    }
    return Math.sqrt(sum);
  }

  /**
   * Convert Buffer to number array
   */
  private bufferToArray(buffer: Buffer): number[] {
    // Assuming face encoding is stored as Float64Array in BYTEA
    const float64Array = new Float64Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength / Float64Array.BYTES_PER_ELEMENT,
    );
    return Array.from(float64Array);
  }

  /**
   * Convert number array to Buffer
   */
  private arrayToBuffer(arr: number[]): Buffer {
    const float64Array = new Float64Array(arr);
    return Buffer.from(float64Array.buffer);
  }

  /**
   * Verify face encoding against stored encoding
   */
  async verifyFace(
    userId: string,
    inputEncoding: number[],
  ): Promise<{ success: boolean; message: string; confidence?: number }> {
    const client = this.supabaseService.getClient();

    // Get user's stored face encoding
    const { data: user, error } = await client
      .from('users')
      .select('face_encoding, face_registered, username')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.log(`[FACE] ✗ User not found: ${userId}`);
      return { success: false, message: 'User not found' };
    }

    if (!user.face_registered || !user.face_encoding) {
      console.log(`[FACE] ✗ Face not registered for user ${user.username}`);
      return { success: false, message: 'Face not registered for this user' };
    }

    try {
      // Convert stored encoding from Buffer to array
      const storedEncoding = this.bufferToArray(user.face_encoding);

      // Calculate distance between encodings
      const distance = this.calculateDistance(inputEncoding, storedEncoding);
      const confidence = Math.max(0, 1 - distance);

      console.log(
        `[FACE] Distance: ${distance.toFixed(4)}, Confidence: ${(confidence * 100).toFixed(2)}%`,
      );

      if (distance <= this.FACE_MATCH_THRESHOLD) {
        // Update user's face verification status
        await client
          .from('users')
          .update({ face_verified: true })
          .eq('id', userId);

        console.log(`[FACE] ✓ Face verified for user ${user.username}`);
        return {
          success: true,
          message: 'Face verified successfully',
          confidence,
        };
      } else {
        console.log(`[FACE] ✗ Face mismatch for user ${user.username}`);
        return {
          success: false,
          message: 'Face verification failed - does not match registered face',
          confidence,
        };
      }
    } catch (error) {
      console.error('[FACE] ✗ Verification error:', error);
      return { success: false, message: 'Face verification error' };
    }
  }

  /**
   * Register face encoding for a user (Admin only)
   */
  async registerFace(
    userId: string,
    faceEncoding: number[],
    profileImageUrl?: string,
  ): Promise<{ success: boolean; message: string }> {
    const client = this.supabaseService.getClient();

    try {
      // Convert encoding array to Buffer
      const encodingBuffer = this.arrayToBuffer(faceEncoding);

      // Update user with face encoding
      const updateData: Record<string, unknown> = {
        face_encoding: encodingBuffer,
        face_registered: true,
        face_registered_at: new Date().toISOString(),
      };

      if (profileImageUrl) {
        updateData.profile_image_url = profileImageUrl;
      }

      const { error } = await client
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('[FACE] ✗ Failed to register face:', error);
        throw new BadRequestException('Failed to register face encoding');
      }

      console.log(`[FACE] ✓ Face registered for user ${userId}`);
      return { success: true, message: 'Face registered successfully' };
    } catch (error) {
      console.error('[FACE] ✗ Registration error:', error);
      return { success: false, message: 'Failed to register face' };
    }
  }

  /**
   * Check if user has face registered
   */
  async hasFaceRegistered(userId: string): Promise<boolean> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('users')
      .select('face_registered')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.face_registered === true;
  }
}
