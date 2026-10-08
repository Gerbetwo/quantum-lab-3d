import { redirect } from 'next/navigation';

export default function LabPage() {
  redirect('/sandbox');
  return null; // <--- Esto evita que el tipo de retorno sea () => void
}
