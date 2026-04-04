import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Layout from "../../components/Layout";
import API from "../../services/api";

function ClientReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.projectId) { setLoading(false); return; }
      try {
        const { data } = await API.get(`/reports/project/${user.projectId}`);
        setReports(data.reports || []);
        if (data.reports?.length > 0) setSelectedReport(data.reports[0]);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-400">No reports yet. Monthly reports will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report List */}
          <div className="lg:col-span-1 space-y-2">
            {reports.map((r) => (
              <button key={r._id} onClick={() => setSelectedReport(r)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  selectedReport?._id === r._id ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:border-gray-300"
                }`}>
                <p className="text-sm font-semibold text-gray-900">{r.month} {r.year}</p>
                <p className={`text-xs mt-0.5 ${r.status === "published" ? "text-green-600" : "text-gray-400"}`}>{r.status}</p>
              </button>
            ))}
          </div>

          {/* Report Detail */}
          {selectedReport && (
            <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{selectedReport.month} {selectedReport.year} Report</h2>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${selectedReport.status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{selectedReport.status}</span>
              </div>

              {selectedReport.overview && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Overview</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedReport.overview}</p>
                </div>
              )}

              {selectedReport.metrics && Object.keys(selectedReport.metrics).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Metrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(selectedReport.metrics).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                        <p className="text-lg font-bold text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReport.highlights?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Highlights</h3>
                  <ul className="space-y-1">
                    {selectedReport.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-green-500">✓</span>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReport.nextSteps?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Next Steps</h3>
                  <ul className="space-y-1">
                    {selectedReport.nextSteps.map((s, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-blue-500">→</span>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

export default ClientReports;
