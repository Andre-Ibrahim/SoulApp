import { IsEnum } from 'class-validator';
import { AvailabilityStatus } from '../availability.entity';

export class SetAvailabilityDto {
  @IsEnum(AvailabilityStatus)
  status!: AvailabilityStatus;
}
