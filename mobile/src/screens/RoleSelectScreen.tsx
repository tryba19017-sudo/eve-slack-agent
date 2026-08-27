import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { colors } from "@/theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "RoleSelect">;

export default function RoleSelectScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FitTrainer</Text>
      <Text style={styles.subtitle}>
        Запись клиентов на тренировки с автосохранением в календарь
      </Text>

      <TouchableOpacity
        style={[styles.card, styles.clientCard]}
        onPress={() => navigation.navigate("ClientBooking")}
      >
        <Text style={styles.cardTitle}>Я клиент</Text>
        <Text style={styles.cardSubtitle}>Записаться на тренировку</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, styles.trainerCard]}
        onPress={() => navigation.navigate("TrainerDashboard")}
      >
        <Text style={styles.cardTitle}>Я тренер</Text>
        <Text style={styles.cardSubtitle}>Смотреть записи клиентов</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientCard: {
    backgroundColor: colors.surface,
  },
  trainerCard: {
    backgroundColor: colors.surface,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
