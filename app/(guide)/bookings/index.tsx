import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';

type TrekLite = {
  id: string;
  title: string | null;
  cover_image: string | null;
  duration: string | number | null;
  start_location: string | null;
};

type Booking = {
  id: string;
  booking_ref?: string | null;
  trek_date?: string | null;
  trek_time?: string | null;
  status?: string | null;
  payment_status?: string | null;
  tourist_name?: string | null;
  tourist_phone?: string | null;
  treks?: TrekLite | null;
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function badgeStyleForStatus(status?: string | null) {
  const s = (status ?? '').toLowerCase();
  if (s === 'confirmed') return { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' };
  if (s === 'completed') return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' };
  return { bg: '#fffbeb', border: '#fde68a', text: '#92400e' };
}

function badgeStyleForPayment(status?: string | null) {
  const s = (status ?? '').toLowerCase();
  if (s === 'paid') return { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' };
  return { bg: '#f3f4f6', border: '#e5e7eb', text: '#374151' };
}

export default function BookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBookings([]);
      return;
    }

    const { data } = await supabase
      .from('bookings')
      .select('*, treks(id, title, cover_image, duration, start_location)')
      .eq('guide_id', user.id)
      .neq('status', 'cancelled')
      .order('trek_date', { ascending: true });

    setBookings((data as Booking[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchBookings();
      setLoading(false);
    })();
  }, [fetchBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const empty = useMemo(() => !loading && bookings.length === 0, [loading, bookings.length]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {empty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No bookings assigned yet</Text>
          <Text style={styles.emptySub}>When you get assigned a booking, it will show up here.</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const date = formatDate(item.trek_date);
            const time = item.trek_time ?? '—';
            const statusStyle = badgeStyleForStatus(item.status);
            const payStyle = badgeStyleForPayment(item.payment_status);

            const phone = (item.tourist_phone ?? '').replace(/\D/g, '');
            const msg = encodeURIComponent(
              `Hi ${item.tourist_name ?? ''}! I'm your guide for "${item.treks?.title ?? 'your trek'}" on ${date} at ${time}. ` +
                `Meet at ${item.treks?.start_location ?? 'Setti Fatma'}! 🏔`
            );

            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/(guide)/bookings/[id]', params: { id: String(item.id) } })}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {item.treks?.cover_image ? (
                    <Image source={{ uri: item.treks.cover_image }} style={styles.cover} />
                  ) : (
                    <View style={[styles.cover, styles.coverFallback]}>
                      <Ionicons name="image-outline" size={18} color={Colors.textLight} />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={styles.title}>
                      {item.treks?.title ?? 'Trek'}
                    </Text>

                    <View style={styles.row}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.textLight} />
                      <Text style={styles.rowText}>
                        {date} · {time}
                      </Text>
                    </View>

                    <View style={[styles.row, { justifyContent: 'space-between' }]}>
                      <Text style={styles.touristText} numberOfLines={1}>
                        {item.tourist_name ?? 'Tourist'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (!phone) return;
                          Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
                        }}
                        activeOpacity={0.8}
                        style={styles.waBtn}>
                        <Ionicons name="logo-whatsapp" size={16} color="white" />
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <View style={[styles.badge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                        <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                          {(item.status ?? 'pending').toString().toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: payStyle.bg, borderColor: payStyle.border }]}>
                        <Text style={[styles.badgeText, { color: payStyle.text }]}>
                          {(item.payment_status ?? 'unpaid').toString().toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  cover: { width: 72, height: 56, borderRadius: 14, backgroundColor: '#f3f4f6' },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '900', color: Colors.text, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  rowText: { fontSize: 12.5, color: Colors.textLight, fontWeight: '600' },
  touristText: { fontSize: 13, color: Colors.text, fontWeight: '700', flex: 1, paddingRight: 10 },
  waBtn: { backgroundColor: '#22c55e', width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#e7f8f1', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: Colors.textLight, fontWeight: '600', textAlign: 'center', lineHeight: 18, maxWidth: 300 },
});

