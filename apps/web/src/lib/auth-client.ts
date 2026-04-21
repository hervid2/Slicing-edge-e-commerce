'use client';

import { signIn as nextAuthSignIn, getSession } from 'next-auth/react';

export async function signIn(email: string, password: string) {
  const result = await nextAuthSignIn('credentials', {
    email,
    password,
    redirect: false,
  });

  if (!result || result.error) {
    throw new Error(result?.error || 'Invalid credentials');
  }

  const session = await getSession();
  const role = (session?.user as { role?: string })?.role;
  window.location.href = role === 'ADMIN' ? '/admin' : '/';

  return result;
}

export async function signInWithGoogle() {
  await nextAuthSignIn('google', {
    redirect: true,
    callbackUrl: '/auth/redirect',
  });
}
