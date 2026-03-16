import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';

type Announcement = {
  id: string;
  title: string;
  body: string;
  created_at: string;
};

type LeaderGuide = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  review_count: number;
  avg_rating: number;
};

type Weather = {
  temperature: number;
  windspeed: number;
  weathercode: number;
} | null;

function weatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌦️';
  return '⛈️';
}

function weatherDesc(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snowy';
  return 'Stormy';
}

export default function CommunityScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [leaders, setLeaders] = useState<LeaderGuide[]>([]);
  const [weather, setWeather] = useState<Weather>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const { data: ann } = await supabase
      .from('announcements')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    setAnnouncements(ann ?? []);

    const { data: guides } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .eq('role', 'guide')
      .eq('is_active', true);

    if (guides) {
      const withReviews = await Promise.all(
        guides.map(async (g: any) => {
          const { data: bookingReviews } = await supabase
            .from('reviews')
            .select('rating, bookings!inner(guide_id)')
            .eq('status', 'approved')
            .eq('bookings.guide_id', g.id);

          const allReviews = bookingReviews ?? [];
          const count = allReviews.length;
          const avg =
            count > 0 ? allReviews.reduce((s: number, r: any) => s + r.rating, 0) / count : 0;
          return { ...g, review_count: count, avg_rating: avg } as LeaderGuide;
        })
      );
      const sorted = withReviews
        .sort((a, b) => b.review_count - a.review_count || b.avg_rating - a.avg_rating)
        .slice(0, 5);
      setLeaders(sorted);
    }

    try {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast' +
          '?latitude=31.3416&longitude=-7.7562' +
          '&current_weather=true'
      );
      const json = await res.json();
      const w = json.current_weather;
      setWeather({
        temperature: w.temperature,
        windspeed: w.windspeed,
        weathercode: w.weathercode,
      });
    } catch {
      setWeather(null);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel('announcements_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          setAnnouncements((prev) => [payload.new as Announcement, ...prev]);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  if (loading) {
    return (
      <View style={S.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={Colors.primary}
        />
      }>
      {weather && (
        <View style={S.weatherCard}>
          <View style={{ flex: 1 }}>
            <Text style={S.weatherLocation}>📍 Ourika Valley, Morocco</Text>
            <Text style={S.weatherTemp}>
              {weatherIcon(weather.weathercode)} {weather.temperature}°C
            </Text>
            <Text style={S.weatherDesc}>
              {weatherDesc(weather.weathercode)}{' '}
              <Text style={S.weatherWind}>💨 {weather.windspeed} km/h</Text>
            </Text>
          </View>
          <View style={S.weatherBadge}>
            <Text style={S.weatherBadgeText}>Today</Text>
          </View>
        </View>
      )}

      <View style={S.section}>
        <View style={S.sectionHeader}>
          <Ionicons name="megaphone-outline" size={18} color={Colors.primary} />
          <Text style={S.sectionTitle}>Announcements</Text>
        </View>

        {announcements.length === 0 ? (
          <View style={S.emptyBox}>
            <Text style={S.emptyText}>No announcements yet</Text>
          </View>
        ) : (
          announcements.map((ann) => (
            <View key={ann.id} style={S.annCard}>
              <View style={S.annDot} />
              <View style={{ flex: 1 }}>
                <Text style={S.annTitle}>{ann.title}</Text>
                <Text style={S.annBody}>{ann.body}</Text>
                <Text style={S.annDate}>
                  {new Date(ann.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={S.section}>
        <View style={S.sectionHeader}>
          <Ionicons name="trophy-outline" size={18} color={Colors.primary} />
          <Text style={S.sectionTitle}>Top Guides This Month</Text>
        </View>

        <Text style={S.leaderSubtitle}>Ranked by verified reviews received</Text>

        {leaders.map((guide, i) => (
          <View
            key={guide.id}
            style={[
              S.leaderRow,
              i === 0 && { backgroundColor: '#fefce8', borderColor: '#fde68a' },
            ]}>
            <Text style={S.leaderMedal}>{medal[i]}</Text>
            <View style={S.leaderAvatar}>
              {guide.avatar_url ? (
                <Image
                  source={{ uri: guide.avatar_url }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              ) : (
                <Text style={S.leaderInitial}>{guide.full_name?.charAt(0) ?? '?'}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.leaderName}>{guide.full_name}</Text>
              <Text style={S.leaderStat}>
                {guide.review_count} review{guide.review_count !== 1 ? 's' : ''}{' '}
                {guide.avg_rating > 0 ? `  ·  ⭐ ${guide.avg_rating.toFixed(1)}` : ''}
              </Text>
            </View>
            {i === 0 && (
              <View style={S.leaderBadge}>
                <Text style={S.leaderBadgeText}>🏆 Top</Text>
              </View>
            )}
          </View>
        ))}

        {leaders.length === 0 && (
          <View style={S.emptyBox}>
            <Text style={S.emptyText}>No reviews yet — be the first!</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  weatherCard: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherLocation: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  weatherTemp: {
    color: 'white',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 4,
  },
  weatherDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  weatherWind: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  weatherBadge: {
    backgroundColor: 'rgba(0,239,157,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  weatherBadgeText: { color: Colors.mint, fontSize: 12, fontWeight: '800' },
  section: { marginHorizontal: 16, marginTop: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: Colors.primary },
  leaderSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: -6,
  },
  emptyBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { color: Colors.textLight, fontWeight: '600', fontSize: 13 },
  annCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  annDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mint,
    marginTop: 5,
    flexShrink: 0,
  },
  annTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  annBody: {
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 18,
    fontWeight: '500',
  },
  annDate: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 6,
    fontWeight: '600',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leaderMedal: { fontSize: 20, width: 28, textAlign: 'center' },
  leaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderInitial: { color: 'white', fontWeight: '900', fontSize: 16 },
  leaderName: { fontSize: 14, fontWeight: '800', color: Colors.text },
  leaderStat: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '600',
    marginTop: 2,
  },
  leaderBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  leaderBadgeText: { fontSize: 11, fontWeight: '800', color: '#92400e' },
});

