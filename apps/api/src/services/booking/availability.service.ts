import { DatabaseManager } from '@codename/database';

const SLOT_INCREMENT_MINS = 15;

export class AvailabilityService {
  constructor(private db: DatabaseManager) {}

  /**
   * Calculates available start times for a given date and duration
   */
  async getAvailableSlots(tenantId: string, dateStr: string, duration: number, buffer: number = 0) {
    // Ensure date is parsed as UTC date only (YYYY-MM-DD)
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = date.getUTCDay();

    // 1. Get Working Hours for the day
    const hoursResult = await this.db.queryInSchema(tenantId, 
      `SELECT staff_id, start_time, end_time FROM availability WHERE day_of_week = $1`,
      [dayOfWeek]
    );

    // 2. Get Bookings for the day
    const bookingsResult = await this.db.queryInSchema(tenantId,
      `SELECT staff_id, start_time, end_time FROM bookings 
       WHERE start_time::date = $1::date AND status != 'cancelled'`,
      [dateStr]
    );

    const availableSlots: string[] = [];

    for (const hours of hoursResult.rows) {
      const staffId = hours.staff_id;
      // Re-construct UTC date-times for working hours
      const dayStart = new Date(`${dateStr}T${hours.start_time}Z`);
      const dayEnd = new Date(`${dateStr}T${hours.end_time}Z`);

      const staffBookings = bookingsResult.rows
        .filter(b => b.staff_id === staffId)
        .sort((a, b) => a.start_time.getTime() - b.start_time.getTime());

      // 3. Scan for slots in configurable increments
      let current = new Date(dayStart);
      
      while (current.getTime() + duration * 60000 <= dayEnd.getTime()) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + duration * 60000);
        
        const isConflict = staffBookings.some(booking => {
          const bStart = new Date(booking.start_time);
          const bEnd = new Date(booking.end_time);
          
          const paddedStart = new Date(slotStart.getTime() - buffer * 60000);
          const paddedEnd = new Date(slotEnd.getTime() + buffer * 60000);
          
          return (paddedStart < bEnd) && (paddedEnd > bStart);
        });

        if (!isConflict) {
          availableSlots.push(slotStart.toISOString());
        }

        // Increment by fixed interval
        current = new Date(current.getTime() + SLOT_INCREMENT_MINS * 60000);
      }
    }

    // Return unique start times (deduplicated across staff)
    return Array.from(new Set(availableSlots)).sort();
  }
}
