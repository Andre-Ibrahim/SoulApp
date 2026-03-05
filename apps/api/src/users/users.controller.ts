import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { UserRole } from './roles.enum';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: { id: string }) {
    const found = await this.usersService.findById(user.id);
    if (!found) {
      return null;
    }
    return {
      id: found.id,
      email: found.email,
      role: found.role,
      firstName: found.firstName,
      lastName: found.lastName,
      medicareNumber: found.medicareNumber,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@CurrentUser() user: { id: string }, @Body() dto: UpdateMeDto) {
    const updated = await this.usersService.updateMe(user.id, dto);
    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      firstName: updated.firstName,
      lastName: updated.lastName,
      medicareNumber: updated.medicareNumber,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  list() {
    return this.usersService.listAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  setRole(@Param('id') id: string, @Body() body: { role: UserRole }) {
    return this.usersService.setRole(id, body.role);
  }
}
