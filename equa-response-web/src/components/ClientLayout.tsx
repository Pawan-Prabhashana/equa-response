"use client";

import { useEffect } from "react";
import { useSystemSettings, getThemeClass, getDensityClass } from "@/store/systemSettings";

/**
 * ClientLayout - Applies theme and density classes to body
 * Must be client component to use Zustand store
 */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { themePreset, density, reduceMotion } = useSystemSettings();

  useEffect(() => {
    const themeValue = getThemeClass(themePreset);
    const densityClass = getDensityClass(density);

    // Apply theme via data-theme attribute
    document.documentElement.setAttribute('data-theme', themeValue);

    // Apply density class to body
    document.body.className = `antialiased font-sans ${densityClass}`;

    // Apply reduce-motion globally
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [themePreset, density, reduceMotion]);

  return <>{children}</>;
}
