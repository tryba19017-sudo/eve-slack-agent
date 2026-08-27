import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoleSelectScreen from "@/screens/RoleSelectScreen";
import ClientBookingScreen from "@/screens/ClientBookingScreen";
import TrainerDashboardScreen from "@/screens/TrainerDashboardScreen";
import { colors } from "@/theme/colors";

export type RootStackParamList = {
  RoleSelect: undefined;
  ClientBooking: undefined;
  TrainerDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator>
        <Stack.Screen
          name="RoleSelect"
          component={RoleSelectScreen}
          options={{ title: "FitTrainer" }}
        />
        <Stack.Screen
          name="ClientBooking"
          component={ClientBookingScreen}
          options={{ title: "Запись на тренировку" }}
        />
        <Stack.Screen
          name="TrainerDashboard"
          component={TrainerDashboardScreen}
          options={{ title: "Кабинет тренера" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
