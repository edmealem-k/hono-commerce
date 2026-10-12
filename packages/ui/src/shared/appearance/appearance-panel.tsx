"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@hono-commerce/ui/components/toggle-group";
import { LaptopMinimal, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function AppearancePanel() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const selectedTheme =
    theme === "light" || theme === "dark" ? theme : resolvedTheme;

  return (
    <section aria-labelledby="appearance-title" className="space-y-4">
      <div>
        <h2 id="appearance-title" className="text-sm font-semibold">
          Appearance
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Choose how Hono Commerce looks on this device.
        </p>
      </div>
      <ToggleGroup
        value={selectedTheme ? [selectedTheme] : []}
        onValueChange={(values) => {
          const value = values[0];
          if (value === "light" || value === "dark") setTheme(value);
        }}
        aria-label="Theme"
        className="grid w-full grid-cols-2"
        variant="outline"
      >
        <ToggleGroupItem
          value="light"
          aria-label="Use light theme"
          className="gap-2"
        >
          <Sun className="size-4" />
          Light
        </ToggleGroupItem>
        <ToggleGroupItem
          value="dark"
          aria-label="Use dark theme"
          className="gap-2"
        >
          <Moon className="size-4" />
          Dark
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <LaptopMinimal className="size-3.5" />
        First visit follows your device preference.
      </p>
    </section>
  );
}
