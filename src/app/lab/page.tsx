import { redirect } from 'next/navigation';

export default function LabPage() {
  redirect('/sandbox');
  return null;
}
