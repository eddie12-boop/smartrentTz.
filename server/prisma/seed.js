const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const salt = await bcrypt.genSalt(10);
  const hashPassword = (password) => bcrypt.hash(password, salt);
  const commonPassword = await hashPassword('password123'); // Dev only password

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartrent.test' },
    update: {},
    create: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@smartrent.test',
      phone: '+255700000000',
      passwordHash: commonPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // Create Landlord
  const landlord = await prisma.user.upsert({
    where: { email: 'landlord@smartrent.test' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Masawe',
      email: 'landlord@smartrent.test',
      phone: '+255711111111',
      passwordHash: commonPassword,
      role: 'LANDLORD',
      isVerified: true,
    },
  });

  // Create Agent
  const agent = await prisma.user.upsert({
    where: { email: 'agent@smartrent.test' },
    update: {},
    create: {
      firstName: 'Sarah',
      lastName: 'Kimaro',
      email: 'agent@smartrent.test',
      phone: '+255722222222',
      passwordHash: commonPassword,
      role: 'AGENT',
      isVerified: true,
    },
  });

  // Create Tenant
  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@smartrent.test' },
    update: {},
    create: {
      firstName: 'Ali',
      lastName: 'Hassan',
      email: 'tenant@smartrent.test',
      phone: '+255733333333',
      passwordHash: commonPassword,
      role: 'TENANT',
      isVerified: true,
    },
  });

  // Create Amenities
  const amenitiesData = ['Parking', 'Security', 'WiFi', 'Water', 'Electricity', 'Air Conditioning'];
  const createdAmenities = [];
  for (const name of amenitiesData) {
    const amenity = await prisma.amenity.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    createdAmenities.push(amenity);
  }

  // Create Property
  const property = await prisma.property.create({
    data: {
      title: 'Sunrise Apartments Masaki',
      description: 'Luxury apartments in the heart of Masaki with ocean view.',
      propertyType: 'APARTMENT',
      status: 'PUBLISHED',
      address: 'Haile Selassie Road',
      region: 'Dar es Salaam',
      district: 'Kinondoni',
      ward: 'Masaki',
      ownerId: landlord.id,
      agentId: agent.id,
      latitude: -6.741,
      longitude: 39.278,
      units: {
        create: [
          {
            unitNumber: 'A01',
            bedrooms: 2,
            bathrooms: 2,
            monthlyRent: 850000,
            securityDeposit: 850000,
            status: 'AVAILABLE'
          },
          {
            unitNumber: 'A02',
            bedrooms: 3,
            bathrooms: 2,
            monthlyRent: 1200000,
            securityDeposit: 1200000,
            status: 'OCCUPIED'
          }
        ]
      },
      amenities: {
        create: [
          { amenityId: createdAmenities[0].id }, // Parking
          { amenityId: createdAmenities[1].id }, // Security
          { amenityId: createdAmenities[3].id }, // Water
        ]
      }
    }
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
