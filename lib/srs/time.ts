export const getStudyDayStart = (now: Date, dayStartHour: number): Date => {
  const start = new Date(now);
  start.setHours(dayStartHour, 0, 0, 0);
  if (now.getTime() < start.getTime()) {
    start.setDate(start.getDate() - 1);
  }
  return start;
};

export const getNextStudyDayStart = (now: Date, dayStartHour: number): Date => {
  const todayStart = getStudyDayStart(now, dayStartHour);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};
