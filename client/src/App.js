import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientList from "./pages/admin/ClientList";
import AdminAgreements from "./pages/admin/AdminAgreements";
import AdminInvoices from "./pages/admin/AdminInvoices";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientDocuments from "./pages/client/ClientDocuments";
import ClientTimeline from "./pages/client/ClientTimeline";
import ClientDeliverables from "./pages/client/ClientDeliverables";
import ClientReports from "./pages/client/ClientReports";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/clients" element={<ProtectedRoute role="admin"><ClientList /></ProtectedRoute>} />
          <Route path="/admin/agreements" element={<ProtectedRoute role="admin"><AdminAgreements /></ProtectedRoute>} />
          <Route path="/admin/invoices" element={<ProtectedRoute role="admin"><AdminInvoices /></ProtectedRoute>} />
          <Route path="/portal/dashboard" element={<ProtectedRoute role="client"><ClientDashboard /></ProtectedRoute>} />
          <Route path="/portal/documents" element={<ProtectedRoute role="client"><ClientDocuments /></ProtectedRoute>} />
          <Route path="/portal/timeline" element={<ProtectedRoute role="client"><ClientTimeline /></ProtectedRoute>} />
          <Route path="/portal/deliverables" element={<ProtectedRoute role="client"><ClientDeliverables /></ProtectedRoute>} />
          <Route path="/portal/reports" element={<ProtectedRoute role="client"><ClientReports /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
