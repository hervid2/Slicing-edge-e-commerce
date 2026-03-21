import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;
  if (role !== 'ADMIN') {
    redirect('/');
  }
  return session;
}

export async function getOptionalSession() {
  return await auth();
}
