import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class ClerkGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      const auth = request.auth;

      if (!auth.userId) {
        throw new UnauthorizedException('User not authenticated.');
      }

      return true;
    } catch (error) {
      console.error('Error in ClerkGuard:', error);
      throw new UnauthorizedException('Authentication failed.');
    }
  }
}
