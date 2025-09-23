import { DataSource } from 'typeorm';
import envConfig from '../utils/config/env.config';
import { User, UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';

const {
  dbType,
  dbHost,
  dbPort,
  dbUser,
  dbPassword,
  dbName,
  nodeEnv,
  adminEmail,
  adminPassword,
  adminInstitutionId
} = envConfig;

export const dataSource = new DataSource({
  type: dbType,
  host: dbHost,
  port: Number(dbPort),
  username: dbUser,
  password: dbPassword,
  database: dbName,
  entities: [User],
  synchronize: nodeEnv !== 'production',
  extra: {
    connectionLimit: 10,
  },
  driver: require('mysql2'),
});

export async function adminSeed() {
  await dataSource.initialize();
  const userRepository = dataSource.getRepository(User);

  // Check if the admin email already exists
  const existingUser = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existingUser) {
    console.log('Admin account already exists:', existingUser);
    await dataSource.destroy();
    return; // Exit the function if the user already exists
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = userRepository.create({
    fullName: 'Admin',
    institutionId: adminInstitutionId,
    email: adminEmail,
    password: hashedPassword,
    phone: '1234567890',
    role: UserRole.admin,
  });
  await userRepository.save(adminUser);
  console.log('Admin user seeded:', adminUser);

  await dataSource.destroy();
}

adminSeed().catch((error) => console.error('Seeding failed:', error));
