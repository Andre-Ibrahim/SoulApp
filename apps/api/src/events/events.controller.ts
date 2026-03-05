import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/roles.enum';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  list() {
    return this.eventsService.listEvents();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateEventDto, @CurrentUser() user: { id: string }) {
    return this.eventsService.createEvent(dto, { id: user.id } as any);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/availability')
  setAvailability(
    @Param('id') id: string,
    @Body() dto: SetAvailabilityDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.eventsService.setAvailability(id, user.id, dto.status);
  }
}
