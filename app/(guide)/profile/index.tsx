import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';
import { Colors } from '@/lib/colors';

function Pill({ text, variant }: { text: string; variant: 'mint' | 'gray' }) {
  const mint = variant === 'mint';
  return (
    <View style={mint ? styles.pillMint : styles.pillGray}>
      <Text style={mint ? styles.pillMintText : styles.pillGrayText}>{text}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const initials = (profile?.full_name ?? 'Guide')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x.charAt(0).toUpperCase())
    .join('');

  const isVerified = !!profile?.is_verified;
  const status = (profile?.verification_status ?? '').toLowerCase();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: Colors.primary }}>{initials || 'G'}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.full_name ?? 'Guide'}</Text>
            {!!profile?.location && <Text style={styles.location}>{profile.location}</Text>}
          </View>
        </View>

        {isVerified ? (
          <View style={[styles.verifyBanner, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
            <Text style={[styles.verifyText, { color: '#065f46' }]}>Ourika Travels Verified</Text>
          </View>
        ) : status === 'pending' ? (
          <View style={[styles.verifyBanner, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
            <Ionicons name="time-outline" size={18} color={Colors.warning} />
            <Text style={[styles.verifyText, { color: '#92400e' }]}>Verification pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => Linking.openURL('https://ourikatravels.com/dashboard/guide/profile')}
            style={[styles.verifyBanner, { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }]}>
            <Ionicons name="shield-outline" size={18} color={Colors.textLight} />
            <Text style={[styles.verifyText, { color: Colors.textLight }]}>
              Complete profile on website
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
        <View style={styles.statsRow}>
          <StatBox label="Languages" value={String(profile?.languages?.length ?? 0)} />
          <StatBox label="Specialties" value={String(profile?.specialties?.length ?? 0)} />
          <StatBox
            label="Years exp."
            value={profile?.years_experience != null ? String(profile.years_experience) : '—'}
          />
        </View>

        {!!profile?.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About you</Text>
            <Text style={styles.bodyText}>{profile.bio}</Text>
          </View>
        )}

        {!!profile?.languages?.length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.pillWrap}>
              {profile.languages.map((l) => (
                <Pill key={l} text={l} variant="mint" />
              ))}
            </View>
          </View>
        )}

        {!!profile?.specialties?.length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.pillWrap}>
              {profile.specialties.map((s) => (
                <Pill key={s} text={s} variant="gray" />
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.linkBtn}
          activeOpacity={0.85}
          onPress={() => Linking.openURL('https://ourikatravels.com/dashboard/guide/profile')}>
          <Ionicons name="open-outline" size={18} color={Colors.primary} />
          <Text style={styles.linkBtnText}>Edit profile on website</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutBtn}
          activeOpacity={0.85}
          onPress={async () => {
            await signOut();
            router.replace('/auth/login');
          }}>
          <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e5e7eb' },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '900', color: 'white', letterSpacing: -0.2 },
  location: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  verifyBanner: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyText: { fontSize: 13, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '900', color: Colors.text },
  statLabel: { fontSize: 12, fontWeight: '800', color: Colors.textLight, marginTop: 4 },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: Colors.text, marginBottom: 10 },
  bodyText: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pillMint: {
    backgroundColor: '#e7f8f1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#baf3db',
  },
  pillMintText: { fontSize: 12.5, fontWeight: '900', color: Colors.primary },
  pillGray: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pillGrayText: { fontSize: 12.5, fontWeight: '900', color: Colors.text },
  linkBtn: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
    marginBottom: 12,
  },
  linkBtnText: { color: Colors.primary, fontWeight: '900', fontSize: 15 },
  signOutBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'white',
  },
  signOutText: { color: Colors.danger, fontWeight: '900', fontSize: 15 },
});

