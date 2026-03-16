import { useEffect, useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';

export default function GuideLayout() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && !session) router.replace('/auth/login');
  }, [session, loading, router]);

  useEffect(() => {
    async function fetchUnread() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      setUnreadCount(count ?? 0);
    }
    fetchUnread();

    const channel = supabase
      .channel('notifications_badge')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => fetchUnread()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const HeaderRight = () => (
    <TouchableOpacity
      onPress={() => router.push('/(guide)/notifications')}
      style={{ marginRight: 16, position: 'relative' }}>
      <Ionicons name="notifications-outline" size={24} color="white" />
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: Colors.mint,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: Colors.primary,
          }}>
          <Text
            style={{
              fontSize: 9,
              fontWeight: '900',
              color: Colors.primary,
            }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const screenOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: Colors.primary },
    headerTintColor: 'white',
    headerTitleStyle: { fontWeight: '900' as const, fontSize: 17 },
    headerTitleAlign: 'left' as const,
    headerRight: () => <HeaderRight />,
    tabBarActiveTintColor: Colors.mint,
    tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
    tabBarStyle: {
      backgroundColor: Colors.primary,
      borderTopColor: 'rgba(255,255,255,0.1)',
      paddingBottom: 8,
      height: 62,
    },
    tabBarLabelStyle: { fontWeight: '700' as const, fontSize: 11 },
  };

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="community/index"
        options={{
          title: 'Community',
          tabBarLabel: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings/index"
        options={{
          title: 'My Bookings',
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="treks/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

