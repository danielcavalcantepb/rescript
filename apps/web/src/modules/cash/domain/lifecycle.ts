export type CashEntryStatus = 'draft' | 'posted' | 'reversed' | 'cancelled'

export function canTransitionCashEntry(from: CashEntryStatus, to: CashEntryStatus): boolean {
  return (from === 'draft' && (to === 'posted' || to === 'cancelled')) || (from === 'posted' && to === 'reversed')
}
