import { useCallback, useEffect, useState } from "react";
import { ArrowRight, PackageCheck, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { EmptyState, ErrorBanner, LoadingBlock } from "../components/StateBlocks";

const CANCELLABLE_STATUSES = new Set(["PENDING", "PLACED", "CONFIRMED", "PACKED"]);

function formatPrice(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState(null);

  const loadOrders = useCallback(async () => {
    setError("");
    try {
      const data = await api.orders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Orders could not load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function cancelItems(order, itemIds) {
    setBusyOrderId(order.id);
    setError("");
    try {
      await api.cancelOrder(order.id, itemIds);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order could not be cancelled");
    } finally {
      setBusyOrderId(null);
    }
  }

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <span className="pill">History</span>
          <h1>Your orders</h1>
          <p className="page-subtitle">Every purchase, in one clear place.</p>
        </div>
        <PackageCheck size={30} />
      </div>

      {error && <ErrorBanner message={error} />}
      {loading && <LoadingBlock label="Loading orders" />}
      {!loading && !orders.length && (
        <div className="empty-state empty-state-action">
          <ShoppingBag size={26} />
          <h2>Your order history starts here</h2>
          <p>When you check out, order updates and totals will appear here automatically.</p>
          <Link className="button compact" to="/products">Discover products <ArrowRight size={16} /></Link>
        </div>
      )}

      <section className="line-items">
        {orders.map((order) => {
          const items = Array.isArray(order.orderItems) ? order.orderItems : [];
          const activeItems = items.filter((item) => !item.cancelled);
          const status = String(order.status || "PENDING").toUpperCase();
          const canCancel = CANCELLABLE_STATUSES.has(status) && activeItems.length > 0;

          return (
            <article className="line-item order-card" key={order.id}>
              <div className="order-card-heading">
                <div>
                  <h2>Order #{order.id}</h2>
                  <p>{status} · {order.creationTime ? new Date(order.creationTime).toLocaleString() : "Date unavailable"}</p>
                </div>
                <strong>{formatPrice(order.totalPrice)}</strong>
              </div>
              <div className="order-items">
                {items.map((item) => {
                  const title = item.productNameAtPurchase || "Product";
                  const itemTotal = Number(item.priceAtPurchase || 0) * Number(item.quantity || 0);
                  return (
                    <div className="order-item" key={item.id}>
                      <div className="item-copy">
                        {item.imageURL && <img className="item-thumb" src={item.imageURL} alt={title} />}
                        <div>
                          <h3>{title}</h3>
                          <p>{item.cancelled ? "Cancelled" : `Qty ${item.quantity}`} · {formatPrice(item.priceAtPurchase)} each</p>
                        </div>
                      </div>
                      <strong>{formatPrice(itemTotal)}</strong>
                    </div>
                  );
                })}
              </div>
              {canCancel && (
                <div className="order-actions">
                  <button
                    className="button secondary compact"
                    type="button"
                    disabled={busyOrderId === order.id}
                    onClick={() => cancelItems(order, activeItems.map((item) => item.id))}
                  >
                    {busyOrderId === order.id ? "Cancelling…" : "Cancel order"}
                  </button>
                  {activeItems.length > 1 && (
                    <span>To cancel one item, use its item-level action when available.</span>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
