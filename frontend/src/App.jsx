import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Chatbot from "./components/Chatbot/Chatbot";
import "./styles/themes.css";

const CITIZEN_PATHS = [
  "/dashboard", "/citizen/dashboard", "/report", "/my-reports",
  "/heatmap", "/sos", "/support", "/myprofile", "/profile",
];

function CitizenChatbot() {
  const { pathname } = useLocation();
  const show = CITIZEN_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));
  return show ? <Chatbot /> : null;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

// Pages
import Home from "./pages/Home";
import CitizenLogin from "./pages/Citizen/Login";
import CitizenRegister from "./pages/Citizen/Register";
import CitizenDashboard from "./pages/Citizen/Dashboard";
import ReportingCategory from "./pages/Citizen/ReportingCategory";
import ReportingLocation from "./pages/Citizen/ReportingLocation";
import ReportingEvidence from "./pages/Citizen/ReportingEvidence";
import ReportingSubmit from "./pages/Citizen/ReportingSubmit";
import ReportingConfirmation from "./pages/Citizen/ReportingConfirmation";
import Heatmap from "./pages/Citizen/Heatmap";
import SOS from "./pages/Citizen/SOS";
import Support from "./pages/Citizen/Support";
import MyProfile from "./pages/Citizen/MyProfile";
import MyReports from "./pages/Citizen/MyReports";
import EditProfile from "./pages/Citizen/EditProfile";
import Security from "./pages/Citizen/Security";
import Setting from "./pages/Citizen/Setting";
import About from "./pages/Citizen/About";
import Privacy from "./pages/Citizen/Privacy";
import Contact from "./pages/Citizen/Contact";
import Terms from "./pages/Citizen/Terms";
import OfficerDashboard from "./pages/Officer/Dashboard";
import OfficerRecords from "./pages/Officer/Records";
import OfficerPrediction from "./pages/Officer/Prediction";
import OfficerCasesManagement from "./pages/Officer/CasesManagement";
import OfficerCriminal from "./pages/Officer/Criminal";
import OfficerVictim from "./pages/Officer/Victim";
import OfficerCommunication from "./pages/Officer/Communication";
import OfficerLogin from "./pages/Officer/Login";
import OfficerReportDetail from "./pages/Officer/ReportDetail";
import OfficerMyProfile from "./pages/Officer/MyProfile";
import OfficerEditProfile from "./pages/Officer/EditProfile";
import OfficerSetting from "./pages/Officer/Setting";
import AdminLogin from "./pages/Admin/Login";
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminUser from "./pages/Admin/User";
import AdminPermissions from "./pages/Admin/Permissions";
import AdminAudit from "./pages/Admin/Audit";
import AdminDataManagement from "./pages/Admin/DataManagement";
import AdminSystemHealth from "./pages/Admin/SystemHealth";
import AdminProfile from "./pages/Admin/Profile";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>

          {/* ── Landing Page ── */}
          <Route path="/" element={<SettingsProvider><Home /></SettingsProvider>} />

          {/* ── Auth Routes ── */}
          <Route path="/login"        element={<SettingsProvider><CitizenLogin /></SettingsProvider>} />
          <Route path="/login/:role"  element={<SettingsProvider><CitizenLogin /></SettingsProvider>} />
          <Route path="/register"     element={<SettingsProvider><CitizenRegister /></SettingsProvider>} />
          <Route path="/officer/login" element={<OfficerLogin />} />
          <Route path="/admin/login"  element={<AdminLogin />} />
          <Route path="/login/admin"  element={<AdminLogin />} />

          {/* ── Public Footer Pages ── */}
          <Route path="/about"   element={<SettingsProvider><About /></SettingsProvider>} />
          <Route path="/privacy" element={<SettingsProvider><Privacy /></SettingsProvider>} />
          <Route path="/contact" element={<SettingsProvider><Contact /></SettingsProvider>} />
          <Route path="/terms"   element={<SettingsProvider><Terms /></SettingsProvider>} />

          {/* ══════════════════════════════════════
              CITIZEN ROUTES (Protected)
          ══════════════════════════════════════ */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><CitizenDashboard /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/citizen/dashboard" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><CitizenDashboard /></SettingsProvider>
            </ProtectedRoute>
          } />

          {/* Report Flow */}
          <Route path="/report" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><ReportingCategory /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/report/details" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><ReportingLocation /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/report/location" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><ReportingLocation /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/report/evidence" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><ReportingEvidence /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/report/review" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><ReportingSubmit /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/report/confirmation" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><ReportingConfirmation /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/my-reports" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><MyReports /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/heatmap" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><Heatmap /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/sos" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><SOS /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/support" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><Support /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/myprofile" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><MyProfile /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/profile/edit" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><EditProfile /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/profile/security" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><Security /></SettingsProvider>
            </ProtectedRoute>
          } />
          <Route path="/profile/settings" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <SettingsProvider><Setting /></SettingsProvider>
            </ProtectedRoute>
          } />

          {/* ══════════════════════════════════════
              OFFICER ROUTES (Protected)
          ══════════════════════════════════════ */}
          <Route path="/officer/dashboard" element={
            <ProtectedRoute allowedRoles={["officer"]}>
              <OfficerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/officer/records" element={
            <ProtectedRoute allowedRoles={["officer"]}>
              <OfficerRecords />
            </ProtectedRoute>
          } />
          <Route path="/officer/prediction" element={
            <ProtectedRoute allowedRoles={["officer"]}>
              <OfficerPrediction />
            </ProtectedRoute>
          } />
          <Route path="/officer/cases" element={
            <ProtectedRoute allowedRoles={["officer"]}>
              <OfficerCasesManagement />
            </ProtectedRoute>
          } />
          <Route path="/officer/report/:caseId" element={
            <ProtectedRoute allowedRoles={["officer"]}>
              <OfficerReportDetail />
            </ProtectedRoute>
          } />
          <Route path="/officer/criminal" element={
            <ProtectedRoute allowedRoles={["officer"]}>
              <OfficerCriminal />
            </ProtectedRoute>
          } />
          <Route path="/officer/victim" element={
            <ProtectedRoute allowedRoles={["officer"]}>
              <OfficerVictim />
            </ProtectedRoute>
          } />
          <Route path="/officer/communication" element={
            <ProtectedRoute allowedRoles={["officer"]}>
              <OfficerCommunication />
            </ProtectedRoute>
          } />
          <Route path="/officer/profile" element={
            <ProtectedRoute allowedRoles={["officer"]}>
              <OfficerMyProfile />
            </ProtectedRoute>
          } />
          <Route path="/officer/profile/edit" element={
            <ProtectedRoute allowedRoles={["officer"]}>
              <OfficerEditProfile />
            </ProtectedRoute>
          } />
          <Route path="/officer/profile/settings" element={
            <ProtectedRoute allowedRoles={["officer"]}>
              <OfficerSetting />
            </ProtectedRoute>
          } />

          {/* ══════════════════════════════════════
              ADMIN ROUTES (Protected)
          ══════════════════════════════════════ */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/user" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUser />
            </ProtectedRoute>
          } />
          <Route path="/admin/permissions" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPermissions />
            </ProtectedRoute>
          } />
          <Route path="/admin/audit" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAudit />
            </ProtectedRoute>
          } />
          <Route path="/admin/data-management" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDataManagement />
            </ProtectedRoute>
          } />
          {/* Legacy casing support */}
          <Route path="/admin/DataManagement" element={
            <Navigate to="/admin/data-management" replace />
          } />
          <Route path="/admin/system-health" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminSystemHealth />
            </ProtectedRoute>
          } />
          {/* Legacy casing support */}
          <Route path="/admin/SystemHealth" element={
            <Navigate to="/admin/system-health" replace />
          } />

          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminProfile />
            </ProtectedRoute>
          } />

          {/* ── 404 ── */}
          <Route path="*" element={
            <div style={{ textAlign: "center", marginTop: "100px" }}>
              <h1>404</h1>
              <p>Page Not Found</p>
            </div>
          } />

        </Routes>

        <CitizenChatbot />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;