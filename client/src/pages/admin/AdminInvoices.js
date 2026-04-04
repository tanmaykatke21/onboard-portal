import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import API from "../../services/api";

function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formClientId, setFormClientId] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState([{ description: "", amount: "", quantity: 1 }]);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [invRes, clRes] = await Promise.all([
        API.get("/invoices"),
        API.get("/users?role=client"),
      ]);
      setInvoices(invRes.data.invoices || []);
      setClients(clRes.data.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addItem = () => setFormItems([...formItems, { description: "", amount: "", quantity: 1 }]);
  const removeItem = (i) => setFormItems(formItems.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...formItems];
    updated[i][field] = field === "amount" || field === "quantity" ? Number(value) : value;
    setFormItems(updated);
  };

  const total = formItems.reduce((s, item) => s + (Number(item.amount) * Number(item.quantity) || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const client = clients.find((c) => c._id === formClientId);
      await API.post("/invoices", {
        projectId: client?.projectId,
        clientId: formClientId,
        items: formItems.map((i) => ({ description: i.description, amount: Number(i.amount), quantity: Number(i.quantity) })),
        dueDate: formDueDate,
        notes: formNotes,
      });
      setShowModal(false);
      setFormItems([{ description: "", amount: "", quantity: 1 }]);
      setFormNotes("");
      fetchData();
    } catch (err) { console.error(err); }
    finally { setFormLoading(false); }
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">{invoices.length} total invoices</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-700 transition">+ Create Invoice</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending", count: invoices.filter((i) => i.status === "pending").length, total: invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.total, 0), color: "amber" },
          { label: "Paid", count: invoices.filter((i) => i.status === "paid").length, total: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0), color: "green" },
          { label: "Overdue", count: invoices.filter((i) => i.status === "overdue").length, total: invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.total, 0), color: "red" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.count}</p>
            <p className={`text-xs text-${s.color}-600 mt-1`}>${s.total.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center"><p className="text-gray-400 text-sm">No invoices yet</p></div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              {["Invoice #", "Client", "Amount", "Status", "Due Date", "Created"].map((h) => <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {invoices.map((inv) => {
                const client = clients.find((c) => c._id?.toString() === inv.clientId?.toString());
                return (
                  <tr key={inv._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-sm font-mono font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{client?.name || "—"}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">${inv.total?.toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        inv.status === "paid" ? "bg-green-50 text-green-700" :
                        inv.status === "overdue" ? "bg-red-50 text-red-700" :
                        inv.status === "cancelled" ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700"
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">Create Invoice</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <select value={formClientId} onChange={(e) => setFormClientId(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select client...</option>
                    {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
                {formItems.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input type="text" placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} required
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="number" placeholder="Amount" value={item.amount} onChange={(e) => updateItem(i, "amount", e.target.value)} required min="0" step="0.01"
                      className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} min="1"
                      className="w-16 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                    {formItems.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline mt-1">+ Add item</button>
              </div>

              <div className="text-right text-lg font-bold text-gray-900">Total: ${total.toFixed(2)}</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={formLoading}
                  className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition ${formLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}>
                  {formLoading ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AdminInvoices;
