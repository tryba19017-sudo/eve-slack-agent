import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/theme/colors";
import type { Booking } from "@/types/booking";

interface Props {
  booking: Booking;
  onConfirm: () => void;
  onCancel: () => void;
}

const STATUS_LABEL: Record<Booking["status"], string> = {
  pending: "Ожидает подтверждения",
  confirmed: "Подтверждено",
  cancelled: "Отменено",
};

const STATUS_COLOR: Record<Booking["status"], string> = {
  pending: "#F2C94C",
  confirmed: colors.success,
  cancelled: colors.danger,
};

export default function BookingListItem({ booking, onConfirm, onCancel }: Props) {
  const date = new Date(booking.startsAt);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{booking.clientName}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[booking.status] }]}>
          <Text style={styles.badgeText}>{STATUS_LABEL[booking.status]}</Text>
        </View>
      </View>

      <Text style={styles.meta}>
        {date.toLocaleString("ru-RU", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        · {booking.durationMinutes} мин
      </Text>
      <Text style={styles.meta}>{booking.clientPhone}</Text>
      {booking.notes ? <Text style={styles.notes}>{booking.notes}</Text> : null}

      {booking.status !== "cancelled" && (
        <View style={styles.actionsRow}>
          {booking.status === "pending" && (
            <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={onConfirm}>
              <Text style={styles.actionButtonText}>Подтвердить</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onCancel}>
            <Text style={styles.actionButtonText}>Отменить</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { color: colors.textPrimary, fontSize: 17, fontWeight: "700" },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: "#0F1115", fontSize: 11, fontWeight: "700" },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  notes: { color: colors.textPrimary, fontSize: 14, marginTop: 8, fontStyle: "italic" },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  confirmButton: { backgroundColor: colors.success },
  cancelButton: { backgroundColor: colors.danger },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
