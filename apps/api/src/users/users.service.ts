import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserRole } from './roles.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
  }

  listAll() {
    return this.usersRepo.find({
      select: ['id', 'email', 'firstName', 'lastName', 'medicareNumber', 'role', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateMe(id: string, data: Partial<User>) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (typeof data.firstName === 'string') {
      user.firstName = data.firstName;
    }
    if (typeof data.lastName === 'string') {
      user.lastName = data.lastName;
    }
    if (data.medicareNumber !== undefined) {
      user.medicareNumber = data.medicareNumber || null;
    }
    return this.usersRepo.save(user);
  }

  async setRole(id: string, role: UserRole) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.role = role;
    return this.usersRepo.save(user);
  }

  createUser(data: Partial<User>) {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }
}
