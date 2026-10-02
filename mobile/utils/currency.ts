export const formatNaira = (kobo: number) =>
  '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });

export const parseNairaToKobo = (nairaString: string): number => {
  const cleaned = nairaString.replace(/[^0-9.]/g, '');
  const naira = parseFloat(cleaned);
  if (isNaN(naira)) return 0;
  return Math.round(naira * 100);
};