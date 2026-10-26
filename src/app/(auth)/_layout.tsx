/**
 * Layout for the signed-out screens. A simple stack without headers.
 */
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
