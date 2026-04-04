import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Layout from "../../components/Layout";
import API from "../../services/api";

function ClientDocuments() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("agreements");
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(null);
  const [signName, setSignName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.projectId) { setLoading(false); return; }
      try {
        const [agRes, invRes] = await Promise.all([
          API.get(`/agreements/project/${user.projectId}`),
          API.get(`/invoices/project/${user.projectId}`),
        ]);
        setAgreements(agRes.data.agreements || []);
        setInvoices(invRes.data.invoices || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  const handleSign = async (agreementId) => {
    if (!signName.trim()) return;
    try {
      await API.put(`/agreements/${agreementId}/sign`, { signatureName: signName });
      setAgreements(agreements.map((a) => a._id === agreementId ? { ...a, status: "signed", signedAt: new Date().toISOString(), signatureName: signName } : a));
      setSigning(null);
      setSignName("");
    } catch (err) { console.error(err); }
  };

  const handlePay = async (invoiceId) => {
    try {
      const { data } = await API.post("/stripe/create-payment-intent", { invoiceId });
      alert(`Payment intent created! Amount: $${data.amount}\nIn production, this would open Stripe Checkout.\nFor now, marking as paid.`);
      await API.post("/stripe/payment-success", { invoiceId, paymentIntentId: "test_" + Date.now() });
      setInvoices(invoices.map((i) => i._id === invoiceId ? { ...i, status: "paid", paidAt: new Date().toISOString() } : i));
    } catch (err) {
      console.error(err);
      alert("Payment failed: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></Layout>;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Documents</h1>

      <div className="flex gap-2 mb-6">
        {["agreements", "invoices"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({t === "agreements" ? agreements.length : invoices.length})
          </button>
        ))}
      </div>

      {/* Agreements Tab */}
      {tab === "agreements" && (
        <div className="space-y-4">
          {agreements.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><p className="text-gray-400">No agreements yet</p></div>
          ) : agreements.map((a) => (
            <div key={a._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{a.title}</h3>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.status === "signed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{a.status}</span>
              </div>
              {a.terms?.length > 0 && (
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  {a.terms.map((term, i) => <li key={i} className="flex gap-2"><span className="text-gray-300">•</span>{term}</li>)}
                </ul>
              )}
              {a.status === "pending" && (
                signing === a._id ? (
                  <div className="flex gap-2 items-center">
                    <input type="text" value={signName} onChange={(e) => setSignName(e.target.value)} placeholder="Type your full name to sign"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <button onClick={() => handleSign(a._id)} className="bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700">Confirm</button>
                    <button onClick={() => setSigning(null)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setSigning(a._id)} className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700">Sign Agreement</button>
                )
              )}
              {a.status === "signed" && <p className="text-xs text-gray-400">Signed by {a.signatureName} on {new Date(a.signedAt).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Invoices Tab */}
      {tab === "invoices" && (
        <div className="space-y-4">
          {invoices.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><p className="text-gray-400">No invoices yet</p></div>
          ) : invoices.map((inv) => (
            <div key={inv._id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{inv.invoiceNumber}</h3>
                  {inv.dueDate && <p className="text-xs text-gray-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">${inv.total?.toFixed(2)}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${inv.status === "paid" ? "bg-green-50 text-green-700" : inv.status === "overdue" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{inv.status}</span>
                </div>
              </div>
              {inv.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-600 py-1 border-b border-gray-50">
                  <span>{item.description}</span>
                  <span>${(item.amount * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              {inv.status === "pending" && (
                <button onClick={() => handlePay(inv._id)} className="mt-4 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-700">Pay Now</button>
              )}
              {inv.status === "paid" && <p className="text-xs text-green-600 mt-3">Paid on {new Date(inv.paidAt).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

export default ClientDocuments;
