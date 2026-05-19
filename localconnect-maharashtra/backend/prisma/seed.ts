import { PrismaClient, Role, PostCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertLocation(name: string, type: string, parentId?: string) {
  const existing = await prisma.location.findFirst({
    where: { name, type, parentId: parentId ?? null },
  });
  if (existing) return existing;
  return prisma.location.create({ data: { name, type, parentId } });
}

const maharashtraData = {
  state: 'Maharashtra',
  cities: [
    {
      name: 'Pune',
      areas: [
        { name: 'Wakad', societies: ['Pride Purple Park', 'Green Valley Society', 'Mont Vert Avion'] },
        { name: 'Hinjewadi', societies: ['Megapolis', 'Blue Ridge'] },
        { name: 'Baner', societies: ['Beverly Hills', 'Pancard Club'] },
        { name: 'Kharadi', societies: ['World Trade Center Residency', 'Nyati Epiphany'] },
      ],
    },
    {
      name: 'Mumbai',
      areas: [
        { name: 'Andheri', societies: ['Lokhandwala Complex', 'Oshiwara Heights'] },
        { name: 'Powai', societies: ['Hiranandani Gardens', 'Lake Homes'] },
        { name: 'Bandra', societies: ['Pali Hill', 'Bandra West Society'] },
      ],
    },
    {
      name: 'Nagpur',
      areas: [
        { name: 'Dharampeth', societies: ['Civil Lines Society', 'Dharampeth Greens'] },
        { name: 'Sitabuldi', societies: ['Sitabuldi Heights', 'Central Nagpur Society'] },
      ],
    },
    { name: 'Nashik', areas: [{ name: 'Gangapur Road', societies: ['Green Park', 'Nashik Hills'] }] },
    { name: 'Aurangabad', areas: [{ name: 'CIDCO', societies: ['CIDCO Phase 1', 'Prozone Area'] }] },
    { name: 'Kolhapur', areas: [{ name: 'Rajarampuri', societies: ['Royal Society', 'Kolhapur Greens'] }] },
    { name: 'Thane', areas: [{ name: 'Ghodbunder Road', societies: ['Hiranandani Estate', 'Lodha Amara'] }] },
    { name: 'Solapur', areas: [{ name: 'Siddheshwar Peth', societies: ['Solapur Central', 'Green City'] }] },
  ],
};

async function seedLocations() {
  const state = await upsertLocation(maharashtraData.state, 'state');
  const locationMap: Record<string, string> = {};

  for (const city of maharashtraData.cities) {
    const cityLoc = await upsertLocation(city.name, 'city', state.id);
    locationMap[city.name] = cityLoc.id;

    for (const area of city.areas) {
      const areaLoc = await upsertLocation(area.name, 'area', cityLoc.id);
      locationMap[`${city.name}-${area.name}`] = areaLoc.id;

      for (const society of area.societies) {
        const societyLoc = await upsertLocation(society, 'society', areaLoc.id);
        locationMap[`${city.name}-${area.name}-${society}`] = societyLoc.id;
      }
    }
  }

  return { state, locationMap };
}

async function main() {
  console.log('Seeding database...');
  const { locationMap } = await seedLocations();

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const demoUsers = [
    { email: 'admin@localconnect.in', firstName: 'Admin', lastName: 'User', role: Role.ADMIN, locationKey: 'Pune-Wakad-Pride Purple Park' },
    { email: 'moderator@localconnect.in', firstName: 'Mod', lastName: 'Erator', role: Role.MODERATOR, locationKey: 'Pune-Wakad-Pride Purple Park' },
    { email: 'rajesh@example.com', firstName: 'Rajesh', lastName: 'Patil', role: Role.USER, locationKey: 'Pune-Wakad-Pride Purple Park' },
    { email: 'priya@example.com', firstName: 'Priya', lastName: 'Sharma', role: Role.USER, locationKey: 'Mumbai-Powai-Hiranandani Gardens' },
    { email: 'amit@example.com', firstName: 'Amit', lastName: 'Deshmukh', role: Role.USER, locationKey: 'Nagpur-Dharampeth-Civil Lines Society' },
  ];

  const users = [];
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash,
        role: u.role,
        emailVerified: true,
        locationId: locationMap[u.locationKey],
      },
    });
    users.push(user);
  }

  const postCount = await prisma.post.count();
  if (postCount === 0) {
    const samplePosts = [
      { author: users[2], content: 'Welcome to Pride Purple Park! Great community here in Wakad, Pune.', category: PostCategory.GENERAL, locationKey: 'Pune-Wakad-Pride Purple Park' },
      { author: users[2], content: 'Selling a barely used bicycle - ₹3500. Contact in comments.', category: PostCategory.BUY_SELL, locationKey: 'Pune-Wakad-Pride Purple Park' },
      { author: users[3], content: 'Lost cat near Hiranandani Gardens, Powai. Orange tabby, answers to "Mango".', category: PostCategory.LOST_FOUND, locationKey: 'Mumbai-Powai-Hiranandani Gardens' },
      { author: users[4], content: 'Society Diwali celebration on 1st November at 6 PM. All welcome!', category: PostCategory.EVENTS, locationKey: 'Nagpur-Dharampeth-Civil Lines Society' },
      { author: users[2], content: 'Water supply will be interrupted tomorrow 10 AM - 2 PM. Please store water.', category: PostCategory.ALERTS, locationKey: 'Pune-Wakad-Pride Purple Park' },
    ];

    for (const p of samplePosts) {
      await prisma.post.create({
        data: {
          content: p.content,
          category: p.category,
          authorId: p.author.id,
          locationId: locationMap[p.locationKey],
          tags: ['maharashtra', 'community'],
        },
      });
    }

    await prisma.marketplaceItem.create({
      data: {
        title: 'Samsung TV 43 inch',
        description: 'Excellent condition, 2 years old, with wall mount.',
        price: 18000,
        authorId: users[2].id,
        locationId: locationMap['Pune-Wakad-Pride Purple Park'],
        photos: [],
        contactPhone: '+919876543210',
      },
    });
  }

  console.log('Seed completed!');
  console.log('Demo credentials (all use password: Password123!):');
  console.log('  admin@localconnect.in (Admin)');
  console.log('  moderator@localconnect.in (Moderator)');
  console.log('  rajesh@example.com (User - Pune/Wakad)');
  console.log('  priya@example.com (User - Mumbai/Powai)');
  console.log('  amit@example.com (User - Nagpur)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
