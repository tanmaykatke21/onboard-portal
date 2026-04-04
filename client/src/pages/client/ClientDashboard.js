import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Layout from "../../components/Layout";
import API from "../../services/api";

function ClientDashboard() {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({ agreements: 0, pendingInvoices: 0, tasks: 0, deliverables: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.projectId) {
          const [projRes, agRes, invRes, tlRes, delRes] = await Promise.all([
            API.get(`/projects/${user.projectId}`),
            API.get(`/agreements/project/${user.projectId}`).catch(() => ({ data: { agreements: [] } })),
            API.get(`/invoices/project/${user.projectId}`).catch(() => ({ data: { invoices: [] } })),
            API.get(`/timeline/project/${user.projectId}`).catch(() => ({ data: { tasks: [] } })),
            API.get(`/deliverables/project/${user.projectId}`).catch(() => ({ data: { deliverables: [] } })),
          ]);
          setProject(projRes.data.project);
          setStats({
            agreements: agRes.data.agreements?.filter((a) => a.status === "pending").length || 0,
            pendingInvoices: invRes.data.invoices?.filter((i) => i.status === "pending").length || 0,
            tasks: tlRes.data.tasks?.filter((t) => t.status !== "completed").length || 0,
            deliverables: delRes.data.deliverables?.length || 0,
          });
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></Layout>;

  return (
    <Layout>
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100 rounded-xl p-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(" ")[0]}</h1>
          <p className="text-gray-500 text-sm mt-1">{project?.projectName || "No project assigned"}</p>
        </div>
        {project && <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${project.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{project.status}</span>}
      </div>

      {project && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase">Current Phase</p>
            <p className="text-lg font-bold text-gray-900 mt-2">{project.currentPhase}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase">Pending Actions</p>
            <p className="text-lg font-bold text-gray-900 mt-2">{stats.agreements + stats.pendingInvoices}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase">Start Date</p>
            <p className="text-lg font-bold text-gray-900 mt-2">{project.startDate ? new Date(project.startDate).toLocaleDateString() : "TBD"}</p>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Portal</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { to: "/portal/documents", icon: "📄", title: "Documents", desc: "Agreements & Invoices", badge: stats.agreements + stats.pendingInvoices },
          { to: "/portal/timeline", icon: "⏱", title: "Timeline", desc: "Track progress", badge: stats.tasks },
          { to: "/portal/deliverables", icon: "📦", title: "Deliverables", desc: "Download files", badge: stats.deliverables },
          { to: "/portal/reports", icon: "📊", title: "Reports", desc: "Monthly performance", badge: 0 },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition relative">
            <div className="text-2xl mb-3">{c.icon}</div>
            <h3 className="font-semibold text-gray-900">{c.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{c.desc}</p>
            {c.badge > 0 && <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{c.badge}</span>}
          </Link>
        ))}
      </div>
    </Layout>
  );
}

export default ClientDashboard;
