import { verifyToken } from '@clerk/clerk-sdk-node';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// Define a more precise type for the user object
interface User {
  id: string;
}

// Extend the Request type with the user property
export interface AuthenticatedRequest extends Request {
  user: User; // Use the User interface for better type safety
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly clerkSecretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.clerkSecretKey =
      this.configService.get<string>('CLERK_SECRET_KEY', { infer: true }) || '';
    if (!this.clerkSecretKey) {
      throw new Error('CLERK_SECRET_KEY is not set in environment variables.');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>(); // Correct type assertion

    let token: string | undefined;

    const authHeader: string | undefined = request.headers?.authorization; // Type as string or undefined

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = request.query?.token as string | undefined; // type as string or undefined, also protect query
    }

    if (!token) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header or token query parameter',
      );
    }

    try {
      const decodedToken = await verifyToken(token, {
        secretKey: this.clerkSecretKey,
      });

      request.user = { id: decodedToken.sub };

      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
