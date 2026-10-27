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

/** The county is authored. This does not call the network. */
export async function fetchWeather(_lat: number, _lng: number): Promise<WeatherState | null> {
  return null;
}

/** The county is authored. This does not ask for device location. */
export function requestGeo(): Promise<{ lat: number; lng: number } | null> {
  return Promise.resolve(null);
}

/** Real weather does not change the speed of the job. */
export function weatherSpeed(_w: WeatherState | null) {
  return 1;
}
