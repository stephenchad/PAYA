import { Redirect } from 'expo-router';
import { useAuth } from '../store/auth.store';

export default function Index() {
  const { token } = useAuth();
  return <Redirect href={token ? '/(app)/home' : '/(auth)/welcome'} />;
}