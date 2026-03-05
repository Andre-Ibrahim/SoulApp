import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { UsersModule } from './users/users.module';
import { config } from './config';
import { User } from './users/user.entity';
import { Event } from './events/event.entity';
import { Availability } from './events/availability.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: config.databaseUrl,
      entities: [User, Event, Availability],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    EventsModule,
  ],
})
export class AppModule {}
