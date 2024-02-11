import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // If there's an error or no user is found, throw UnauthorizedException
    if (err || !user) {
      throw new UnauthorizedException('Unauthorized access');
    }
    // If user is found, return the user
    return user;
  }
}
