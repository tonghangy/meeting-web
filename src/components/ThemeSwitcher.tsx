import { MonitorCog, Moon, Palette, SunMedium } from 'lucide-react';
import { themePresets, useTheme, type ThemePreset } from '../context/ThemeContext';

const themeIcons: Record<ThemePreset, JSX.Element> = {
  'reference-inspired': <MonitorCog aria-hidden="true" size={15} />,
  'professional-light': <SunMedium aria-hidden="true" size={15} />,
  'focus-dark': <Moon aria-hidden="true" size={15} />,
};

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switcher" aria-label="设计风格切换">
      <span className="theme-switcher-label">
        <Palette aria-hidden="true" size={15} />
        风格
      </span>
      <div className="theme-switcher-options">
        {themePresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="theme-option"
            aria-pressed={theme === preset.id}
            title={preset.description}
            onClick={() => setTheme(preset.id)}
          >
            {themeIcons[preset.id]}
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
