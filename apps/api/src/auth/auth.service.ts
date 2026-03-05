import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/roles.enum';
import { config } from '../config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    adminSignupSecret?: string,
  ) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const role = adminSignupSecret === config.adminSignupSecret ? UserRole.ADMIN : UserRole.USER;
    const user = await this.usersService.createUser({
      email,
      firstName,
      lastName,
      medicareNumber: null,
      passwordHash,
      role,
    });
    return this.createToken(
      user.id,
      user.email,
      user.role,
      user.firstName,
      user.lastName,
      user.medicareNumber,
    );
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.createToken(
      user.id,
      user.email,
      user.role,
      user.firstName,
      user.lastName,
      user.medicareNumber,
    );
  }

  private createToken(
    id: string,
    email: string,
    role: UserRole,
    firstName: string,
    lastName: string,
    medicareNumber: string | null,
  ) {
    const payload = { sub: id, email, role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: { id, email, role, firstName, lastName, medicareNumber },
    };
  }
}
