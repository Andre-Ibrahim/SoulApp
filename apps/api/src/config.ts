import * as dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}`);
  }
  return value;
}

export const config = {
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/soulapp',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminSignupSecret: process.env.ADMIN_SIGNUP_SECRET || 'dev_admin_secret',
  appTimezone: process.env.APP_TIMEZONE || 'America/Montreal',
};

export { requireEnv };
