import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import API from "../../services/api";

function AdminAgreements() {
  const [agreements, setAgreements] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formClientId, setFormClientId] = useState("");
  const [formTitle, setFormTitle] = useState("Service Agreement");
  const [formContent, setFormContent] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [agRes, clRes] = await Promise.all([
        API.get("/agreements"),
        API.get("/users?role=client"),
      ]);
      setAgreements(agRes.data.agreements || []);
      setClients(clRes.data.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const client = clients.find((c) => c._id === formClientId);
      await API.post("/agreements", {
        projectId: client?.projectId,
        clientId: formClientId,
        title: formTitle,
        content: formContent,
        terms: formContent.split("\n").filter((t) => t.trim()),
      });
      setShowModal(false);
      setFormContent("");
      fetchData();
    } catch (err) { console.error(err); }
    finally { setFormLoading(false); }
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agreements</h1>
          <p className="text-gray-500 text-sm mt-1">{agreements.length} total agreements</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-700 transition">+ Create Agreement</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {agreements.length === 0 ? (
          <div className="p-12 text-center"><p className="text-gray-400 text-sm">No agreements yet</p></div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              {["Title", "Client", "Status", "Created", "Signed"].map((h) => <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {agreements.map((a) => {
                const client = clients.find((c) => c._id?.toString() === a.clientId?.toString());
                return (
                  <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{a.title}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">{client?.name || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        a.status === "signed" ? "bg-green-50 text-green-700" :
                        a.status === "declined" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">{a.signedAt ? new Date(a.signedAt).toLocaleDateString() : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Create Agreement</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select value={formClientId} onChange={(e) => setFormClientId(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select client...</option>
                  {clients.map((c) => <option key={c._id} value={c._id}>{c.name} — {c.project?.projectName || "No project"}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms (one per line)</label>
                <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={6} placeholder="Enter each term on a new line..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formLoading}
                  className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition ${formLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}>
                  {formLoading ? "Creating..." : "Create Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AdminAgreements;
