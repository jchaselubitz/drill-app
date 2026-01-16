export const getStudyDayStart = (now: Date, dayStartHour: number): Date => {
  const start = new Date(now);
  start.setHours(dayStartHour, 0, 0, 0);
  if (now.getTime() < start.getTime()) {
    start.setDate(start.getDate() - 1);
  }
  return start;
};
