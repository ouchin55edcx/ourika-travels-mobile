import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { randomUUID } from '@/lib/uuid';
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
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [showQr, setShowQr] = useState<string | null>(null);
  const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? 'http://localhost:3000';

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      const { data } = await supabase.from('bookings').select('*, treks(*)').eq('id', id).single();
      setBooking((data as Booking) ?? null);

      const { data: qrs } = await supabase
        .from('review_qr_codes')
        .select('*')
        .eq('booking_id', id)
        .order('created_at', { ascending: false });
      setQrCodes(qrs ?? []);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (title) {
      navigation.setOptions({ title: String(title) });
    }
  }, [title, navigation]);

  const date = useMemo(() => formatDate(booking?.trek_date), [booking?.trek_date]);
  const time = booking?.trek_time ?? '—';
  const meet = booking?.treks?.start_location ?? 'Setti Fatma';

  const phone = (booking?.tourist_phone ?? '').replace(/\D/g, '');
  const waMsg = encodeURIComponent(
    `Hi ${booking?.tourist_name ?? ''}! Booking ${booking?.booking_ref ?? ''} — "${booking?.treks?.title ?? 'your trek'}" on ${date} at ${time}. ` +
      `Meeting point: ${meet}. 🏔`
  );

  async function generateQrCode() {
    if (!booking?.id || !(booking as any).trek_id) return;
    if (qrCodes.length >= 3) {
      Alert.alert('Limit reached', 'Maximum 3 QR codes per booking.');
      return;
    }
    setGeneratingQr(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setGeneratingQr(false);
      return;
    }

    const token = randomUUID().replace(/-/g, '');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('review_qr_codes')
      .insert({
        booking_id: booking.id,
        guide_id: user.id,
        trek_id: (booking as any).trek_id,
        token,
        expires_at: expires.toISOString(),
      })
      .select()
      .single();

    if (!error && data) {
      setQrCodes((prev) => [data, ...prev]);
      setShowQr(`${APP_URL}/review/${token}`);
    }
    setGeneratingQr(false);
  }

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
          <Image
            source={{ uri: booking.treks.cover_image }}
            style={{ width: '100%', height: 200 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: 200,
              backgroundColor: '#e5e7eb',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
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

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View style={styles.statusRow}>
            <Text style={styles.refText}>{booking.booking_ref ?? `#${booking.id}`}</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <View style={[styles.badge, { backgroundColor: status.bg, borderColor: status.border }]}>
                <Text style={[styles.badgeText, { color: status.text }]}>
                  {(booking.status ?? 'pending').toUpperCase()}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: payment.bg, borderColor: payment.border }]}>
                <Text style={[styles.badgeText, { color: payment.text }]}>
                  {(booking.payment_status ?? 'unpaid').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <InfoRow icon="calendar-outline" label="Date" value={date} />
          <InfoRow icon="time-outline" label="Time" value={time} />
          <InfoRow icon="hourglass-outline" label="Duration" value={String(booking.treks?.duration ?? '—')} />
          <InfoRow icon="location-outline" label="Meeting point" value={meet} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Tourist</Text>
          <View style={styles.touristHeaderRow}>
            <View style={styles.touristAvatar}>
              <Text style={styles.touristInitial}>
                {booking.tourist_name?.trim().charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.touristName}>{booking.tourist_name ?? '—'}</Text>
              <Text style={styles.touristMeta}>{booking.tourist_email ?? booking.tourist_phone ?? '—'}</Text>
            </View>
          </View>
          <InfoRow icon="call-outline" label="Phone" value={booking.tourist_phone ?? '—'} />
          <InfoRow icon="mail-outline" label="Email" value={booking.tourist_email ?? '—'} />
          <InfoRow
            icon="people-outline"
            label="Group size"
            value={`${booking.adults ?? 0} adults · ${booking.children ?? 0} children`}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.waCta, !phone && { opacity: 0.5 }]}
            disabled={!phone}
            onPress={() => Linking.openURL(`https://wa.me/${phone}?text=${waMsg}`)}>
            <Ionicons name="logo-whatsapp" size={18} color="white" />
            <Text style={styles.waCtaText}>Contact tourist on WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { marginTop: 4 }]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="qr-code-outline" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Review QR Codes</Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: Colors.textLight,
                fontWeight: '700',
              }}>
              {qrCodes.length}/3 used
            </Text>
          </View>

          <Text
            style={{
              fontSize: 12,
              color: Colors.textLight,
              fontWeight: '500',
              lineHeight: 17,
              marginBottom: 12,
            }}>
            Give tourist a QR code to leave a review. Max 3 per booking. Expires in 7 days.
          </Text>

          {qrCodes.map((qr, i) => (
            <TouchableOpacity
              key={qr.id}
              onPress={() => !qr.used && setShowQr(`${APP_URL}/review/${qr.token}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                borderRadius: 12,
                marginBottom: 6,
                backgroundColor: qr.used ? '#f9fafb' : '#f0fdf4',
                borderWidth: 1,
                borderColor: qr.used ? Colors.border : '#a7f3d0',
                opacity: qr.used ? 0.6 : 1,
              }}>
              <Ionicons
                name={qr.used ? 'checkmark-circle' : 'qr-code-outline'}
                size={18}
                color={qr.used ? Colors.textLight : Colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: qr.used ? Colors.textLight : Colors.text,
                  }}>
                  QR #{i + 1} — {qr.used ? '✓ Used' : 'Active'}
                </Text>
                <Text style={{ fontSize: 11, color: Colors.textLight }}>
                  Expires{' '}
                  {new Date(qr.expires_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              {!qr.used && (
                <Ionicons name="chevron-forward" size={14} color={Colors.textLight} />
              )}
            </TouchableOpacity>
          ))}

          {qrCodes.length < 3 && (
            <TouchableOpacity
              onPress={generateQrCode}
              disabled={generatingQr}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: Colors.primary,
                borderRadius: 14,
                padding: 14,
                marginTop: 4,
                opacity: generatingQr ? 0.7 : 1,
              }}>
              {generatingQr ? (
                <ActivityIndicator size="small" color={Colors.mint} />
              ) : (
                <Ionicons name="add-circle-outline" size={18} color={Colors.mint} />
              )}
              <Text
                style={{
                  color: Colors.mint,
                  fontWeight: '900',
                  fontSize: 14,
                }}>
                {generatingQr ? 'Generating...' : 'Generate review QR'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Info</Text>
          <InfoRow icon="pricetag-outline" label="Reference" value={booking.booking_ref ?? `#${booking.id}`} />
          <InfoRow
            icon="person-outline"
            label="Type"
            value={(booking as any).booking_type ?? '—'}
          />
          <InfoRow
            icon="cash-outline"
            label="Total price"
            value={booking.total_price != null ? String(booking.total_price) : '—'}
          />
        </View>

        {!!booking.special_requests && (
          <View style={[styles.section, { borderColor: '#fde68a', backgroundColor: '#fffbeb', marginTop: 0 }]}>
            <Text style={[styles.sectionTitle, { color: '#92400e' }]}>Special requests</Text>
            <Text style={{ color: '#92400e', fontWeight: '700', lineHeight: 18 }}>
              ⚠️ {booking.special_requests}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!showQr}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQr(null)}>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 32,
          }}>
          <TouchableOpacity
            onPress={() => setShowQr(null)}
            style={{ position: 'absolute', top: 52, right: 24 }}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          <Text
            style={{
              color: 'white',
              fontSize: 20,
              fontWeight: '900',
              marginBottom: 6,
              textAlign: 'center',
            }}>
            Scan to leave a review
          </Text>
          <Text
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 13,
              marginBottom: 40,
              textAlign: 'center',
            }}>
            Show this QR to your tourist
          </Text>

          {showQr && (
            <View
              style={{
                padding: 20,
                backgroundColor: 'white',
                borderRadius: 24,
              }}>
              <QRCode value={showQr} size={220} color={Colors.primary} backgroundColor="white" />
            </View>
          )}

          <Text
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 11,
              marginTop: 24,
              textAlign: 'center',
            }}>
            One-time use · Expires in 7 days
          </Text>

          <View
            style={{
              marginTop: 32,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(0,239,157,0.15)',
              borderRadius: 100,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}>
            <Ionicons name="mountain-outline" size={16} color={Colors.mint} />
            <Text
              style={{
                color: Colors.mint,
                fontWeight: '700',
                fontSize: 13,
              }}>
              {booking?.treks?.title ?? 'Trek experience'}
            </Text>
          </View>
        </View>
      </Modal>
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
  header: { backgroundColor: '#111827' },
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
    padding: 16,
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
    marginTop: 14,
    marginBottom: 0,
  },
  waCtaText: { color: 'white', fontWeight: '900', fontSize: 15 },
  touristHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  touristAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touristInitial: { color: 'white', fontWeight: '900', fontSize: 16 },
  touristName: { fontSize: 15, fontWeight: '900', color: Colors.text },
  touristMeta: { fontSize: 12.5, fontWeight: '600', color: Colors.textLight },
});

