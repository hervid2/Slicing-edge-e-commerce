'use client';

import { signIn as nextAuthSignIn } from 'next-auth/react';

export async function signIn(email: string, password: string) {
  const result = await nextAuthSignIn('credentials', {
    email,
    password,
    redirect: false,
  });

  if (!result || result.error) {
    throw new Error(result?.error || 'Invalid credentials');
  }

  if (result.url) {
    window.location.href = result.url;
  } else {
    window.location.href = '/';
  }

  return result;
}

export async function signInWithGoogle() {
  await nextAuthSignIn('google', {
    redirect: true,
    callbackUrl: '/',
  });
}
