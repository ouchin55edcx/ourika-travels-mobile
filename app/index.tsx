import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useAuth } from '@/lib/AuthContext';
import { Colors } from '@/lib/colors';

const { width } = Dimensions.get('window');

export default function Index() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dotAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(dotAnim1, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dotAnim2, { toValue: 0.3, duration: 200, useNativeDriver: true }),
          Animated.timing(dotAnim3, { toValue: 0.3, duration: 200, useNativeDriver: true }),
        ]),
      ]).start(() => animateDots());
    };
    animateDots();
  }, [fadeAnim, slideAnim, dotAnim1, dotAnim2, dotAnim3]);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (!session || profile?.role !== 'guide') {
        router.replace('/auth/login');
      } else {
        router.replace('/(guide)/bookings');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [session, profile, loading, router]);

  return (
    <View style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>OT</Text>
          </View>
        </View>

        <Text style={styles.brandName}>Ourika Travels</Text>
        <Text style={styles.brandTagline}>Authentic Atlas Mountain Experiences</Text>

        <View style={styles.guideBadge}>
          <Text style={styles.guideBadgeText}>🧭 Guide Portal</Text>
        </View>

        <View style={styles.dotsRow}>
          {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
          ))}
        </View>
      </Animated.View>

      <View style={styles.bottomText}>
        <Text style={styles.bottomLabel}>Setti Fatma · Ourika Valley · Morocco</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0,239,157,0.06)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0,239,157,0.04)',
  },
  content: { alignItems: 'center', paddingHorizontal: 40 },
  logoWrapper: { marginBottom: 24 },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.mint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: { fontSize: 32, fontWeight: '900', color: Colors.primary },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  brandTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  guideBadge: {
    backgroundColor: 'rgba(0,239,157,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0,239,157,0.3)',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 40,
  },
  guideBadgeText: { color: Colors.mint, fontSize: 13, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mint,
  },
  bottomText: { position: 'absolute', bottom: 40 },
  bottomLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

