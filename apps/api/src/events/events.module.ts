import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './event.entity';
import { Availability } from './availability.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Availability])],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
