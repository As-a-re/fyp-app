import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import BottomNav from "../components/BottomNav";
import TopBar from "../components/TopBar";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function RootLayoutContent() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Hide bottom nav on login, register, index, and chat pages
  const hideBottomNav =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/index" ||
    pathname === "/" ||
    pathname === "/chat-doctor" ||
    !isAuthenticated;

  // Hide top bar on login, register, index, chat, and unauthenticated pages
  const hideTopBar =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/index" ||
    pathname === "/" ||
    pathname === "/chat-doctor" ||
    !isAuthenticated;

  return (
    <>
      <StatusBar style="auto" />
      <View style={{ flex: 1 }}>
        {!hideTopBar && <TopBar />}
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen
            name="health-monitoring"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="risk-assessment"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ai-assistant" options={{ headerShown: false }} />
          <Stack.Screen name="messages" options={{ headerShown: false }} />
          <Stack.Screen
            name="symptom-checker"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="pregnancy-profile"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="patients" options={{ headerShown: false }} />
          <Stack.Screen name="symptom-reviews" options={{ headerShown: false }} />
          <Stack.Screen name="emergency" options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
          <Stack.Screen
            name="change-password"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen
            name="privacy-security"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="appointments" options={{ headerShown: false }} />
          <Stack.Screen
            name="vaccination-records"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="nutrition-diet"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="exercise-fitness"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="mental-health-wellness"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="test-results" options={{ headerShown: false }} />
          <Stack.Screen
            name="browse-doctors"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="chat-doctor" options={{ headerShown: false }} />
        </Stack>
        {!hideBottomNav && <BottomNav />}
      </View>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
