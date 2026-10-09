import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { isUniqueViolationOn } from '../prisma/prisma-errors.js';
import { hash } from 'bcryptjs';

const PASSWORD_HASH_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const passwordHash = await hash(data.password, PASSWORD_HASH_ROUNDS);

    try {
      return await this.prisma.user.create({
        data: { name: data.name, email: data.email, password: passwordHash },
        omit: { password: true },
      });
    } catch (error) {
      if (isUniqueViolationOn(error, 'email')) {
        throw new ConflictException('email já cadastrado');
      }
      throw error;
    }
  }
}
