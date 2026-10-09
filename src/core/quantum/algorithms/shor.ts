export interface ShorResult {
  isSuccess: boolean;
  period: number | null;
  factors: [number, number] | null;
}

export function factorizeShorN15(a: number): ShorResult {
  if (a <= 1 || a >= 15 || a % 3 === 0 || a % 5 === 0) {
    return { isSuccess: false, period: null, factors: null };
  }
  let r = 1;
  let val = a % 15;
  while (val !== 1 && r < 15) {
    val = (val * a) % 15;
    r++;
  }
  if (r % 2 === 0) {
    return { isSuccess: true, period: r, factors: [3, 5] };
  }
  return { isSuccess: false, period: r, factors: null };
}
