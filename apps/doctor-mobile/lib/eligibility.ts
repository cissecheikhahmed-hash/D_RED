// Dupliqué depuis apps/donor-mobile/screens/DonorDashboardScreen.tsx : les
// deux apps sont des projets Expo séparés sans package partagé pour cette
// petite logique. À factoriser dans un package commun si elle évolue.
const MIN_MONTHS_BETWEEN_DONATIONS: Record<'F' | 'M', number> = { F: 3, M: 4 };

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((to.getTime() - from.getTime()) / msPerDay);
}

export function getEligibility(
  lastDonationDate: Date | null,
  sex: 'F' | 'M' | null,
): { eligible: boolean; daysRemaining: number; monthsRemaining: number } {
  if (!lastDonationDate) return { eligible: true, daysRemaining: 0, monthsRemaining: 0 };

  const requiredMonths = sex ? MIN_MONTHS_BETWEEN_DONATIONS[sex] : MIN_MONTHS_BETWEEN_DONATIONS.M;
  const eligibleFrom = addMonths(lastDonationDate, requiredMonths);
  const daysRemaining = Math.max(daysBetween(new Date(), eligibleFrom), 0);

  return {
    eligible: daysRemaining <= 0,
    daysRemaining,
    monthsRemaining: Math.ceil(daysRemaining / 30),
  };
}
