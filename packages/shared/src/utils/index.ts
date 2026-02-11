export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}k`;
  return count.toString();
}

export function calculateCommission(amount: number, rate: number): { commission: number; payout: number } {
  const commission = Math.round(amount * rate);
  return { commission, payout: amount - commission };
}

export function isValidStateTransition(
  stateMachine: Record<string, string[]>,
  currentState: string,
  newState: string
): boolean {
  const allowedStates = stateMachine[currentState];
  return allowedStates ? allowedStates.includes(newState) : false;
}
