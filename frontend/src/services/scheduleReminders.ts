// This frontend app does not run the Node-based cron reminder scheduler.
// Keeping this file as a no-op avoids compile failures from backend-only imports.
export const scheduleSessionReminders = () => {
  return undefined;
};
