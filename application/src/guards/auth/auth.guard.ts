import clerkClient from '@clerk/clerk-sdk-node';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger();

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    try {
      await clerkClient.verifyToken(request.cookies.__session);
    } catch (err) {
      console.log(err);

      this.logger.error(err);
      return false;
    }
    return true;
  }
}
