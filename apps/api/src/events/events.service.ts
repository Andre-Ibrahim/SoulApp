import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { Availability, AvailabilityStatus } from './availability.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from '../users/user.entity';
import { config } from '../config';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly eventsRepo: Repository<Event>,
    @InjectRepository(Availability) private readonly availabilityRepo: Repository<Availability>,
  ) {}

  async createEvent(dto: CreateEventDto, createdBy: User) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid dates');
    }
    if (start > end) {
      throw new BadRequestException('Start date must be before end date');
    }
    const event = this.eventsRepo.create({
      title: dto.title,
      description: dto.description ?? '',
      startDate: start,
      endDate: end,
      maybeLimit: dto.maybeLimit ?? 0,
      timezone: config.appTimezone,
      createdBy,
    });
    return this.eventsRepo.save(event);
  }

  async listEvents() {
    const events = await this.eventsRepo.find({
      order: { startDate: 'ASC' },
      relations: {
        createdBy: true,
        availabilities: { user: true },
      },
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      maybeLimit: event.maybeLimit,
      timezone: event.timezone,
      createdBy: event.createdBy
        ? {
            id: event.createdBy.id,
            email: event.createdBy.email,
            firstName: event.createdBy.firstName,
            lastName: event.createdBy.lastName,
          }
        : null,
      availability: event.availabilities.map((availability) => ({
        id: availability.id,
        status: availability.status,
        user: availability.user
          ? {
              id: availability.user.id,
              email: availability.user.email,
              firstName: availability.user.firstName,
              lastName: availability.user.lastName,
            }
          : null,
      })),
    }));
  }

  async setAvailability(eventId: string, userId: string, status: AvailabilityStatus) {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const existing = await this.availabilityRepo.findOne({
      where: {
        event: { id: eventId },
        user: { id: userId },
      },
      relations: { user: true, event: true },
    });

    let finalStatus = status;
    if (status === AvailabilityStatus.MAYBE) {
      if (event.maybeLimit === 0) {
        finalStatus = AvailabilityStatus.UNAVAILABLE;
      } else {
        const qb = this.availabilityRepo.createQueryBuilder('availability');
        qb.where('availability.eventId = :eventId', { eventId });
        qb.andWhere('availability.status = :status', { status: AvailabilityStatus.MAYBE });
        if (existing?.user?.id) {
          qb.andWhere('availability.userId != :userId', { userId: existing.user.id });
        }
        const maybeCount = await qb.getCount();
        if (maybeCount >= event.maybeLimit) {
          finalStatus = AvailabilityStatus.UNAVAILABLE;
        }
      }
    }

    const availability = existing ??
      this.availabilityRepo.create({
        event: { id: eventId } as Event,
        user: { id: userId } as User,
        status: finalStatus,
      });

    availability.status = finalStatus;
    const saved = await this.availabilityRepo.save(availability);

    return {
      id: saved.id,
      status: saved.status,
      enforced: finalStatus !== status,
    };
  }
}
