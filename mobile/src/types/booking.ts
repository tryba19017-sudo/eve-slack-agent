export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  notes: string;
  startsAt: number; // unix ms
  durationMinutes: number;
  status: BookingStatus;
  createdAt: number;
  /** Set once the event has been written into the device calendar. */
  calendarEventId?: string;
}

export type NewBooking = Omit<
  Booking,
  "id" | "createdAt" | "status" | "calendarEventId"
>;
