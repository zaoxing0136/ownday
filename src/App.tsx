import { Suspense, lazy, type ReactNode } from "react";
import { BrowserRouter, HashRouter, Route, Routes } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PageErrorBoundary from "@/components/PageErrorBoundary";
import { Toaster } from "@/components/ui/toaster";

const Today = lazy(() => import("@/pages/Today"));
const Mainline = lazy(() => import("@/pages/Mainline"));
const DraftBox = lazy(() => import("@/pages/DraftBox"));
const FutureSchedule = lazy(() => import("@/pages/FutureSchedule"));
const Settings = lazy(() => import("@/pages/Settings"));
const WeeklyFocus = lazy(() => import("@/pages/WeeklyFocus"));
const MonthlyFocus = lazy(() => import("@/pages/MonthlyFocus"));
const Roles = lazy(() => import("@/pages/Roles"));
const Review = lazy(() => import("@/pages/Review"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function RouteFallback() {
  return (
    <div className="min-h-screen pb-28">
      <div className="page-shell">
        <div className="hero-panel p-5">
          <p className="soft-kicker">OWN MY DAY</p>
          <p className="mt-3 text-lg font-semibold text-foreground">页面正在展开</p>
          <p className="mt-2 text-sm text-muted-foreground">再等一下，就好了。</p>
        </div>
      </div>
    </div>
  );
}

function SafeRoute({ children }: { children: ReactNode }) {
  return (
    <PageErrorBoundary>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </PageErrorBoundary>
  );
}

const AppRouter = import.meta.env.PROD ? HashRouter : BrowserRouter;

const App = () => (
  <AppRouter>
    <Routes>
      <Route
        path="/"
        element={
          <SafeRoute>
            <Today />
          </SafeRoute>
        }
      />
      <Route
        path="/focus"
        element={
          <SafeRoute>
            <Mainline />
          </SafeRoute>
        }
      />
      <Route
        path="/drafts"
        element={
          <SafeRoute>
            <DraftBox />
          </SafeRoute>
        }
      />
      <Route
        path="/future"
        element={
          <SafeRoute>
            <FutureSchedule />
          </SafeRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <SafeRoute>
            <Settings />
          </SafeRoute>
        }
      />
      <Route
        path="/week"
        element={
          <SafeRoute>
            <WeeklyFocus />
          </SafeRoute>
        }
      />
      <Route
        path="/month"
        element={
          <SafeRoute>
            <MonthlyFocus />
          </SafeRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <SafeRoute>
            <Roles />
          </SafeRoute>
        }
      />
      <Route
        path="/review"
        element={
          <SafeRoute>
            <Review />
          </SafeRoute>
        }
      />
      <Route
        path="*"
        element={
          <SafeRoute>
            <NotFound />
          </SafeRoute>
        }
      />
    </Routes>
    <BottomNav />
    <Toaster />
  </AppRouter>
);

export default App;
