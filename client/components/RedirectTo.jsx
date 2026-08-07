'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectTo({ to }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [to, router]);
  return <div className="flex min-h-screen items-center justify-center"><div className="skeleton h-8 w-40" /></div>;
}