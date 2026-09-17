import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../components/BottomNav";
import { Colors } from "../constants/theme";

const SEARCH_RADIUS_METERS = 10000;

export default function NearestHospitalsScreen() {
  const colors = Colors.light;
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    findHospitals();
  }, []);

  const findHospitals = async () => {
    setLoading(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        throw new Error("Location permission is needed to find hospitals near you.");
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = position.coords;
      const address = await Location.reverseGeocodeAsync({ latitude, longitude });
      const place = address[0];
      setLocationLabel([place?.city, place?.region, place?.country].filter(Boolean).join(", "));

      const query = `[out:json][timeout:20];(nwr[amenity=hospital](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});nwr[healthcare=hospital](around:${SEARCH_RADIUS_METERS},${latitude},${longitude}););out center tags;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("The hospital service is temporarily unavailable.");
      const data = await response.json();
      const results = (data.elements || [])
        .map((item) => {
          const itemLatitude = item.lat ?? item.center?.lat;
          const itemLongitude = item.lon ?? item.center?.lon;
          if (!itemLatitude || !itemLongitude) return null;
          return {
            id: String(item.id),
            name: item.tags?.name || "Hospital",
            address: item.tags?.["addr:full"] || [item.tags?.["addr:street"], item.tags?.["addr:city"]].filter(Boolean).join(", ") || "Address unavailable",
            phone: item.tags?.phone || item.tags?.["contact:phone"],
            distance: distanceInKm(latitude, longitude, itemLatitude, itemLongitude),
            latitude: itemLatitude,
            longitude: itemLongitude,
          };
        })
        .filter(Boolean)
        .sort((first, second) => first.distance - second.distance)
        .slice(0, 20);
      setHospitals(results);
      if (!results.length) setError("No hospitals were found within 10 km of your location.");
    } catch (lookupError) {
      setError(lookupError.message || "Unable to find nearby hospitals.");
    } finally {
      setLoading(false);
    }
  };

  const openHospital = (hospital) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert("Unable to open maps", "Please open your maps app and search for this hospital."));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Nearest Hospitals</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>{locationLabel || "Using your current location"}</Text>
          </View>
          <TouchableOpacity onPress={findHospitals} accessibilityLabel="Refresh nearby hospitals">
            <MaterialCommunityIcons name="refresh" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="large" color={colors.primary} style={styles.loader} /> : null}
        {!loading && error ? <Text style={[styles.message, { color: colors.muted }]}>{error}</Text> : null}
        {!loading && hospitals.map((hospital) => (
          <TouchableOpacity key={hospital.id} style={[styles.hospital, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openHospital(hospital)}>
            <View style={styles.iconBox}><MaterialCommunityIcons name="hospital-building" size={26} color={colors.primary} /></View>
            <View style={styles.details}>
              <Text style={[styles.name, { color: colors.foreground }]}>{hospital.name}</Text>
              <Text style={[styles.address, { color: colors.muted }]}>{hospital.address}</Text>
              <Text style={[styles.distance, { color: colors.primary }]}>{hospital.distance.toFixed(1)} km away</Text>
              {hospital.phone ? <Text style={[styles.address, { color: colors.muted }]}>{hospital.phone}</Text> : null}
            </View>
            <MaterialCommunityIcons name="directions" size={24} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

function distanceInKm(latitudeOne, longitudeOne, latitudeTwo, longitudeTwo) {
  const earthRadius = 6371;
  const latitudeDelta = ((latitudeTwo - latitudeOne) * Math.PI) / 180;
  const longitudeDelta = ((longitudeTwo - longitudeOne) * Math.PI) / 180;
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos((latitudeOne * Math.PI) / 180) * Math.cos((latitudeTwo * Math.PI) / 180) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 110 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "700" },
  subtitle: { marginTop: 5, fontSize: 13 },
  loader: { marginTop: 50 },
  message: { textAlign: "center", marginTop: 40, lineHeight: 22 },
  hospital: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#e5f5ec", justifyContent: "center", alignItems: "center", marginRight: 12 },
  details: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: "700" },
  address: { fontSize: 13, marginTop: 4 },
  distance: { fontSize: 13, fontWeight: "600", marginTop: 5 },
});
