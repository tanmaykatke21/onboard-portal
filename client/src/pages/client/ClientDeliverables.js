import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Layout from "../../components/Layout";
import API from "../../services/api";

function ClientDeliverables() {
  const { user } = useAuth();
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.projectId) { setLoading(false); return; }
      try {
        const { data } = await API.get(`/deliverables/project/${user.projectId}`);
        setDeliverables(data.deliverables || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDownload = (id, fileName) => {
    window.open(`http://localhost:5000/api/deliverables/${id}/download`, "_blank");
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></Layout>;

  const categories = [...new Set(deliverables.map((d) => d.category))];

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Deliverables</h1>
      <p className="text-gray-500 text-sm mb-6">{deliverables.length} files available</p>

      {deliverables.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-gray-400">No deliverables yet. Files will appear here when your admin uploads them.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {deliverables.filter((d) => d.category === cat).map((d) => (
                  <div key={d._id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-blue-300 transition">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">
                      {d.fileName?.split(".").pop()?.toUpperCase() || "FILE"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{d.fileName}</h3>
                      <p className="text-xs text-gray-400">{formatSize(d.fileSize)} • {new Date(d.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDownload(d._id, d.fileName)}
                      className="text-sm text-blue-600 font-medium hover:underline flex-shrink-0">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

export default ClientDeliverables;
