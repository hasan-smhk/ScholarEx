import { PrismaClient } from '@prisma/client';

export async function getCounselorProfileIdForUser(
  prisma: PrismaClient,
  userId: string
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, role: true },
  });
  if (!user || user.role !== 'COUNSELOR') return null;

  const linkedCounselor = await prisma.counselor.findUnique({
    where: { userId },
    select: { id: true, approvalStatus: true },
  });
  if (linkedCounselor) {
    return linkedCounselor.approvalStatus === 'APPROVED' ? linkedCounselor.id : null;
  }

  const legacyCounselors = await prisma.counselor.findMany({
    where: { email: { equals: user.email, mode: 'insensitive' } },
    select: { id: true, userId: true, approvalStatus: true },
    take: 2,
  });
  if (legacyCounselors.length !== 1) return null;
  const legacyCounselor = legacyCounselors[0];
  if (!legacyCounselor || legacyCounselor.userId || legacyCounselor.approvalStatus !== 'APPROVED') return null;

  const linked = await prisma.counselor.updateMany({
    where: { id: legacyCounselor.id, userId: null },
    data: { userId },
  });
  if (linked.count === 1) return legacyCounselor.id;

  const currentLink = await prisma.counselor.findUnique({
    where: { userId },
    select: { id: true, approvalStatus: true },
  });
  return currentLink?.approvalStatus === 'APPROVED' ? currentLink.id : null;
}
