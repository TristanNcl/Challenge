import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  HttpCode,
  Post,
  Request,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User } from 'src/users/interfaces/user.interface';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    const user = await this.authService.register(createUserDto);

    if (!user)
      throw new HttpException('Username already taken', HttpStatus.BAD_REQUEST);

    return user;
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('login')
  async login(@CurrentUser() user: User): Promise<{ accessToken: string }> {
    return this.authService.login(user);
  }

  @Get('logged_user')
  @UseGuards(JwtAuthGuard)
  async getLoggedUser(@CurrentUser() user: User): Promise<User> {
    return user;
  }
}
