import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import type { Booking } from "@/types/booking";
import { setBookingStatus, subscribeToBookings } from "@/services/bookingService";
import { removeBookingFromCalendar } from "@/services/calendarService";
import BookingListItem from "@/components/BookingListItem";

export default function TrainerDashboardScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToBookings(
      (data) => {
        setBookings(data);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        Alert.alert("Ошибка синхронизации", error.message);
      }
    );
    return unsubscribe;
  }, []);

  async function handleConfirm(booking: Booking) {
    await setBookingStatus(booking.id, "confirmed");
  }

  async function handleCancel(booking: Booking) {
    await setBookingStatus(booking.id, "cancelled");
    if (booking.calendarEventId) {
      await removeBookingFromCalendar(booking.calendarEventId);
    }
  }

  const upcoming = bookings.filter((b) => b.status !== "cancelled");

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Записи клиентов</Text>
      <Text style={styles.subheader}>
        {loading
          ? "Загрузка..."
          : upcoming.length === 0
          ? "Пока нет записей"
          : `Активных записей: ${upcoming.length}`}
      </Text>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <BookingListItem
            booking={item}
            onConfirm={() => handleConfirm(item)}
            onCancel={() => handleCancel(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  header: { color: colors.textPrimary, fontSize: 24, fontWeight: "700" },
  subheader: { color: colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 16 },
  list: { paddingBottom: 32 },
});
