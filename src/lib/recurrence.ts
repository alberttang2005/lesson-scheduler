import { addWeeks, addMonths, addYears } from "date-fns";

export type Frequency = "WEEKLY" | "MONTHLY" | "YEARLY";

export function generateInstances(
  startTime: Date,
  frequency: Frequency,
  interval: number,
  horizonMonths = 12
): Date[] {
  const instances: Date[] = [];
  const horizon = addMonths(startTime, horizonMonths);
  let current = startTime;

  while (current <= horizon) {
    instances.push(new Date(current));
    switch (frequency) {
      case "WEEKLY":
        current = addWeeks(current, interval);
        break;
      case "MONTHLY":
        current = addMonths(current, interval);
        break;
      case "YEARLY":
        current = addYears(current, interval);
        break;
    }
  }

  return instances;
}
