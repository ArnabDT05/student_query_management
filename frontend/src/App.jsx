import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { LoginPage } from "./pages/LoginPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { StudentNewQuery } from "./pages/StudentNewQuery";
import { StudentTickets } from "./pages/StudentTickets";
import { StudentTicketDetail } from "./pages/StudentTicketDetail";
import { StaffDashboard } from "./pages/StaffDashboard";
import { StaffTickets } from "./pages/StaffTickets";
import { StaffTicketDetail } from "./pages/StaffTicketDetail";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminTickets } from "./pages/AdminTickets";
import { AdminCategories } from "./pages/AdminCategories";
import { AdminReports } from "./pages/AdminReports";
import { AdminUsers } from "./pages/AdminUsers";
import { ProfilePage } from "./pages/ProfilePage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "sonner";

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Toaster position="top-center" richColors />
          <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes - Role based */}
          <Route element={<DashboardLayout allowedRoles={["student"]} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/new-query" element={<StudentNewQuery />} />
            <Route path="/student/tickets" element={<StudentTickets />} />
            <Route path="/student/tickets/:id" element={<StudentTicketDetail />} />
            <Route path="/student/profile" element={<ProfilePage />} />
          </Route>

          <Route element={<DashboardLayout allowedRoles={["staff"]} />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/tickets" element={<StaffTickets />} />
            <Route path="/staff/tickets/:id" element={<StaffTicketDetail />} />
            <Route path="/staff/profile" element={<ProfilePage />} />
          </Route>

          <Route element={<DashboardLayout allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback routing */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
     </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
