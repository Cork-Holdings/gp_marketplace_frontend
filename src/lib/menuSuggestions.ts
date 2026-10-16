export function suggestedMenuSection(name: string): string | null {
  if (/\b(drink|coke|cola|fanta|sprite|juice|water|tea|coffee|soda)\b/i.test(name)) return 'Drinks';
  if (/\b(cake|ice cream|dessert|pudding|brownie)\b/i.test(name)) return 'Desserts';
  if (/\b(nshima|chicken|choma|platter|burger|steak|fish|pizza|rice|pasta)\b/i.test(name)) return 'Mains';
  if (/\b(chips|fries|side|vegetables)\b/i.test(name)) return 'Sides';
  return null;
}
