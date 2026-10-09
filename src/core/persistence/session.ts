export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'QL-SERVER';
  let id = localStorage.getItem('quantum_lab_user_id');
  if (!id) {
    id = 'QL-' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('quantum_lab_user_id', id);
  }
  return id;
}
