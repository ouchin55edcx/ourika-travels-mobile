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
  const [newBookingAlert, setNewBookingAlert] = useState<{
    title: string;
    ref: string;
    id: string;
  } | null>(null);

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

  useEffect(() => {
    let guideId: string | null = null;
    let dismissTimer: ReturnType<typeof setTimeout> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      guideId = user.id;

      const channel = supabase
        .channel('guide_bookings_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `guide_id=eq.${guideId}`,
          },
          async (payload) => {
            const booking = payload.new as any;
            if (
              payload.eventType === 'UPDATE' &&
              booking.guide_id === guideId &&
              booking.guide_assigned_at
            ) {
              const { data: trek } = await supabase
                .from('treks')
                .select('title')
                .eq('id', booking.trek_id)
                .single();

              setNewBookingAlert({
                title: trek?.title ?? 'New trek',
                ref: booking.booking_ref ?? '',
                id: String(booking.id),
              });

              if (dismissTimer) clearTimeout(dismissTimer);
              dismissTimer = setTimeout(() => setNewBookingAlert(null), 8000);

              fetchBookings();
            }
          }
        )
        .subscribe();

      return () => {
        if (dismissTimer) clearTimeout(dismissTimer);
        supabase.removeChannel(channel);
      };
    });

    return () => {
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [fetchBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const empty = useMemo(() => !loading && bookings.length === 0, [loading, bookings.length]);

  return (
    <View style={styles.container}>
      {newBookingAlert && (
        <TouchableOpacity
          onPress={() => {
            const alert = newBookingAlert;
            setNewBookingAlert(null);
            router.push({
              pathname: '/(guide)/bookings/[id]',
              params: { id: alert.id, title: alert.title },
            });
          }}
          style={styles.notificationBanner}
          activeOpacity={0.9}>
          <View style={styles.notificationIcon}>
            <Ionicons name="notifications" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationTitle}>New booking assigned! 🎉</Text>
            <Text style={styles.notificationBody} numberOfLines={1}>
              {newBookingAlert.title} · {newBookingAlert.ref}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setNewBookingAlert(null)} style={{ padding: 4 }}>
            <Ionicons name="close" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : empty ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: 'rgba(11,58,44,0.06)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
            <Ionicons name="calendar-outline" size={36} color={Colors.primary} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '900',
              color: Colors.primary,
              marginBottom: 8,
            }}>
            No bookings yet
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: Colors.textLight,
              textAlign: 'center',
              lineHeight: 22,
            }}>
            The admin will assign bookings to you. You'll be notified instantly.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const date = formatDate(item.trek_date);
            const time = item.trek_time ?? '—';
            const statusStyle = badgeStyleForStatus(item.status);
            const payStyle = badgeStyleForPayment(item.payment_status);

            const phone = (item.tourist_phone ?? '').replace(/\D/g, '');
            const msg = encodeURIComponent(
              `Hi ${item.tourist_name ?? ''}! I'm your guide for "${
                item.treks?.title ?? 'your trek'
              }" on ${date} at ${time}. Meet at ${item.treks?.start_location ?? 'Setti Fatma'}! 🏔`
            );

            const handleWhatsApp = () => {
              if (!phone) return;
              Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
            };

            const titleForHeader = item.treks?.title ?? item.booking_ref ?? 'Booking';

            return (
              <TouchableOpacity
                style={cardStyles.card}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: '/(guide)/bookings/[id]',
                    params: { id: String(item.id), title: titleForHeader },
                  })
                }>
                {item.treks?.cover_image ? (
                  <Image source={{ uri: item.treks.cover_image }} style={cardStyles.image} />
                ) : (
                  <View style={[cardStyles.image, { backgroundColor: '#e5e7eb' }]} />
                )}

                <View style={cardStyles.content}>
                  <Text style={cardStyles.trekTitle} numberOfLines={2}>
                    {item.treks?.title ?? 'Trek'}
                  </Text>

                  <View style={cardStyles.metaRow}>
                    <View style={cardStyles.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color={Colors.textLight} />
                      <Text style={cardStyles.metaText}>{date}</Text>
                    </View>
                    <View style={cardStyles.metaDot} />
                    <View style={cardStyles.metaItem}>
                      <Ionicons name="time-outline" size={13} color={Colors.textLight} />
                      <Text style={cardStyles.metaText}>{time}</Text>
                    </View>
                  </View>

                  <View style={cardStyles.touristRow}>
                    <View style={cardStyles.touristAvatar}>
                      <Text style={cardStyles.touristInitial}>
                        {item.tourist_name?.charAt(0) ?? '?'}
                      </Text>
                    </View>
                    <Text style={cardStyles.touristName} numberOfLines={1}>
                      {item.tourist_name}
                    </Text>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleWhatsApp();
                      }}
                      style={cardStyles.waBtn}
                      activeOpacity={0.9}>
                      <Ionicons name="logo-whatsapp" size={14} color="white" />
                      <Text style={cardStyles.waBtnText}>Chat</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={cardStyles.badgesRow}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                      ]}>
                      <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                        {(item.status ?? 'pending').toString().toUpperCase()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: payStyle.bg, borderColor: payStyle.border },
                      ]}>
                      <Text style={[styles.badgeText, { color: payStyle.text }]}>
                        {(item.payment_status ?? 'unpaid').toString().toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.textLight}
                  style={{ alignSelf: 'center', marginRight: 10 }}
                />
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
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.mint,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  notificationBody: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    opacity: 0.7,
    marginTop: 2,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  image: {
    width: 90,
    height: '100%',
    minHeight: 110,
  },
  content: { flex: 1, padding: 14, gap: 6 },
  trekTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 20,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textLight, fontWeight: '500' },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textLight,
  },
  touristRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  touristAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touristInitial: { color: 'white', fontSize: 10, fontWeight: '900' },
  touristName: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.text },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  waBtnText: { color: 'white', fontSize: 11, fontWeight: '700' },
  badgesRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
});

