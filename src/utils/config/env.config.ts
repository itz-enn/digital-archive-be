import * as dotenv from 'dotenv';
dotenv.config();

const envConfig = {
  databaseUrl: process.env.DATABASE_URL,
  dbType: process.env.DB_TYPE as 'mysql' | 'postgres' | 'sqlite',
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  nodeEnv: process.env.NODE_ENV,
  frontendUrl: process.env.FRONTEND_URL,
  jwtSecret: process.env.JWT_SECRET,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  adminInstitutionId: process.env.ADMIN_INSTITUTION_ID,
};

export default envConfig;
