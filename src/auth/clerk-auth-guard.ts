import { verifyToken } from '@clerk/clerk-sdk-node';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express'; // Import Request type from express

// Define a type for the user object we'll attach to the request
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly clerkSecretKey: string; // readonly for immutability

  constructor(private readonly configService: ConfigService) {
    // readonly
    this.clerkSecretKey =
      this.configService.get<string>('CLERK_SECRET_KEY', { infer: true }) || ''; // Provide infer: true
    if (!this.clerkSecretKey) {
      throw new Error('CLERK_SECRET_KEY is not set in environment variables.');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest(); // Type the request

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.substring(7);

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
