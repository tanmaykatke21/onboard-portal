import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../../components/Layout";
import API from "../../services/api";

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ clients: 0, activeProjects: 0, pendingInvoices: 0, pendingTotal: 0 });
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, invoicesRes] = await Promise.all([
          API.get("/users?role=client"),
          API.get("/invoices").catch(() => ({ data: { invoices: [] } })),
        ]);
        const clients = usersRes.data.users || [];
        const invoices = invoicesRes.data.invoices || [];
        setStats({
          clients: clients.length,
          activeProjects: clients.filter((c) => c.project?.status === "active").length,
          pendingInvoices: invoices.filter((i) => i.status === "pending").length,
          pendingTotal: invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.total, 0),
        });
        setRecentClients(clients.slice(0, 5));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></Layout>;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user?.name?.split(" ")[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your onboarding overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Clients", value: stats.clients, sub: "All time", color: "green" },
          { label: "Active Projects", value: stats.activeProjects, sub: "In progress", color: "green" },
          { label: "Pending Invoices", value: stats.pendingInvoices, sub: `$${stats.pendingTotal.toFixed(2)} outstanding`, color: "gray" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
            <p className={`text-xs mt-1 ${s.color === "green" ? "text-green-600" : "text-gray-400"}`}>{s.sub}</p>
          </div>
        ))}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Action</p>
          <Link to="/admin/clients"><button className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition">+ Add New Client</button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { to: "/admin/clients", icon: "👥", color: "blue", title: "Manage Clients", desc: "Add, view, and manage all clients" },
          { to: "/admin/agreements", icon: "📄", color: "teal", title: "Agreements", desc: "Create and track contracts" },
          { to: "/admin/invoices", icon: "💳", color: "amber", title: "Invoices", desc: "Send and manage payments" },
        ].map((card) => (
          <Link key={card.to} to={card.to} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition">
            <div className={`w-10 h-10 rounded-lg bg-${card.color}-50 flex items-center justify-center mb-3 text-lg`}>{card.icon}</div>
            <h3 className="font-semibold text-gray-900">{card.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Clients</h2>
          <Link to="/admin/clients" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {recentClients.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm mb-3">No clients yet</p>
            <Link to="/admin/clients"><button className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition">+ Add Your First Client</button></Link>
          </div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              {["Client", "Email", "Project", "Status"].map((h) => <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {recentClients.map((c) => (
                <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold">{c.name?.charAt(0)?.toUpperCase()}</div><span className="text-sm font-medium text-gray-900">{c.name}</span></div></td>
                  <td className="px-5 py-3 text-sm text-gray-500 font-mono">{c.email}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{c.project?.projectName || "—"}</td>
                  <td className="px-5 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.project?.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.project?.status || "N/A"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

export default AdminDashboard;
