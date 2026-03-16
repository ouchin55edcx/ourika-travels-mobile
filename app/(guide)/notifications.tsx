import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  data: any;
};

function notifIcon(type: string): any {
  const map: Record<string, any> = {
    booking_assigned: 'calendar',
    booking_status: 'checkmark-circle',
    verification: 'shield-checkmark',
    announcement: 'megaphone',
    review: 'star',
  };
  return map[type] ?? 'notifications';
}

function notifColor(type: string): string {
  const map: Record<string, string> = {
    booking_assigned: Colors.mint,
    verification: Colors.mint,
    booking_status: '#60a5fa',
    announcement: '#f59e0b',
    review: '#f59e0b',
  };
  return map[type] ?? Colors.primary;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifs((data as Notif[]) ?? []);
      setLoading(false);

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
          <Ionicons name="chevron-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 8 }}
          ListEmptyComponent={
            <View style={S.empty}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color={Colors.border}
              />
              <Text style={S.emptyText}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[S.card, !item.read && S.cardUnread]}
              onPress={() => {
                if (item.data?.booking_id) {
                  router.push({
                    pathname: '/(guide)/bookings/[id]',
                    params: {
                      id: item.data.booking_id,
                      title: item.data.trek_title ?? 'Booking',
                    },
                  });
                }
              }}
              activeOpacity={0.8}>
              <View
                style={[
                  S.iconBox,
                  {
                    backgroundColor: notifColor(item.type) + '22',
                  },
                ]}>
                <Ionicons
                  name={notifIcon(item.type)}
                  size={20}
                  color={notifColor(item.type)}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={S.notifTitle}>{item.title}</Text>
                <Text style={S.notifBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={S.notifTime}>
                  {new Date(item.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {!item.read && <View style={S.unreadDot} />}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const S = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.textLight, fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardUnread: {
    borderColor: Colors.mint + '60',
    backgroundColor: '#f0fdf9',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notifTitle: { fontSize: 14, fontWeight: '800', color: Colors.text },
  notifBody: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '600',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mint,
    alignSelf: 'center',
    flexShrink: 0,
  },
});

