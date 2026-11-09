import { useEffect, useMemo, useState } from "react";
import { ClipboardList, PackageCheck, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { EmptyState, ErrorBanner, LoadingBlock } from "../components/StateBlocks";

function money(value) {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  return Number.isNaN(amount) ? value : `Rs. ${amount.toFixed(2)}`;
}

function dateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function ReturnsPage() {
  const [orders, setOrders] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadPage(); }, []);

  const refundTotal = useMemo(
    () => refunds.reduce((sum, refund) => sum + (Number(refund.amount) || 0), 0),
    [refunds]
  );

  async function loadPage() {
    setError("");
    setLoading(true);
    const [ordersResult, refundsResult] = await Promise.allSettled([api.orders(), api.customerRefunds()]);
    if (ordersResult.status === "fulfilled") setOrders(Array.isArray(ordersResult.value) ? ordersResult.value : []);
    else setError(ordersResult.reason instanceof Error ? ordersResult.reason.message : "Orders could not load");
    if (refundsResult.status === "fulfilled") {
      const data = refundsResult.value;
      setRefunds(Array.isArray(data?.refunds) ? data.refunds : Array.isArray(data) ? data : []);
    } else {
      setRefunds([]);
      setError((current) => current || (refundsResult.reason instanceof Error ? refundsResult.reason.message : "Refunds could not load"));
    }
    setLoading(false);
  }

  return (
    <main className="page returns-page">
      <div className="page-heading">
        <div><span className="pill">Customer</span><h1>Returns &amp; Refunds</h1><p className="page-subtitle">Request help directly from an item in your order history.</p></div>
        <button className="icon-button" type="button" onClick={loadPage} title="Refresh returns and refunds"><RefreshCw size={18} /></button>
      </div>
      {error && <ErrorBanner message={error} />}
      {loading && <LoadingBlock label="Loading returns and refunds" />}
      {!loading && <>
        <section className="returns-summary-grid">
          <article><strong>{orders.length}</strong><span>Orders</span></article>
          <article><strong>{refunds.length}</strong><span>Refund requests</span></article>
          <article><strong>{money(refundTotal)}</strong><span>Requested</span></article>
        </section>
        <div className="returns-order-link"><PackageCheck size={20} /><span>Choose the exact item from your orders to request a return or refund.</span><Link className="button compact" to="/orders">View orders</Link></div>
        <section className="table-wrap refund-history-table">
          <div className="table-title"><div className="form-heading"><ClipboardList size={22} /><h2>Refund History</h2></div></div>
          {!refunds.length ? <EmptyState title="No refund requests" text="Requests submitted from your order items will appear here." /> : <table>
            <thead><tr><th>Refund</th><th>Item</th><th>Quantity</th><th>Amount</th><th>Status</th><th>Requested</th><th>Reason</th></tr></thead>
            <tbody>{refunds.map((refund, index) => {
              const id = refund.id ?? refund.refundId;
              const status = refund.status || "PENDING";
              return <tr key={id || index}>
                <td>{id ? `#${id}` : "-"}</td>
                <td>{refund.itemName || refund.ItemName || refund.productName || "Item"}</td>
                <td>{refund.quantity ?? "-"}</td><td>{money(refund.amount)}</td>
                <td><span className={`status status-${String(status).toLowerCase()}`}>{String(status).replaceAll("_", " ")}</span></td>
                <td>{dateTime(refund.createdAt || refund.requestedAt)}</td><td>{refund.rejectionReason || "-"}</td>
              </tr>;
            })}</tbody>
          </table>}
        </section>
      </>}
    </main>
  );
}
