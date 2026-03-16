import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';

type Trek = {
  id: string;
  title: string | null;
  cover_image: string | null;
  price_per_adult: number | null;
  duration: string | number | null;
  time_of_day?: string | null;
  max_group_size?: number | null;
  start_location: string | null;
  categories?: { name: string | null } | { name: string | null }[] | null;
};

export default function TreksScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [treks, setTreks] = useState<Trek[]>([]);

  const fetchTreks = useCallback(async () => {
    const { data } = await supabase
      .from('treks')
      .select(
        'id, title, cover_image, price_per_adult, duration, time_of_day, max_group_size, start_location, categories(name)'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    setTreks(((data as unknown) as Trek[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchTreks();
      setLoading(false);
    })();
  }, [fetchTreks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTreks();
    setRefreshing(false);
  }, [fetchTreks]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={treks}
        keyExtractor={(t) => String(t.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingVertical: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.imageWrap}>
              {item.cover_image ? (
                <Image source={{ uri: item.cover_image }} style={styles.image} />
              ) : (
                <View style={[styles.image, { backgroundColor: '#e5e7eb' }]} />
              )}
              {!!(Array.isArray(item.categories) ? item.categories[0]?.name : item.categories?.name) && (
                <View style={styles.catBadge}>
                  <Text style={styles.catText} numberOfLines={1}>
                    {Array.isArray(item.categories) ? item.categories[0]?.name : item.categories?.name}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {item.title ?? 'Trek'}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.duration ?? '—'} · {item.price_per_adult != null ? `${item.price_per_adult}` : '—'}
            </Text>
            <Text style={styles.location} numberOfLines={1}>
              {item.start_location ?? '—'}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  imageWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  image: { width: '100%', aspectRatio: 4 / 3 },
  catBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(11,58,44,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  catText: { color: 'white', fontWeight: '900', fontSize: 11, maxWidth: 120 },
  title: { fontSize: 14, fontWeight: '900', color: Colors.text, lineHeight: 18 },
  meta: { fontSize: 12.5, color: Colors.textLight, fontWeight: '700', marginTop: 6 },
  location: { fontSize: 12.5, color: Colors.text, fontWeight: '800', marginTop: 4 },
});

