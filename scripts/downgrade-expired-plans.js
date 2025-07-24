// scripts/downgrade-expired-plans.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function downgradeExpiredPlans() {
  const now = new Date();
  const expiredUsers = await prisma.user.findMany({
    where: {
      team: 'premium',
      planExpiredAt: { lte: now },
    },
  });
  for (const user of expiredUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        team: 'free',
        planExpiredAt: null,
      },
    });
    console.log(`User ${user.email || user.id} đã bị hạ xuống gói free.`);
  }
  if (expiredUsers.length === 0) {
    console.log('Không có user nào hết hạn gói pro.');
  }
  await prisma.$disconnect();
}

downgradeExpiredPlans().catch(e => {
  console.error(e);
  process.exit(1);
}); 