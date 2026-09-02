"use client";

import { Button } from "@hono-commerce/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@hono-commerce/ui/components/sheet";
import { cn } from "@hono-commerce/ui/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PanelRightOpenIcon,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type SidebarOverride = {
  id: symbol;
  content: ReactNode;
};

interface ResponsiveSidebarContextValue {
  setSidebarOverride: (override: SidebarOverride) => void;
  clearSidebarOverride: (id: symbol) => void;
}

const ResponsiveSidebarContext =
  createContext<ResponsiveSidebarContextValue | null>(null);

export function useResponsiveContentSidebar(
  sidebar: ReactNode,
  enabled = true,
) {
  const context = useContext(ResponsiveSidebarContext);
  const overrideId = useRef(Symbol("responsive-content-sidebar-override"));

  useEffect(() => {
    if (!context) return;

    if (!enabled) {
      context.clearSidebarOverride(overrideId.current);
      return;
    }

    context.setSidebarOverride({
      id: overrideId.current,
      content: sidebar,
    });

    const id = overrideId.current;
    return () => {
      context.clearSidebarOverride(id);
    };
  }, [context, enabled, sidebar]);
}

export interface ResponsiveContentSidebarLayoutProps {
  mainContent: ReactNode;
  sidebar?: ReactNode;
  title?: string;
  className?: string;
}

export function ResponsiveContentSidebarLayout({
  mainContent,
  sidebar,
  title = "Contextual Insights",
  className,
}: ResponsiveContentSidebarLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [sidebarOverride, setSidebarOverride] =
    useState<SidebarOverride | null>(null);

  const activeSidebar = sidebarOverride ? sidebarOverride.content : sidebar;
  const hasSidebar = Boolean(activeSidebar);

  return (
    <ResponsiveSidebarContext.Provider
      value={{
        setSidebarOverride,
        clearSidebarOverride: (id) => {
          setSidebarOverride((current) =>
            current?.id === id ? null : current,
          );
        },
      }}
    >
      <div
        className={cn(
          "flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-3",
          className,
        )}
      >
        <div className="min-w-0 flex-1">{mainContent}</div>

        {hasSidebar && (
          <>
            {/* Desktop Sticky Rail Sidebar */}
            <aside
              data-state={isDesktopCollapsed ? "collapsed" : "expanded"}
              className={cn(
                "relative hidden shrink-0 lg:sticky lg:top-4 lg:z-20 lg:flex lg:self-start transition-all duration-300",
                isDesktopCollapsed
                  ? "w-4 overflow-visible"
                  : "border-border/60 bg-card/60 w-72 xl:w-80 rounded-2xl border p-4 shadow-xs backdrop-blur-md",
              )}
            >
              {isDesktopCollapsed ? (
                <Button
                  variant="outline"
                  size="icon"
                  className="border-primary/30 bg-background text-primary absolute top-2 -left-3 size-7 rounded-full shadow-md"
                  onClick={() => setIsDesktopCollapsed(false)}
                  title={`Expand ${title}`}
                >
                  <ChevronLeftIcon className="size-3.5" />
                </Button>
              ) : (
                <div className="relative flex size-full flex-col">
                  <div className="border-border/40 mb-3 flex items-center justify-between border-b pb-3">
                    <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
                      {title}
                    </h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground size-6"
                      onClick={() => setIsDesktopCollapsed(true)}
                      title={`Collapse ${title}`}
                    >
                      <ChevronRightIcon className="size-3.5" />
                    </Button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {activeSidebar}
                  </div>
                </div>
              )}
            </aside>

            {/* Mobile Sheet Trigger */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    size="icon"
                    className="fixed right-6 bottom-6 z-40 size-12 rounded-full shadow-2xl lg:hidden"
                    aria-label={`Open ${title}`}
                  >
                    <PanelRightOpenIcon className="size-5" />
                  </Button>
                }
              />
              <SheetContent side="right" className="w-[85vw] p-5 sm:w-[380px]">
                <SheetHeader className="border-border/40 mb-4 border-b pb-3">
                  <SheetTitle className="text-sm font-semibold">
                    {title}
                  </SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {activeSidebar}
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>
    </ResponsiveSidebarContext.Provider>
  );
}
