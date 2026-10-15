import { formatSlotDate } from './slotDate';

describe('formatSlotDate', () => {
  it('keeps the slot calendar date in timezones west of UTC', () => {
    const originalTimezone = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';

    try {
      expect(
        formatSlotDate('2026-10-06T00:00:00.000Z', 'en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
        })
      ).toBe('10/6/2026');
    } finally {
      if (originalTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimezone;
      }
    }
  });
});
