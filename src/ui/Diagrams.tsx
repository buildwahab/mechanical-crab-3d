import { useStore } from "../store";
import type { KeyboardEvent } from "react";

const INK = "#2a2d31";
const OR = "#ff6a13";

function legPath(cx: number, cy: number, side: 1 | -1, k: number, scale = 1, lift = 0) {
  const fwd = [0.58, 0.2, -0.2, -0.58][k];
  const ax = cx + side * 28 * scale;
  const ay = cy - [13, 5, -5, -13][k] * scale;
  const kx = ax + side * Math.cos(fwd) * 30 * scale;
  const ky = ay - Math.sin(fwd) * 30 * scale - 6 * scale - lift;
  const f2 = fwd * 1.35;
  const fx = kx + side * Math.cos(f2) * 30 * scale;
  const fy = ky - Math.sin(f2) * 30 * scale + 10 * scale;
  return `M${ax} ${ay} L${kx} ${ky} L${fx} ${fy}`;
}

function TopCrab({ cx, cy, s = 1, color = INK, raise = false }: { cx: number; cy: number; s?: number; color?: string; raise?: boolean }) {
  const cl = raise ? 10 : 0;
  return (
    <g fill="none" stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx={cx} cy={cy} rx={30 * s} ry={23 * s} fill="#fff" />
      <path d={`M${cx} ${cy - 23 * s} L${cx} ${cy + 23 * s}`} strokeOpacity={0.4} />
      <ellipse cx={cx} cy={cy} rx={20 * s} ry={14 * s} strokeOpacity={0.35} />
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <path d={legPath(cx, cy, 1, k, s)} />
          <path d={legPath(cx, cy, -1, k, s)} />
        </g>
      ))}
      {[1, -1].map((sd) => (
        <g key={sd}>
          <path d={`M${cx + sd * 16 * s} ${cy - 20 * s} L${cx + sd * (30 + cl) * s} ${cy - 36 * s} L${cx + sd * 22 * s} ${cy - 50 * s}`} />
          <path
            d={`M${cx + sd * 22 * s} ${cy - 50 * s} q ${sd * -10 * s} ${-8 * s} ${sd * -4 * s} ${-18 * s} q ${sd * 4 * s} ${8 * s} ${sd * 10 * s} ${10 * s} Z`}
            fill={OR}
            fillOpacity={0.85}
            stroke={OR}
          />
        </g>
      ))}
    </g>
  );
}

export function KeyDimensions({ width, height }: { width: string; height: string }) {
  return (
    <svg viewBox="0 0 260 205" className="h-auto w-full">
      <defs>
        <marker id="arr" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L6 3 L0 6 Z" fill={INK} />
        </marker>
      </defs>
      <TopCrab cx={130} cy={68} s={1} />
      <line x1={30} y1={118} x2={230} y2={118} stroke={INK} strokeWidth={0.8} markerStart="url(#arr)" markerEnd="url(#arr)" />
      <line x1={30} y1={95} x2={30} y2={122} stroke={INK} strokeWidth={0.5} strokeDasharray="2 2" />
      <line x1={230} y1={95} x2={230} y2={122} stroke={INK} strokeWidth={0.5} strokeDasharray="2 2" />
      <rect x={110} y={111} width={40} height={13} fill="#fff" />
      <text x={130} y={121} textAnchor="middle" className="svg-dim">{width}</text>

      {/* side view */}
      <g fill="none" stroke={INK} strokeWidth={1} strokeLinejoin="round">
        <line x1={20} y1={192} x2={222} y2={192} strokeOpacity={0.35} />
        <path d="M86 172 Q130 132 174 172 Z" fill="#fff" />
        <path d="M92 166 Q130 142 168 166" strokeOpacity={0.35} />
        <rect x={98} y={172} width={64} height={9} rx={3} fill="#e9e7e2" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <path d={`M${160 + i * 2} 176 L${184 + i * 6} ${158 + i * 2} L${200 + i * 6} 192`} />
            <path d={`M${100 - i * 2} 176 L${76 - i * 6} ${158 + i * 2} L${60 - i * 6} 192`} />
          </g>
        ))}
        <line x1={130} y1={142} x2={130} y2={128} />
        <rect x={121} y={124} width={18} height={6} rx={2} fill="#fff" />
      </g>
      <line x1={238} y1={192} x2={238} y2={124} stroke={INK} strokeWidth={0.8} markerStart="url(#arr)" markerEnd="url(#arr)" />
      <line x1={140} y1={124} x2={244} y2={124} stroke={INK} strokeWidth={0.5} strokeDasharray="2 2" />
      <text x={234} y={162} textAnchor="end" className="svg-dim">{height}</text>
    </svg>
  );
}

/* ---------- Internal layout: clickable top-down schematic ---------- */
const X = (x: number) => 130 + x * 72;
const Y = (z: number) => 92 - z * 66;
const LAYOUT: { id: string; n: number; shape: "rect" | "circle"; x: number; z: number; w?: number; d?: number; r?: number }[] = [
  { id: "control-unit", n: 1, shape: "rect", x: 0, z: 0.12, w: 0.9, d: 0.5 },
  { id: "battery-pack", n: 2, shape: "rect", x: 0.53, z: -0.38, w: 0.38, d: 0.62 },
  { id: "battery-pack", n: 2, shape: "rect", x: -0.53, z: -0.38, w: 0.38, d: 0.62 },
  ...[0.62, 0.2, -0.22, -0.6].flatMap((z) => [
    { id: "drive-motors", n: 3, shape: "circle" as const, x: 0.98, z, r: 0.12 },
    { id: "drive-motors", n: 3, shape: "circle" as const, x: -0.98, z, r: 0.12 },
  ]),
  { id: "sensor-hub", n: 4, shape: "circle", x: 0, z: 0.66, r: 0.11 },
  { id: "cooling-system", n: 5, shape: "rect", x: 0, z: -0.82, w: 0.4, d: 0.24 },
  { id: "gear-train", n: 6, shape: "rect", x: 0.56, z: 0.82, w: 0.1, d: 0.44 },
  { id: "gear-train", n: 6, shape: "rect", x: -0.56, z: 0.82, w: 0.1, d: 0.44 },
  { id: "optic-cluster", n: 7, shape: "rect", x: 0, z: 1.05, w: 0.86, d: 0.14 },
];
export const LAYOUT_LEGEND = [
  { n: 1, id: "control-unit", label: "Control Unit" },
  { n: 2, id: "battery-pack", label: "Battery Pack" },
  { n: 3, id: "drive-motors", label: "Drive Motor (×8)" },
  { n: 4, id: "sensor-hub", label: "Sensor Hub" },
  { n: 5, id: "cooling-system", label: "Cooling System" },
  { n: 6, id: "gear-train", label: "Gear Train" },
  { n: 7, id: "optic-cluster", label: "Optic Cluster" },
];

export function InternalLayout({ compact = false }: { compact?: boolean }) {
  const selected = useStore((s) => s.selectedId);
  const hovered = useStore((s) => s.hoveredId);
  const select = useStore((s) => s.select);
  const setHover = useStore((s) => s.setHover);
  const shown = new Set<number>();
  return (
    <div className={compact ? "" : "grid grid-cols-[1fr_auto] items-center gap-3"}>
      <svg viewBox="0 0 260 185" className="h-auto w-full">
        <ellipse cx={130} cy={92} rx={112} ry={82} fill="none" stroke={INK} strokeWidth={0.8} />
        <ellipse cx={130} cy={92} rx={104} ry={76} fill="none" stroke={INK} strokeWidth={0.4} strokeDasharray="3 3" />
        <rect x={X(-1.1)} y={Y(0.9)} width={2.2 * 72} height={1.8 * 66} rx={8} fill="#f4f3f0" stroke={INK} strokeWidth={0.6} />
        <line x1={130} y1={6} x2={130} y2={178} stroke={OR} strokeWidth={0.5} strokeDasharray="4 3" />
        {LAYOUT.map((p, i) => {
          const active = selected === p.id;
          const hov = hovered === p.id;
          const fill = active ? OR : hov ? "#ffd2b5" : "#ffffff";
          const common = {
            fill,
            stroke: active ? OR : INK,
            strokeWidth: 0.8,
            className: "cursor-pointer transition-colors",
            role: "button",
            tabIndex: 0,
            "aria-label": LAYOUT_LEGEND.find((item) => item.id === p.id)?.label,
            "aria-pressed": active,
            onKeyDown: (event: KeyboardEvent<SVGElement>) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                select(p.id);
              }
            },
            onClick: () => select(p.id),
            onMouseEnter: () => setHover(p.id),
            onMouseLeave: () => setHover(null),
          };
          const cx = X(p.x);
          const cy = Y(p.z);
          const badge = !shown.has(p.n) && (shown.add(p.n), true);
          return (
            <g key={i}>
              {p.shape === "rect" ? (
                <rect x={cx - (p.w! * 72) / 2} y={cy - (p.d! * 66) / 2} width={p.w! * 72} height={p.d! * 66} rx={3} {...common} />
              ) : (
                <circle cx={cx} cy={cy} r={p.r! * 72} {...common} />
              )}
              {badge && (
                <g pointerEvents="none">
                  <circle cx={cx} cy={cy} r={6.5} fill={active ? "#fff" : OR} />
                  <text x={cx} y={cy + 3} textAnchor="middle" fontSize={8} fontWeight={700} fill={active ? OR : "#fff"}>
                    {p.n}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      {!compact && (
        <ul className="space-y-1.5">
          {LAYOUT_LEGEND.map((l) => (
            <li key={l.n}>
              <button
                onClick={() => select(l.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap text-[10.5px] ${selected === l.id ? "font-bold text-orange" : "text-black/70 hover:text-ink"}`}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange text-[9px] font-bold text-white">{l.n}</span>
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Mode glyphs ---------- */
export function ModeGlyph({ icon }: { icon: "walk" | "crawl" | "swim" | "defend" }) {
  return (
    <svg viewBox="0 0 80 44" className="h-10 w-[72px]">
      <g fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" strokeLinejoin="round">
        {icon === "swim" ? (
          <>
            <path d="M4 36 q6 -4 12 0 t12 0 t12 0 t12 0 t12 0 t12 0" stroke="#2b5aa0" strokeOpacity={0.6} />
            <ellipse cx={40} cy={20} rx={16} ry={6} fill="#fff" />
            <path d="M24 20 l-12 -3 M24 22 l-12 3 M56 20 l12 -3 M56 22 l12 3" />
            <path d="M30 15 l-6 -6 l4 -3 M50 15 l6 -6 l-4 -3" stroke={OR} />
          </>
        ) : (
          <>
            <line x1={4} y1={40} x2={76} y2={40} strokeOpacity={0.3} />
            <path d={`M26 ${icon === "defend" ? 22 : 26} Q40 ${icon === "defend" ? 8 : 12} 54 ${icon === "defend" ? 22 : 26} Z`} fill="#fff" />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <path d={`M${50 + i * 2} 26 L${60 + i * 4} ${icon === "walk" && i === 1 ? 14 : 18 + i} L${64 + i * 4} 40`} />
                <path d={`M${30 - i * 2} 26 L${20 - i * 4} ${icon === "walk" && i === 0 ? 14 : 18 + i} L${16 - i * 4} 40`} />
              </g>
            ))}
            {icon === "defend" ? (
              <path d="M32 16 L24 6 L30 2 M48 16 L56 6 L50 2" stroke={OR} strokeWidth={1.4} />
            ) : (
              <path d="M32 24 L26 30 L34 32 M48 24 L54 30 L46 32" stroke={OR} strokeWidth={1.2} />
            )}
            {icon === "crawl" && <path d="M58 8 L72 8 M68 5 L72 8 L68 11" stroke={OR} />}
            {icon === "walk" && <path d="M40 2 L40 7 M37 4 L40 1 L43 4" stroke={OR} />}
          </>
        )}
      </g>
    </svg>
  );
}

export function BlueprintSheet() {
  return (
    <svg viewBox="0 0 260 150" className="h-auto w-full">
      <rect x={1} y={1} width={258} height={148} fill="#f2f6fb" stroke="#2b5aa0" strokeWidth={0.6} />
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`v${i}`} x1={i * 20 + 10} y1={1} x2={i * 20 + 10} y2={149} stroke="#2b5aa0" strokeOpacity={0.08} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <line key={`h${i}`} x1={1} y1={i * 20 + 5} x2={259} y2={i * 20 + 5} stroke="#2b5aa0" strokeOpacity={0.08} />
      ))}
      <g transform="translate(-60 0)">
        <TopCrab cx={130} cy={86} s={0.82} color="#2b5aa0" />
      </g>
      {/* front cross-section */}
      <g fill="none" stroke="#2b5aa0" strokeWidth={0.8} transform="translate(130 0)">
        <path d="M18 92 Q60 50 102 92 Z" fill="#fff" />
        <path d="M26 92 Q60 60 94 92" strokeDasharray="2 2" />
        <rect x={30} y={92} width={60} height={12} fill="#dfe8f4" />
        <rect x={40} y={80} width={40} height={10} fill={OR} fillOpacity={0.25} stroke={OR} />
        <circle cx={34} cy={96} r={4} />
        <circle cx={86} cy={96} r={4} />
        <path d="M30 98 L8 84 L2 120 M90 98 L112 84 L118 120" />
        <line x1={60} y1={40} x2={60} y2={128} stroke={OR} strokeDasharray="4 2" strokeWidth={0.5} />
        <text x={60} y={140} textAnchor="middle" className="svg-dim" fill="#2b5aa0" stroke="none">SECTION A–A</text>
      </g>
      <text x={70} y={140} textAnchor="middle" className="svg-dim" fill="#2b5aa0">PLAN VIEW</text>
    </svg>
  );
}
