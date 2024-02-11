import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PASSWORD_MIN_LENGTH, SALT_ROUNDS } from '../constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsername(username);

    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      return user;
    }

    return null;
  }

  async validateUserById(id: number): Promise<User | null> {
    return await this.usersService.findOne(id);
  }

  async login(user: User): Promise<{ accessToken: string }> {
    const payload = { username: user.username, sub: user._id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(user: CreateUserDto): Promise<User> {
    console.log(user)
    if (!this.isStrongPassword(user.password)) {
      throw new BadRequestException(
        'Password must contain at least one capital letter and one number, min 8 character.',
      );
    }

    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
    const newUser = {
      ...user,
      password: hashedPassword,
    };

    const existingUser = await this.usersService.findByUsername(user.username);

    if (existingUser) return null;

    return this.usersService.create(newUser);
  }

  private isStrongPassword(password: string): boolean {
    // Check for at least one capital letter and one number
    const hasCapitalLetter = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasLength = password.length > PASSWORD_MIN_LENGTH;

    return hasCapitalLetter && hasNumber && hasLength;
  }
}
