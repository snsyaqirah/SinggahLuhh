import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import InstallPrompt from "@/components/InstallPrompt";
import FeedbackButton from "@/components/FeedbackButton";
import Index from "./pages/Index";
import BrowseMasjid from "./pages/BrowseMasjid";
import MasjidDetail from "./pages/MasjidDetail";
import TrackingDashboard from "./pages/TrackingDashboard";
import AddMasjid from "./pages/AddMasjid";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import MapView from "./pages/MapView";
import Bookmarks from "./pages/Bookmarks";
import IbadahSaya from "./pages/IbadahSaya";
import PrayerGroups from "./pages/PrayerGroups";
import PrayerGroupDetail from "./pages/PrayerGroupDetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import FAQ from "./pages/FAQ";
import Changelog from "./pages/Changelog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPrompt />
        <FeedbackButton />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/browse" element={<BrowseMasjid />} />
            <Route path="/masjid/:id" element={<MasjidDetail />} />
            <Route path="/tracking" element={<TrackingDashboard />} />
            <Route path="/add" element={<AddMasjid />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/ibadah" element={<IbadahSaya />} />
            <Route path="/groups" element={<PrayerGroups />} />
            <Route path="/groups/:id" element={<PrayerGroupDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
