import * as Calendar from "expo-calendar";
import { Platform } from "react-native";

/**
 * Finds (or creates, on Android) a calendar we're allowed to write events
 * into. On iOS we reuse the device's default writable calendar so the
 * event shows up in the user's normal Calendar app straight away.
 */
async function getWritableCalendarId(): Promise<string> {
  if (Platform.OS === "ios") {
    const defaultCalendar = await Calendar.getDefaultCalendarAsync();
    return defaultCalendar.id;
  }

  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT
  );
  const writable = calendars.find(
    (cal) => cal.allowsModifications && cal.accessLevel === "owner"
  );
  if (writable) return writable.id;

  const defaultCalendarSource =
    calendars.find((cal) => cal.source?.name === "Default")?.source ??
    calendars[0]?.source;

  const newCalendarId = await Calendar.createCalendarAsync({
    title: "FitTrainer",
    color: "#2F80ED",
    entityType: Calendar.EntityTypes.EVENT,
    source: defaultCalendarSource,
    name: "fitTrainerBookings",
    ownerAccount: "fitTrainer",
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
  return newCalendarId;
}

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === "granted";
}

interface CalendarEventInput {
  title: string;
  notes?: string;
  startsAt: number;
  durationMinutes: number;
}

/**
 * Adds the booking straight into the device calendar (Apple Calendar on
 * iOS, the default calendar app on Android) so the client sees it without
 * any extra steps. Returns the created event id, stored back on the
 * booking so it could be updated/removed later if the session is
 * rescheduled or cancelled.
 */
export async function addBookingToCalendar(
  event: CalendarEventInput
): Promise<string> {
  const granted = await requestCalendarPermission();
  if (!granted) {
    throw new Error("Нет доступа к календарю");
  }

  const calendarId = await getWritableCalendarId();
  const startDate = new Date(event.startsAt);
  const endDate = new Date(event.startsAt + event.durationMinutes * 60_000);

  const eventId = await Calendar.createEventAsync(calendarId, {
    title: event.title,
    notes: event.notes,
    startDate,
    endDate,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    alarms: [{ relativeOffset: -60 }],
  });

  return eventId;
}

export async function removeBookingFromCalendar(
  eventId: string
): Promise<void> {
  try {
    await Calendar.deleteEventAsync(eventId);
  } catch {
    // Event may already be gone from the calendar; nothing to do.
  }
}
