import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export function Card({
  title,
  sub,
  right,
  children,
  className,
}: {
  title?: string;
  sub?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel-card glass relative rounded-2xl p-4", className)}>
      <svg className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-black/15" viewBox="0 0 16 16">
        <path d="M3 3 L13 13" stroke="currentColor" strokeWidth="1" />
      </svg>
      {title && (
        <header className="mb-3 flex items-center gap-2 pr-5">
          <h3 className="font-display text-[13px] font-extrabold uppercase tracking-[0.04em] text-ink">{title}</h3>
          {sub && <span className="font-mono text-[9.5px] uppercase tracking-wider text-black/40">{sub}</span>}
          <div className="ml-auto">{right}</div>
        </header>
      )}
      {children}
    </section>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-black/55">{label}</span>
        <span className="font-mono text-[11px] font-semibold text-ink">{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        aria-label={label}
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ["--pct" as string]: `${pct}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

export function Toggle({ label, checked, onChange, icon }: { label: string; checked: boolean; onChange: (v: boolean) => void; icon?: ReactNode }) {
  return (
    <button
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11.5px] font-medium transition",
        checked ? "border-orange/40 bg-orange/[0.07] text-ink" : "border-black/[0.07] bg-white/60 text-black/55 hover:bg-white"
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      <span className={cn("relative h-4 w-7 rounded-full transition", checked ? "bg-orange" : "bg-black/15")}>
        <span className={cn("absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all", checked ? "left-3.5" : "left-0.5")} />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-black/[0.07] bg-black/[0.03] p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider transition",
            value === o.id ? "bg-white text-ink shadow-sm" : "text-black/45 hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  variant = "ghost",
  className,
  title,
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "dark";
  className?: string;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition active:scale-[0.97]",
        variant === "primary" && "bg-orange text-white shadow-[0_6px_20px_-6px_rgba(255,106,19,0.7)] hover:brightness-105",
        variant === "dark" && "bg-ink text-white hover:bg-black",
        variant === "ghost" &&
          (active
            ? "border border-orange/50 bg-orange/10 text-orange"
            : "border border-black/[0.08] bg-white/70 text-ink hover:bg-white"),
        className
      )}
    >
      {children}
    </button>
  );
}

export function Num({ n, active }: { n: number; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
        active ? "bg-ink text-white" : "bg-orange text-white"
      )}
    >
      {n}
    </span>
  );
}
