import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { EmptyState, ErrorBanner, LoadingBlock } from "../components/StateBlocks";
import SellerSectionNav from "../components/SellerSectionNav";

function money(value) {
  const amount = Number(value);
  return value === null || value === undefined || value === "" || Number.isNaN(amount)
    ? "-"
    : `Rs. ${amount.toFixed(2)}`;
}

function dateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function SellerRefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { loadRefunds(); }, []);

  async function loadRefunds() {
    setError("");
    setLoading(true);
    try {
      const data = await api.sellerRefunds();
      setRefunds(Array.isArray(data?.refundResponseList) ? data.refundResponseList : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund requests could not load");
    } finally {
      setLoading(false);
    }
  }

  async function updateRefund(refund, action) {
    const id = refund.id;
    if (id == null) return;
    let reason;
    if (action === "reject") {
      reason = window.prompt("Reason for rejecting this refund:")?.trim();
      if (!reason) return;
    }
    setError("");
    setNotice("");
    setBusyId(id);
    try {
      const response = action === "approve"
        ? await api.approveSellerRefund(id)
        : await api.rejectSellerRefund(id, reason);
      setNotice(response?.message || `Refund ${action}d.`);
      await loadRefunds();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Refund could not be ${action}d`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="page seller-page">
      <SellerSectionNav />
      <div className="page-heading">
        <div><span className="pill">Seller workspace</span><h1>Refund requests</h1></div>
        <button className="icon-button" type="button" onClick={loadRefunds} title="Refresh refund requests"><RefreshCw size={18} /></button>
      </div>
      {error && <ErrorBanner message={error} />}
      {notice && <div className="banner success">{notice}</div>}
      {loading && <LoadingBlock label="Loading refund requests" />}
      {!loading && !refunds.length && <EmptyState title="No refund requests" text="Refund requests for your orders will appear here." />}
      {!loading && !!refunds.length && <section className="table-wrap">
        <div className="table-title"><div className="form-heading"><ClipboardList size={22} /><h2>Refunds</h2></div></div>
        <table><thead><tr><th>Refund</th><th>Item</th><th>Qty</th><th>Amount</th><th>Status</th><th>Requested</th><th>Reason</th><th>Actions</th></tr></thead>
          <tbody>{refunds.map((refund) => {
            const id = refund.id;
            const pending = String(refund.status || "").toUpperCase() === "PENDING";
            return <tr key={id}>
              <td>#{id}</td><td>{refund.ItemName || refund.itemName || "Item"}</td><td>{refund.quantity ?? "-"}</td>
              <td>{money(refund.amount)}</td>
              <td><span className={`status status-${String(refund.status || "pending").toLowerCase()}`}>{String(refund.status || "PENDING").replaceAll("_", " ")}</span></td>
              <td>{dateTime(refund.requestedAt || refund.createdAt)}</td><td>{refund.rejectionReason || "-"}</td>
              <td>{pending && <div className="admin-toolbar">
                <button className="button compact" type="button" disabled={busyId === id} onClick={() => updateRefund(refund, "approve")}>Approve</button>
                <button className="button danger-subtle compact" type="button" disabled={busyId === id} onClick={() => updateRefund(refund, "reject")}>Reject</button>
              </div>}</td>
            </tr>;
          })}</tbody>
        </table>
      </section>}
    </main>
  );
}
