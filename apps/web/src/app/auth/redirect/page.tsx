import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AuthRedirectPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  redirect(role === 'ADMIN' ? '/admin' : '/');
}
