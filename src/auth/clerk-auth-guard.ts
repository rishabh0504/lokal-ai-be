import { verifyToken } from '@clerk/clerk-sdk-node';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  // Correctly extend Request
  user: {
    id: string;
  };
  headers: any;
  query: any;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly clerkSecretKey: string;

  constructor(private readonly configService: ConfigService) {
    // readonly
    this.clerkSecretKey =
      this.configService.get<string>('CLERK_SECRET_KEY', { infer: true }) || '';
    if (!this.clerkSecretKey) {
      throw new Error('CLERK_SECRET_KEY is not set in environment variables.');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();

    let token: string | undefined;

    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = request.query.token as string;
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
