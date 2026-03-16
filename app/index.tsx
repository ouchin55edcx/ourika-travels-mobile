import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '@/lib/AuthContext';
import { Colors } from '@/lib/colors';

export default function Index() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/auth/login');
    } else if (profile?.role !== 'guide') {
      router.replace('/auth/login');
    } else {
      router.replace('/(guide)/bookings');
    }
  }, [session, profile, loading, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary,
      }}>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: Colors.mint,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.primary }}>OT</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '900', color: 'white', letterSpacing: -0.5 }}>
          Ourika Travels
        </Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
          Guide App
        </Text>
        <ActivityIndicator color={Colors.mint} style={{ marginTop: 20 }} />
      </View>
    </View>
  );
}

