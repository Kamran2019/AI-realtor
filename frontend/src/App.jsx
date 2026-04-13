import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { bootstrapAuth, clearSession, setSession } from "./features/auth/authSlice";
import { configureApiClient } from "./api/client";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import AppShell from "./layouts/AppShell";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import OAuthSuccessPage from "./pages/auth/OAuthSuccessPage";
import DashboardPage from "./pages/DashboardPage";
import PropertiesPage from "./pages/properties/PropertiesPage";
import PropertyDetailPage from "./pages/properties/PropertyDetailPage";
import AlertsPage from "./pages/AlertsPage";
import NotificationsPage from "./pages/NotificationsPage";
import InspectionsPage from "./pages/inspections/InspectionsPage";
import InspectionDetailPage from "./pages/inspections/InspectionDetailPage";
import ReportsPage from "./pages/reports/ReportsPage";
import ReportDetailPage from "./pages/reports/ReportDetailPage";
import PublicReportPage from "./pages/reports/PublicReportPage";
import BillingPage from "./pages/BillingPage";
import SettingsPage from "./pages/SettingsPage";
import UsersAdminPage from "./pages/admin/UsersAdminPage";
import ScrapeAdminPage from "./pages/admin/ScrapeAdminPage";
import AuditAdminPage from "./pages/admin/AuditAdminPage";

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    configureApiClient({
      handleSessionExpired: () => dispatch(clearSession()),
      handleSessionRefresh: (data) =>
        dispatch(
          setSession({
            user: data.user,
            account: data.account,
          })
        ),
    });
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/oauth-success" element={<OAuthSuccessPage />} />
      </Route>

      <Route path="/public/reports/:token" element={<PublicReportPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/inspections" element={<InspectionsPage />} />
          <Route path="/inspections/:id" element={<InspectionDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route element={<AppShell />}>
          <Route path="/admin/users" element={<UsersAdminPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["admin", "sub_admin"]} />}>
        <Route element={<AppShell />}>
          <Route path="/admin/scrape" element={<ScrapeAdminPage />} />
          <Route path="/admin/audit" element={<AuditAdminPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
