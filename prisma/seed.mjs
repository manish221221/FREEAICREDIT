import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const user = await prisma.user.upsert({
    where: { id: 'demo-user' },
    update: {},
    create: { id: 'demo-user' },
  });

  const pool = await prisma.pool.upsert({
    where: { id: 'demo-pool' },
    update: { name: 'Study Group GPT' },
    create: { id: 'demo-pool', name: 'Study Group GPT' },
  });

  await prisma.poolMember.upsert({
    where: { userId_poolId: { userId: user.id, poolId: pool.id } },
    update: { role: 'admin', active: true },
    create: { userId: user.id, poolId: pool.id, role: 'admin', active: true },
  });

  const today = new Date();
  // generate 30 days of usage events
  const events = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const personalCount = rnd(0, 3);
    const poolCount = rnd(0, 5);

    for (let j = 0; j < personalCount; j++) {
      const pt = rnd(50, 500);
      const ct = rnd(50, 800);
      events.push({
        userId: user.id,
        status: 'success',
        promptTokens: pt,
        completionTokens: ct,
        costUSD: (pt + ct) * 0.0000005,
        latencyMs: rnd(200, 3000),
        createdAt: d,
      });
    }

    for (let j = 0; j < poolCount; j++) {
      const pt = rnd(50, 500);
      const ct = rnd(50, 800);
      events.push({
        userId: user.id,
        poolId: pool.id,
        status: 'success',
        promptTokens: pt,
        completionTokens: ct,
        costUSD: (pt + ct) * 0.0000005,
        latencyMs: rnd(200, 3000),
        createdAt: d,
      });
    }
  }

  if (events.length) {
    await prisma.usageEvent.createMany({ data: events });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});

