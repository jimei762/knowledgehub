import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export type OverviewCardTheme = {
  surface: string;
  border: string;
  glow: string;
  iconGradient: string;
  iconShadow: string;
};

export const OVERVIEW_CARD_THEMES: OverviewCardTheme[] = [
  {
    surface: "from-blue-50/55 via-white/75 to-slate-50/40",
    border: "border-blue-100/40",
    glow: "bg-blue-400/10",
    iconGradient: "from-blue-500/90 to-blue-600/90",
    iconShadow: "shadow-blue-600/20",
  },
  {
    surface: "from-indigo-50/50 via-white/75 to-blue-50/30",
    border: "border-indigo-100/40",
    glow: "bg-indigo-400/10",
    iconGradient: "from-indigo-500/88 to-blue-600/88",
    iconShadow: "shadow-indigo-600/18",
  },
  {
    surface: "from-sky-50/45 via-white/75 to-indigo-50/25",
    border: "border-sky-100/40",
    glow: "bg-sky-400/10",
    iconGradient: "from-sky-500/88 to-blue-500/88",
    iconShadow: "shadow-sky-600/18",
  },
  {
    surface: "from-slate-50/70 via-white/75 to-indigo-50/30",
    border: "border-slate-200/45",
    glow: "bg-indigo-300/8",
    iconGradient: "from-slate-500/85 to-indigo-600/85",
    iconShadow: "shadow-slate-600/15",
  },
];

export function getOverviewCardTheme(index: number): OverviewCardTheme {
  return OVERVIEW_CARD_THEMES[index % OVERVIEW_CARD_THEMES.length];
}

const CARD_BASE = cn(
  "group relative overflow-hidden rounded-xl p-3.5",
  "bg-gradient-to-br backdrop-blur-sm border",
  "shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
  "hover:shadow-[0_8px_22px_rgba(37,99,235,0.07)] transition-all duration-300"
);

export interface OverviewStatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  theme?: OverviewCardTheme;
  themeIndex?: number;
  highlight?: boolean;
  className?: string;
  minHeight?: string;
}

export function OverviewStatCard({
  label,
  value,
  icon: Icon,
  theme,
  themeIndex = 0,
  highlight = false,
  className,
  minHeight = "min-h-[100px]",
}: OverviewStatCardProps) {
  const t = theme ?? getOverviewCardTheme(themeIndex);
  const displayValue = typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div
      className={cn(CARD_BASE, minHeight, "flex flex-col justify-between", t.surface, t.border, className)}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-5 -top-5 w-[4.5rem] h-[4.5rem] rounded-full blur-2xl",
          t.glow
        )}
      />
      <div className="relative flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 leading-snug pt-0.5">{label}</span>
        <div
          className={cn(
            "w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br flex items-center justify-center shrink-0",
            "shadow-sm ring-1 ring-white/50",
            t.iconGradient,
            t.iconShadow
          )}
        >
          <Icon className="w-[15px] h-[15px] text-white" strokeWidth={1.85} />
        </div>
      </div>
      <div className="relative mt-2.5">
        <div
          className={cn(
            "text-[1.625rem] leading-none font-semibold tabular-nums tracking-tight",
            highlight ? "text-amber-600" : "text-slate-800"
          )}
        >
          {displayValue}
        </div>
      </div>
    </div>
  );
}

export interface OverviewInfoCardProps {
  label: string;
  children: ReactNode;
  theme?: OverviewCardTheme;
  themeIndex?: number;
  className?: string;
}

export function OverviewInfoCard({
  label,
  children,
  theme,
  themeIndex = 0,
  className,
}: OverviewInfoCardProps) {
  const t = theme ?? getOverviewCardTheme(themeIndex);

  return (
    <div className={cn(CARD_BASE, t.surface, t.border, className)}>
      <div
        className={cn(
          "pointer-events-none absolute -right-5 -top-5 w-[4.5rem] h-[4.5rem] rounded-full blur-2xl",
          t.glow
        )}
      />
      <div className="relative">
        <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
        <div className="text-sm font-medium text-slate-800 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export interface OverviewDetailCardProps {
  title: string;
  description: string;
  themeIndex?: number;
  className?: string;
}

export function OverviewDetailCard({
  title,
  description,
  themeIndex = 0,
  className,
}: OverviewDetailCardProps) {
  const t = getOverviewCardTheme(themeIndex);

  return (
    <div className={cn(CARD_BASE, t.surface, t.border, className)}>
      <div
        className={cn(
          "pointer-events-none absolute -right-5 -top-5 w-[4.5rem] h-[4.5rem] rounded-full blur-2xl",
          t.glow
        )}
      />
      <div className="relative">
        <div className="text-sm font-medium mb-1 text-slate-900">{title}</div>
        <div className="text-sm text-slate-500 leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

export function OverviewSectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("text-sm font-semibold text-slate-900", className)}>{children}</div>;
}
