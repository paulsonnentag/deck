export const addDay = (date: Date, days: number) => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

export const addWeek = (date: Date, weeks: number) => {
  return new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
};
