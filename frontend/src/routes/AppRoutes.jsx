import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/routes/ProtectedRoute.jsx";
import RoleRoute from "../components/routes/RoleRoute.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import UserFormPage from "../pages/admin/UserFormPage.jsx";
import UsersPage from "../pages/admin/UsersPage.jsx";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage.jsx";
import LoginPage from "../pages/auth/LoginPage.jsx";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage.jsx";
import SignupPage from "../pages/auth/SignupPage.jsx";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage.jsx";
import BillingPage from "../pages/billing/BillingPage.jsx";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/billing"
      element={
        <ProtectedRoute>
          <BillingPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/users"
      element={
        <RoleRoute roles={["admin", "sub_admin"]}>
          <UsersPage />
        </RoleRoute>
      }
    />
    <Route
      path="/admin/users/new"
      element={
        <RoleRoute roles={["admin"]}>
          <UserFormPage />
        </RoleRoute>
      }
    />
    <Route
      path="/admin/users/:id"
      element={
        <RoleRoute roles={["admin"]}>
          <UserFormPage />
        </RoleRoute>
      }
    />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;
