import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Layout from "../../components/Layout";
import API from "../../services/api";

function ClientList() {
  const { addClient } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  // Add Client form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const { data } = await API.get("/users?role=client");
      setClients(data.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setFormMsg("");
    setFormLoading(true);

    try {
      await addClient(formName, formEmail, formProject, formDate);
      setFormMsg("✅ Client created! Password reset email sent.");
      setFormName(""); setFormEmail(""); setFormProject(""); setFormDate("");
      fetchClients();
      setTimeout(() => { setShowModal(false); setFormMsg(""); }, 2000);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setFormMsg("❌ This email is already registered.");
      } else {
        setFormMsg("❌ " + (err.message || "Failed to create client"));
      }
    } finally {
      setFormLoading(false);
    }
  };

  const filtered = clients.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.project?.projectName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></Layout>;

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} total clients</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <span>+</span> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" placeholder="Search by name, email, or project..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">{search ? "No clients match your search" : "No clients yet"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                {["Client", "Email", "Project", "Status", "Created"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {c.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">{c.email}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{c.project?.projectName || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        c.project?.status === "active" ? "bg-green-50 text-green-700" :
                        c.project?.status === "paused" ? "bg-amber-50 text-amber-700" :
                        c.project?.status === "completed" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"
                      }`}>{c.project?.status || "N/A"}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add New Client</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition">✕</button>
            </div>

            {formMsg && (
              <div className={`mx-5 mt-4 p-3 rounded-lg text-sm ${formMsg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{formMsg}</div>
            )}

            <form onSubmit={handleAddClient} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Sarah Miller" required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="sarah@company.com" required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input type="text" value={formProject} onChange={(e) => setFormProject(e.target.value)} placeholder="Social Media Launch" required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>

              <p className="text-xs text-gray-400">A password reset email will be sent to the client automatically.</p>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={formLoading}
                  className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition ${formLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                  {formLoading ? "Creating..." : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default ClientList;
