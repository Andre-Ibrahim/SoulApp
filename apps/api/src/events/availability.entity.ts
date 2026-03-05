import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { Event } from './event.entity';

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  MAYBE = 'maybe',
  UNAVAILABLE = 'unavailable',
}

@Entity('availabilities')
@Unique(['user', 'event'])
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.availabilities, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Event, (event) => event.availabilities, { onDelete: 'CASCADE' })
  event!: Event;

  @Column({ type: 'enum', enum: AvailabilityStatus })
  status!: AvailabilityStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
