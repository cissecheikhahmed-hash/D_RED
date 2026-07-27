import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

export async function getCurrentCoords(): Promise<Coords | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const position = await Location.getCurrentPositionAsync({});
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}
