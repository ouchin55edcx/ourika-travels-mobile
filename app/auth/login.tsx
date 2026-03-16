import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin() {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single();
      if (profile?.role !== 'guide') {
        await supabase.auth.signOut();
        setError('This app is for guides only. Please use the website.');
        setLoading(false);
        return;
        }
      }

      // After successful login, extend session
      await supabase.auth.refreshSession();

      setLoading(false);
      router.replace('/(guide)/bookings');
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    const redirectUrl = makeRedirectUri({ scheme: 'ourikatravels' });

    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type === 'success') {
        const url = result.url;
        const hash = url.split('#')[1] ?? '';
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          router.replace('/(guide)/bookings');
        }
      }
    }

    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.primary }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View style={styles.topPanel}>
          <View style={styles.bgCircle1} />
          <View style={styles.bgCircle2} />
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>OT</Text>
          </View>
          <Text style={styles.appTitle}>Ourika Travels</Text>
          <Text style={styles.appSubtitle}>Guide Portal</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to view your bookings</Text>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Your password"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={{ padding: 4 }}>
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
            onPress={handleEmailLogin}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>Sign in</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.8}>
            <Ionicons name="logo-google" size={18} color={Colors.primary} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://ourikatravels.com/register/guide')}
            style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={styles.registerText}>
              Not a guide yet?{' '}
              <Text style={{ color: Colors.primary, fontWeight: '700' }}>Register on our website</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topPanel: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0,239,157,0.08)',
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0,239,157,0.05)',
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: { fontSize: 26, fontWeight: '900', color: Colors.primary },
  appTitle: { fontSize: 22, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  appSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 32,
    minHeight: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: Colors.textLight, marginBottom: 24 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: Colors.danger, flex: 1, fontWeight: '500' },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: '#f9fafb',
    height: 56,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    height: 56,
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 100,
    paddingVertical: 14,
    backgroundColor: 'white',
  },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  registerText: {
    fontSize: 13,
    color: Colors.mint,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

