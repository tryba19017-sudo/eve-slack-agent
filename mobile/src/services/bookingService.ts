import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Booking, BookingStatus, NewBooking } from "@/types/booking";

const BOOKINGS_COLLECTION = "bookings";

/**
 * Creates a booking in Firestore. The trainer's dashboard is subscribed via
 * subscribeToBookings(), so this shows up on their device in real time.
 */
export async function createBooking(input: NewBooking): Promise<string> {
  const ref = await addDoc(collection(db, BOOKINGS_COLLECTION), {
    ...input,
    status: "pending" as BookingStatus,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function setBookingStatus(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), { status });
}

export async function attachCalendarEventId(
  bookingId: string,
  calendarEventId: string
): Promise<void> {
  await updateDoc(doc(db, BOOKINGS_COLLECTION, bookingId), {
    calendarEventId,
  });
}

/**
 * Live subscription to all bookings, newest session first. Used by the
 * trainer dashboard so new client sign-ups appear immediately.
 */
export function subscribeToBookings(
  onChange: (bookings: Booking[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, BOOKINGS_COLLECTION),
    orderBy("startsAt", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const bookings = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          clientName: data.clientName,
          clientPhone: data.clientPhone,
          notes: data.notes ?? "",
          startsAt: data.startsAt,
          durationMinutes: data.durationMinutes,
          status: data.status,
          createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
          calendarEventId: data.calendarEventId,
        } as Booking;
      });
      onChange(bookings);
    },
    (error) => onError?.(error)
  );
}
