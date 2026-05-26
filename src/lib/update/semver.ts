export function semverGt(a: string, b: string): boolean {
  const parse = (s: string) =>
    s.split(".").slice(0, 3).map((p) => parseInt(p, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return true;
    if (pa[i] < pb[i]) return false;
  }
  return false;
}
