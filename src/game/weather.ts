import { weatherLabel } from "./geography";

export type WeatherState = {
  tempF: number;
  code: number;
  wind: number;
  isDay: boolean;
  precip: number;
  label: ReturnType<typeof weatherLabel>;
  lat: number;
  lng: number;
};

export async function fetchWeather(lat: number, lng: number): Promise<WeatherState | null> {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      lat.toFixed(4) +
      "&longitude=" +
      lng.toFixed(4) +
      "&current=temperature_2m,weather_code,wind_speed_10m,precipitation,is_day&temperature_unit=fahrenheit&wind_speed_unit=mph";
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = (await r.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        wind_speed_10m?: number;
        precipitation?: number;
        is_day?: number;
      };
    };
    const c = j.current;
    if (!c) return null;
    const code = c.weather_code ?? 0;
    return {
      tempF: Math.round(c.temperature_2m ?? 50),
      code,
      wind: c.wind_speed_10m ?? 0,
      isDay: (c.is_day ?? 1) === 1,
      precip: c.precipitation ?? 0,
      label: weatherLabel(code),
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

export function requestGeo(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 120000 },
    );
  });
}

export function weatherSpeed(w: WeatherState | null) {
  if (!w) return 1;
  if (w.label.id === "snow") return 0.86;
  if (w.label.id === "rain") return 0.92;
  if (w.label.id === "storm") return 0.88;
  if (w.label.id === "fog") return 0.95;
  return 1;
}
