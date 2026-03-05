import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Availability } from './availability.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @Column({ type: 'timestamptz' })
  startDate!: Date;

  @Column({ type: 'timestamptz' })
  endDate!: Date;

  @Column({ type: 'int', default: 0 })
  maybeLimit!: number;

  @Column({ default: 'America/Montreal' })
  timezone!: string;

  @ManyToOne(() => User, (user) => user.createdEvents, { onDelete: 'SET NULL' })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Availability, (availability) => availability.event)
  availabilities!: Availability[];
}
