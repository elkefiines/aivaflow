import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/hooks/useLanguage";
import AuthGuard from "@/components/auth/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";
import PageLoader from "@/components/shared/PageLoader";

// Eager: landing + auth (fast first paint)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy: heavier authenticated pages
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Ideas = lazy(() => import("./pages/Ideas"));
const Reports = lazy(() => import("./pages/Reports"));
const Team = lazy(() => import("./pages/Team"));
const Settings = lazy(() => import("./pages/Settings"));
const Messages = lazy(() => import("./pages/Messages"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Analytics = lazy(() => import("./pages/Analytics"));
const FocusMode = lazy(() => import("./pages/FocusMode"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const ActivityFeed = lazy(() => import("./pages/ActivityFeed"));
const GanttChart = lazy(() => import("./pages/GanttChart"));
const Goals = lazy(() => import("./pages/Goals"));
const Automations = lazy(() => import("./pages/Automations"));
const TeamMood = lazy(() => import("./pages/TeamMood"));
const MyStats = lazy(() => import("./pages/MyStats"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const lazyRoute = (El: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<PageLoader />}>
    <El />
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<AuthGuard>{lazyRoute(Onboarding)}</AuthGuard>} />
              <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
                <Route path="/dashboard" element={lazyRoute(Dashboard)} />
                <Route path="/tasks" element={lazyRoute(Tasks)} />
                <Route path="/ideas" element={lazyRoute(Ideas)} />
                <Route path="/reports" element={lazyRoute(Reports)} />
                <Route path="/team" element={lazyRoute(Team)} />
                <Route path="/messages" element={lazyRoute(Messages)} />
                <Route path="/calendar" element={lazyRoute(Calendar)} />
                <Route path="/analytics" element={lazyRoute(Analytics)} />
                <Route path="/focus" element={lazyRoute(FocusMode)} />
                <Route path="/member/:userId" element={lazyRoute(MemberProfile)} />
                <Route path="/activity" element={lazyRoute(ActivityFeed)} />
                <Route path="/gantt" element={lazyRoute(GanttChart)} />
                <Route path="/goals" element={lazyRoute(Goals)} />
                <Route path="/automations" element={lazyRoute(Automations)} />
                <Route path="/team-mood" element={lazyRoute(TeamMood)} />
                <Route path="/my-stats" element={lazyRoute(MyStats)} />
                <Route path="/settings" element={lazyRoute(Settings)} />
              </Route>
              <Route path="/admin" element={<AuthGuard>{lazyRoute(AdminPanel)}</AuthGuard>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
