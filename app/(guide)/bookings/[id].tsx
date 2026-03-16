import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';

type Trek = {
  id: string;
  title: string | null;
  cover_image: string | null;
  duration: string | number | null;
  start_location: string | null;
  price_per_adult?: number | null;
  price_per_child?: number | null;
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
  tourist_email?: string | null;
  adults?: number | null;
  children?: number | null;
  total_price?: number | null;
  special_requests?: string | null;
  treks?: Trek | null;
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
}

function badgeStyle(kind: 'status' | 'payment', value?: string | null) {
  const v = (value ?? '').toLowerCase();
  if (kind === 'payment') {
    if (v === 'paid') return { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' };
    return { bg: '#f3f4f6', border: '#e5e7eb', text: '#374151' };
  }
  if (v === 'confirmed') return { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' };
  if (v === 'completed') return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' };
  return { bg: '#fffbeb', border: '#fde68a', text: '#92400e' };
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      const { data } = await supabase.from('bookings').select('*, treks(*)').eq('id', id).single();
      setBooking((data as Booking) ?? null);
      setLoading(false);
    })();
  }, [id]);

  const date = useMemo(() => formatDate(booking?.trek_date), [booking?.trek_date]);
  const time = booking?.trek_time ?? '—';
  const meet = booking?.treks?.start_location ?? 'Setti Fatma';

  const phone = (booking?.tourist_phone ?? '').replace(/\D/g, '');
  const waMsg = encodeURIComponent(
    `Hi ${booking?.tourist_name ?? ''}! Booking ${booking?.booking_ref ?? ''} — "${booking?.treks?.title ?? 'your trek'}" on ${date} at ${time}. ` +
      `Meeting point: ${meet}. 🏔`
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={{ fontWeight: '800', color: Colors.text }}>Booking not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: Colors.primary, fontWeight: '800' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = badgeStyle('status', booking.status);
  const payment = badgeStyle('payment', booking.payment_status);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        {booking.treks?.cover_image ? (
          <Image source={{ uri: booking.treks.cover_image }} style={styles.headerImage} />
        ) : (
          <View style={[styles.headerImage, { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="image-outline" size={28} color={Colors.textLight} />
          </View>
        )}

        <View style={styles.headerOverlay} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {booking.treks?.title ?? 'Trek'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <View style={styles.statusRow}>
          <Text style={styles.refText}>{booking.booking_ref ?? `#${booking.id}`}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <View style={[styles.badge, { backgroundColor: status.bg, borderColor: status.border }]}>
              <Text style={[styles.badgeText, { color: status.text }]}>{(booking.status ?? 'pending').toUpperCase()}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: payment.bg, borderColor: payment.border }]}>
              <Text style={[styles.badgeText, { color: payment.text }]}>
                {(booking.payment_status ?? 'unpaid').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip details</Text>
          <InfoRow icon="calendar-outline" label="Date" value={date} />
          <InfoRow icon="time-outline" label="Time" value={time} />
          <InfoRow icon="walk-outline" label="Duration" value={String(booking.treks?.duration ?? '—')} />
          <InfoRow icon="location-outline" label="Start" value={meet} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tourists</Text>
          <InfoRow icon="person-outline" label="Name" value={booking.tourist_name ?? '—'} />
          <InfoRow icon="call-outline" label="Phone" value={booking.tourist_phone ?? '—'} />
          <InfoRow icon="mail-outline" label="Email" value={booking.tourist_email ?? '—'} />
          <InfoRow
            icon="people-outline"
            label="Group"
            value={`${booking.adults ?? 0} adults · ${booking.children ?? 0} children`}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing</Text>
          <InfoRow
            icon="pricetag-outline"
            label="Per adult"
            value={booking.treks?.price_per_adult != null ? String(booking.treks.price_per_adult) : '—'}
          />
          <InfoRow
            icon="pricetag-outline"
            label="Per child"
            value={booking.treks?.price_per_child != null ? String(booking.treks.price_per_child) : '—'}
          />
          <InfoRow
            icon="cash-outline"
            label="Total"
            value={booking.total_price != null ? String(booking.total_price) : '—'}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.waCta, !phone && { opacity: 0.5 }]}
          disabled={!phone}
          onPress={() => Linking.openURL(`https://wa.me/${phone}?text=${waMsg}`)}>
          <Ionicons name="logo-whatsapp" size={18} color="white" />
          <Text style={styles.waCtaText}>Contact tourist on WhatsApp</Text>
        </TouchableOpacity>

        {!!booking.special_requests && (
          <View style={[styles.section, { borderColor: '#fde68a', backgroundColor: '#fffbeb' }]}>
            <Text style={[styles.sectionTitle, { color: '#92400e' }]}>Special requests</Text>
            <Text style={{ color: '#92400e', fontWeight: '700', lineHeight: 18 }}>{booking.special_requests}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        <Ionicons name={icon} size={16} color={Colors.textLight} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: 16 },
  header: { height: 200, backgroundColor: '#111827' },
  headerImage: { width: '100%', height: '100%' },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { position: 'absolute', left: 16, right: 16, bottom: 14 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: -0.2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 },
  refText: { fontSize: 13, fontWeight: '900', color: Colors.text, letterSpacing: 0.2 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: Colors.text, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  infoLabel: { fontSize: 12.5, color: Colors.textLight, fontWeight: '800' },
  infoValue: { flex: 1, textAlign: 'right', fontSize: 12.5, color: Colors.text, fontWeight: '800' },
  waCta: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 14,
  },
  waCtaText: { color: 'white', fontWeight: '900', fontSize: 15 },
});

