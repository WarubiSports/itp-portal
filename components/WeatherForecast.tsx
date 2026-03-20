"use client";

import { useEffect, useState } from "react";

type DayForecast = {
  date: string;
  tempMax: number;
  tempMin: number;
  code: number;
};

const weatherIcons: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
  45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌦️", 55: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️",
  71: "🌨️", 73: "🌨️", 75: "🌨️",
  80: "🌦️", 81: "🌧️", 82: "🌧️",
  95: "⛈️", 96: "⛈️", 99: "⛈️",
};

const getIcon = (code: number): string => weatherIcons[code] || "🌤️";

const formatDay = (dateStr: string): string => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
};

export const WeatherForecast = ({ startDate, endDate }: { startDate: string; endDate: string }) => {
  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=50.9375&longitude=6.9603&daily=temperature_2m_max,temperature_2m_min,weather_code&start_date=${startDate}&end_date=${endDate}&timezone=Europe/Berlin`
        );
        if (!res.ok) return;
        const data = await res.json();
        const days: DayForecast[] = (data.daily?.time || []).map((date: string, i: number) => ({
          date,
          tempMax: Math.round(data.daily.temperature_2m_max[i]),
          tempMin: Math.round(data.daily.temperature_2m_min[i]),
          code: data.daily.weather_code[i],
        }));
        setForecast(days);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [startDate, endDate]);

  if (loading || forecast.length === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-lg">🌤️</span>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Weather in Cologne</span>
      </div>
      <div className="flex gap-3 overflow-x-auto">
        {forecast.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-0.5 min-w-[3.5rem]">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDay(day.date)}</span>
            <span className="text-lg">{getIcon(day.code)}</span>
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              {day.tempMax}°/{day.tempMin}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
