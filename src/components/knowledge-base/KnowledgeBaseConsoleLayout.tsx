import { ReactNode, Fragment } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Search, FileText, Users, Clock3, ShieldAlert } from "lucide-react";
import { cn } from "../../lib/utils";
import { OverviewStatCard } from "./OverviewCards";

export type KbConsoleTab = "team" | "public";

export interface KbGalleryItem {
  id: string;
  name: string;
  desc: string;
  status: string;
  statusTone: "success" | "archived" | "warning" | "info" | string;
  isArchived?: boolean;
}

export interface KbLocalMetrics {
  docCount: number | string;
  authorizedCount: number | string;
  recentUpdates: number | string;
  anomalyTasks: number | string;
  authorizedLabel?: string;
}

interface KnowledgeBaseConsoleLayoutProps {
  activeTab: KbConsoleTab;
  onTabChange: (tab: KbConsoleTab) => void;
  onCreate: () => void;
  createLabel?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder: string;
  galleryItems: KbGalleryItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onEnterKb?: (id: string) => void;
  allowArchivedEntry?: boolean;
  selectedTitle: string;
  selectedDesc: string;
  selectedStatus: string;
  selectedStatusTone: string;
  metrics: KbLocalMetrics;
  detailContent: ReactNode;
  galleryToolbar?: ReactNode;
  panelFooter?: ReactNode;
  emptyGalleryMessage?: string;
  /** 团队知识库启用玻璃拟态视觉 */
  visualVariant?: "default" | "glass";
}

const STATUS_DOT: Record<string, string> = {
  success: "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]",
  archived: "bg-slate-400 shadow-[0_0_0_4px_rgba(148,163,184,0.18)]",
  warning: "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.18)]",
  info: "bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.18)]",
};

type MetricKey = "docCount" | "authorizedCount" | "recentUpdates" | "anomalyTasks";

interface MetricConfig {
  metricKey: MetricKey;
  label: string;
  fallbackAuthorizedLabel?: boolean;
  icon: LucideIcon;
  themeIndex: number;
}

const METRIC_CONFIG: MetricConfig[] = [
  { metricKey: "docCount", label: "文档总数", icon: FileText, themeIndex: 0 },
  { metricKey: "authorizedCount", label: "授权人员", fallbackAuthorizedLabel: true, icon: Users, themeIndex: 1 },
  { metricKey: "recentUpdates", label: "近 7 日更新文件数", icon: Clock3, themeIndex: 2 },
  { metricKey: "anomalyTasks", label: "异常文件", icon: ShieldAlert, themeIndex: 3 },
];

function StatusBreathingDot({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
      <span
        className={cn(
          "size-2 rounded-full animate-pulse",
          STATUS_DOT[tone] ?? "bg-slate-400 shadow-[0_0_0_4px_rgba(148,163,184,0.18)]"
        )}
      />
      {label}
    </span>
  );
}

export function KnowledgeBaseConsoleLayout({
  activeTab,
  onTabChange,
  onCreate,
  createLabel = "新建",
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  galleryItems,
  selectedId,
  onSelect,
  onEnterKb,
  allowArchivedEntry = false,
  selectedTitle,
  selectedDesc,
  selectedStatus,
  selectedStatusTone,
  metrics,
  detailContent,
  galleryToolbar,
  panelFooter,
  emptyGalleryMessage = "暂无匹配的知识库",
  visualVariant = "glass",
}: KnowledgeBaseConsoleLayoutProps) {
  const authorizedLabel = metrics.authorizedLabel ?? "授权人员";
  const isGlass = visualVariant === "glass";

  return (
    <div
      className={cn(
        "relative flex flex-col h-full min-h-0",
        isGlass
          ? "bg-gradient-to-br from-slate-100 via-blue-50/50 to-indigo-100/40"
          : "bg-slate-50"
      )}
    >
      {isGlass && (
        <>
          <div className="glass-ambient-blob pointer-events-none absolute -left-24 top-8 size-72 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
          <div className="glass-ambient-blob pointer-events-none absolute right-0 top-1/3 size-80 rounded-full bg-indigo-300/15 blur-3xl animate-pulse [animation-delay:1.2s]" />
          <div className="glass-ambient-blob pointer-events-none absolute bottom-0 left-1/3 size-64 rounded-full bg-sky-300/20 blur-3xl animate-pulse [animation-delay:2.4s]" />
        </>
      )}

      <header
        className={cn(
          "relative z-10 shrink-0 h-14 px-6 flex items-center justify-between border-b",
          isGlass ? "glass-panel border-white/50" : "border-slate-200/80 bg-white"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-1 p-1 rounded-xl",
            isGlass ? "bg-white/35 backdrop-blur-md ring-1 ring-white/50" : "bg-slate-100/80"
          )}
        >
          {(
            [
              { id: "team" as const, label: "团队知识库" },
              { id: "public" as const, label: "公共知识库" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                activeTab === tab.id
                  ? isGlass
                    ? "bg-white/80 text-slate-900 shadow-sm ring-1 ring-white/70 backdrop-blur-sm"
                    : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-1.5 hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Plus className="size-4" />
          {createLabel}
        </button>
      </header>

      <div className="relative z-10 flex-1 min-h-0 flex gap-4 p-4 md:p-5">
        <section
          className={cn(
            "w-[45%] min-w-0 flex flex-col rounded-2xl overflow-hidden",
            isGlass ? "glass-panel" : "bg-white border border-slate-200 shadow-sm"
          )}
        >
          <div
            className={cn(
              "shrink-0 px-4 py-3 border-b flex items-center justify-between gap-3",
              isGlass ? "border-white/40 bg-white/25 backdrop-blur-sm" : "border-slate-100 bg-slate-50/40"
            )}
          >
            <div className="relative flex-1 max-w-[240px]">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full pl-9 pr-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-shadow",
                  isGlass
                    ? "bg-white/50 border border-white/60 backdrop-blur-sm"
                    : "bg-white border border-slate-200"
                )}
              />
            </div>
            {galleryToolbar}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle p-4">
            <div className="grid grid-cols-1 gap-3">
              {galleryItems.length === 0 ? (
                <div className="py-16 text-center text-sm font-medium text-slate-400">{emptyGalleryMessage}</div>
              ) : (
                galleryItems.map((kb) => {
                  const isActive = selectedId === kb.id;
                  const canEnterArchived = kb.isArchived && allowArchivedEntry;
                  const canEnterName = onEnterKb && (!kb.isArchived || canEnterArchived);
                  return (
                    <div
                      key={kb.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelect(kb.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(kb.id);
                        }
                      }}
                      className={cn(
                        "group w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer",
                        isGlass
                          ? isActive
                            ? "glass-card-active translate-x-0.5"
                            : "glass-card hover:border-blue-200/60 hover:shadow-md hover:-translate-y-0.5"
                          : isActive
                            ? "border-blue-400/80 bg-blue-50/40 shadow-[0_0_0_1px_rgba(59,130,246,0.25)] translate-x-0.5"
                            : "border-slate-200 bg-white hover:border-blue-200/80 hover:shadow-md hover:-translate-y-0.5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <button
                          type="button"
                          disabled={!!kb.isArchived && !allowArchivedEntry}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (kb.isArchived && !allowArchivedEntry) return;
                            onEnterKb?.(kb.id);
                          }}
                          className={cn(
                            "font-medium text-[15px] leading-snug line-clamp-1 text-left transition-colors",
                            kb.isArchived && !allowArchivedEntry
                              ? "text-slate-500 cursor-default"
                              : canEnterName
                                ? cn(
                                    isActive ? "text-blue-700" : "text-slate-900",
                                    "hover:text-blue-700 hover:underline underline-offset-2 cursor-pointer"
                                  )
                                : isActive
                                  ? "text-blue-700"
                                  : "text-slate-900 group-hover:text-blue-700"
                          )}
                        >
                          {kb.name}
                        </button>
                        <span className="inline-flex items-center gap-1.5 shrink-0 text-[11px] font-medium text-slate-500">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              !kb.isArchived && "animate-pulse",
                              STATUS_DOT[kb.statusTone] ?? STATUS_DOT.info
                            )}
                          />
                          {kb.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{kb.desc}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section
          className={cn(
            "w-[55%] min-w-0 flex flex-col rounded-2xl overflow-hidden",
            isGlass ? "glass-panel" : "bg-white border border-slate-200 shadow-sm"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex flex-col h-full min-h-0"
            >
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle p-6 md:p-7 flex flex-col gap-6">
                <div>
                  <div className="mb-3">
                    <StatusBreathingDot tone={selectedStatusTone} label={selectedStatus} />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 tracking-tight leading-tight">{selectedTitle}</h2>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{selectedDesc}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {METRIC_CONFIG.map((config) => {
                    const displayLabel = config.fallbackAuthorizedLabel ? authorizedLabel : config.label;
                    const value = metrics[config.metricKey];
                    const highlight = config.metricKey === "anomalyTasks" && Number(value) > 0;

                    return (
                      <Fragment key={config.metricKey}>
                        <OverviewStatCard
                          label={displayLabel}
                          value={value}
                          icon={config.icon}
                          themeIndex={config.themeIndex}
                          highlight={highlight}
                        />
                      </Fragment>
                    );
                  })}
                </div>

                <div className="flex-1 min-h-0">{detailContent}</div>
              </div>

              {panelFooter && (
                <div
                  className={cn(
                    "shrink-0 px-6 py-4 border-t",
                    isGlass ? "border-white/40 bg-white/25 backdrop-blur-sm" : "border-slate-100 bg-slate-50/30"
                  )}
                >
                  {panelFooter}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
