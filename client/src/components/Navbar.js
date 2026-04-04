import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const adminLinks = [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/clients", label: "Clients" },
    { path: "/admin/agreements", label: "Agreements" },
    { path: "/admin/invoices", label: "Invoices" },
  ];

  const clientLinks = [
    { path: "/portal/dashboard", label: "Dashboard" },
    { path: "/portal/documents", label: "Documents" },
    { path: "/portal/timeline", label: "Timeline" },
    { path: "/portal/deliverables", label: "Deliverables" },
    { path: "/portal/reports", label: "Reports" },
  ];

  const links = isAdmin ? adminLinks : clientLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to={isAdmin ? "/admin/dashboard" : "/portal/dashboard"} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 shadow-lg shadow-blue-600/50"></div>
              <span className="font-bold text-lg text-gray-900">Onboard</span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-md ${
                isAdmin
                  ? "bg-blue-50 text-blue-700"
                  : "bg-teal-50 text-teal-700"
              }`}
            >
              {user.role}
            </span>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user.name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors ml-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
