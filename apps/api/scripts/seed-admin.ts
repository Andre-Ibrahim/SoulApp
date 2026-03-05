import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/users/user.entity';
import { UserRole } from '../src/users/roles.enum';
import { Event } from '../src/events/event.entity';
import { Availability } from '../src/events/availability.entity';
import { config } from '../src/config';

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: config.databaseUrl,
    entities: [User, Event, Availability],
  });

  await dataSource.initialize();
  const repo = dataSource.getRepository(User);

  const email = process.env.ADMIN_SEED_EMAIL || 'admin@soulapp.local';
  const password = process.env.ADMIN_SEED_PASSWORD || 'Admin123!';
  const firstName = process.env.ADMIN_SEED_FIRST_NAME || 'Admin';
  const lastName = process.env.ADMIN_SEED_LAST_NAME || 'User';

  const existing = await repo.findOne({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = UserRole.ADMIN;
    existing.firstName = firstName;
    existing.lastName = lastName;
    await repo.save(existing);
  } else {
    const user = repo.create({
      email,
      passwordHash,
      role: UserRole.ADMIN,
      firstName,
      lastName,
    });
    await repo.save(user);
  }

  await dataSource.destroy();

  console.log('ADMIN_EMAIL=' + email);
  console.log('ADMIN_PASSWORD=' + password);
  console.log('ADMIN_FIRST_NAME=' + firstName);
  console.log('ADMIN_LAST_NAME=' + lastName);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
