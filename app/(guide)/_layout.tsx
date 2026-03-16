import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/AuthContext';
import { Colors } from '@/lib/colors';

export default function GuideLayout() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace('/auth/login');
  }, [session, loading, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '900', fontSize: 18 },
        headerRight: () =>
          profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                marginRight: 16,
                borderWidth: 2,
                borderColor: Colors.mint,
              }}
            />
          ) : (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                marginRight: 16,
                backgroundColor: Colors.mint,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text style={{ fontSize: 13, fontWeight: '900', color: Colors.primary }}>
                {profile?.full_name?.charAt(0) ?? 'G'}
              </Text>
            </View>
          ),
        tabBarActiveTintColor: Colors.mint,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor: Colors.primary,
          borderTopColor: 'rgba(255,255,255,0.1)',
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}>
      <Tabs.Screen
        name="bookings/index"
        options={{
          title: 'My Bookings',
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="treks/index"
        options={{
          title: 'Treks',
          tabBarLabel: 'Treks',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

