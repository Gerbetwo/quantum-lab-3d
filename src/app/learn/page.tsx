'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuantumStore } from '@/store/useQuantumStore';

export default function LearnPage() {
  const router = useRouter();

  useEffect(() => {
    useQuantumStore.getState().setAppViewState('CAMPAIGN_SELECT');
    router.replace('/');
  }, [router]);

  return null;
}