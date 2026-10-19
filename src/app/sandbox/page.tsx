'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuantumStore } from '@/store/useQuantumStore';

export default function SandboxPage() {
  const router = useRouter();

  useEffect(() => {
    useQuantumStore.getState().setAppViewState('SANDBOX');
    router.replace('/');
  }, [router]);

  return null;
}
