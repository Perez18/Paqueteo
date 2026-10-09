import { useEffect, useState, type CSSProperties } from 'react';
import { applyAccentTheme, getAccentTheme, type AccentTheme } from './accentTheme';

const options: { id: AccentTheme; label: string; color: string }[] = [
  { id: 'black', label: 'Negro', color: '#181818' },
  { id: 'green', label: 'Verde', color: '#32553E' },
  { id: 'white', label: 'Blanco', color: '#FFFFFF' },
];

export function AccentThemePicker({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState(getAccentTheme);
  useEffect(() => {
    const syncSelection = (event: Event) => setSelected((event as CustomEvent<AccentTheme>).detail);
    window.addEventListener('paqueteo-accent-theme-change', syncSelection);
    return () => window.removeEventListener('paqueteo-accent-theme-change', syncSelection);
  }, []);
  const choices = <div className="accent-picker-options" role="group" aria-label="Color de marca">
    {options.map((option) => <button
      key={option.id}
      className={`accent-swatch ${selected === option.id ? 'selected' : ''}`}
      type="button"
      style={{ '--swatch-color': option.color } as CSSProperties}
      aria-label={`Usar color ${option.label}`}
      aria-pressed={selected === option.id}
      title={option.label}
      onClick={() => { setSelected(option.id); applyAccentTheme(option.id); }}
    />)}
  </div>;

  if (compact) return <details className="accent-picker accent-picker-compact">
    <summary aria-label="Cambiar color de marca" title="Cambiar color de marca">
      <span className="accent-current-swatch" style={{ '--swatch-color': options.find((option) => option.id === selected)?.color } as CSSProperties} />
    </summary>
    {choices}
  </details>;

  return <div className="accent-picker">
    <span className="accent-picker-label">Color de marca</span>
    {choices}
  </div>;
}
