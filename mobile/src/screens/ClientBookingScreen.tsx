import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "@/theme/colors";
import { createBooking, attachCalendarEventId } from "@/services/bookingService";
import { addBookingToCalendar } from "@/services/calendarService";

const DURATION_OPTIONS = [30, 45, 60, 90];

export default function ClientBookingScreen() {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  });
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = clientName.trim().length > 0 && clientPhone.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const bookingId = await createBooking({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        notes: notes.trim(),
        startsAt: date.getTime(),
        durationMinutes,
      });

      try {
        const eventId = await addBookingToCalendar({
          title: `Тренировка с тренером — ${clientName.trim()}`,
          notes: notes.trim() || undefined,
          startsAt: date.getTime(),
          durationMinutes,
        });
        await attachCalendarEventId(bookingId, eventId);
      } catch (calendarError) {
        Alert.alert(
          "Запись сохранена",
          "Но не удалось добавить событие в календарь телефона: " +
            (calendarError as Error).message +
            ". Разрешите доступ к календарю в настройках, чтобы это заработало."
        );
        return;
      }

      Alert.alert(
        "Готово!",
        "Вы записаны на тренировку. Тренер уже видит вашу запись, а событие добавлено в календарь вашего телефона."
      );
      setClientName("");
      setClientPhone("");
      setNotes("");
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось создать запись: " + (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Ваше имя</Text>
        <TextInput
          style={styles.input}
          value={clientName}
          onChangeText={setClientName}
          placeholder="Иван Иванов"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Телефон</Text>
        <TextInput
          style={styles.input}
          value={clientPhone}
          onChangeText={setClientPhone}
          placeholder="+7 900 000-00-00"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Дата и время</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateText}>
            {date.toLocaleString("ru-RU", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            minimumDate={new Date()}
            onChange={(_, selected) => {
              setShowPicker(Platform.OS === "ios");
              if (selected) setDate(selected);
            }}
          />
        )}

        <Text style={styles.label}>Длительность</Text>
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.durationChip,
                option === durationMinutes && styles.durationChipActive,
              ]}
              onPress={() => setDurationMinutes(option)}
            >
              <Text
                style={[
                  styles.durationChipText,
                  option === durationMinutes && styles.durationChipTextActive,
                ]}
              >
                {option} мин
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Комментарий (необязательно)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Например: болит колено, хочу упор на верх тела"
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? "Записываем..." : "Записаться на тренировку"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 48 },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 16,
  },
  dateText: { color: colors.textPrimary, fontSize: 16 },
  notesInput: { minHeight: 80, textAlignVertical: "top" },
  durationRow: { flexDirection: "row", gap: 8 },
  durationChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  durationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationChipText: { color: colors.textSecondary, fontSize: 14 },
  durationChipTextActive: { color: colors.textPrimary, fontWeight: "600" },
  submitButton: {
    marginTop: 32,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
