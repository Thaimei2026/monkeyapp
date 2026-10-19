import { useEffect, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { EmptyState, ErrorBanner, LoadingBlock } from "../components/StateBlocks";
import SellerSectionNav from "../components/SellerSectionNav";

const SELLER_STATUS_TRANSITIONS = {
  PLACED: ["CONFIRMED", "REJECTED"],
  CONFIRMED: ["PACKED"]
};

function label(value = "") {
  return String(value || "").replaceAll("_", " ");
}

function money(value) {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return `Rs. ${amount.toFixed(2)}`;
}

function orderId(order) {
  return order?.orderId ?? order?.id;
}

function orderItems(order) {
  const items = order?.items ?? order?.orderItems;
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    key: item?.id ?? `${item?.productName ?? item?.name ?? "product"}-${index}`,
    name: item?.productName || item?.name || "Unnamed product",
    quantity: item?.quantity ?? item?.quntity ?? item?.qty ?? null
  }));
}

function orderStatus(order) {
  const value = order?.status ?? order?.orderStatus ?? order?.order_status;
  if (value && typeof value === "object") {
    return String(value.name ?? value.value ?? "").trim().toUpperCase();
  }
  return String(value ?? "").trim().toUpperCase();
}

function sellerStatusHint(status) {
  return status === "PENDING" ? "Waiting for payment" : "No further action";
}

function storeId(store) {
  return store?.storeId ?? store?.id;
}

function storeName(store) {
  return store?.storeName || store?.name || `Store #${storeId(store) || "-"}`;
}

function pageState() {
  return { first: true, last: true, number: 0 };
}

export default function SellerOrdersPage() {
  const [stores, setStores] = useState([]);
  const [orders, setOrders] = useState([]);
  const [storeFilter, setStoreFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState(pageState);
  const [storesLoading, setStoresLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadSellerStores();
  }, []);

  useEffect(() => {
    loadSellerOrders();
  }, [page, storeFilter]);

  async function loadSellerStores() {
    setStoresLoading(true);
    try {
      const data = await api.sellerStores();
      setStores(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seller stores could not load");
    } finally {
      setStoresLoading(false);
    }
  }

  async function loadSellerOrders(storeIdValue = storeFilter, pageValue = page) {
    setError("");
    setOrdersLoading(true);

    try {
      const data = storeIdValue
        ? await api.sellerStoreOrdersSlice(storeIdValue, pageValue)
        : await api.sellerOrdersSlice(pageValue);

      setOrders(Array.isArray(data.content) ? data.content : []);
      setPageInfo({
        first: data.first ?? pageValue === 0,
        last: data.last ?? true,
        number: data.number ?? pageValue
      });
    } catch (err) {
      setOrders([]);
      setPageInfo(pageState());
      setError(err instanceof Error ? err.message : "Seller orders could not load");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function refreshOrders() {
    await Promise.all([loadSellerStores(), loadSellerOrders()]);
  }

  async function updateOrderStatus(order, nextStatus) {
    const id = orderId(order);
    const currentStatus = orderStatus(order);
    const allowedStatuses = SELLER_STATUS_TRANSITIONS[currentStatus] || [];

    if (!id) {
      setError("Order id is missing from this row.");
      return;
    }

    if (!allowedStatuses.includes(nextStatus)) {
      setError(`This order cannot be changed from ${label(currentStatus || "unknown").toLowerCase()} to ${label(nextStatus).toLowerCase()}.`);
      return;
    }

    setError("");
    setNotice("");
    setSavingOrderId(id);

    try {
      await api.updateSellerOrderStatus(id, nextStatus);
      setOrders((current) =>
        current.map((item) =>
          String(orderId(item)) === String(id) ? { ...item, status: nextStatus, orderStatus: nextStatus } : item
        )
      );
      setStatusDrafts((current) => ({ ...current, [id]: "" }));
      setNotice(`Order #${id} is now ${label(nextStatus).toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order status could not be updated");
    } finally {
      setSavingOrderId(null);
    }
  }

  return (
    <main className="page seller-orders-page">
      <div className="page-heading">
        <div>
          <span className="pill">Seller</span>
          <h1>Order management</h1>
          <p className="page-subtitle">Review the products and quantities in each order, then update its status.</p>
        </div>
        <div className="seller-orders-header-actions">
          <button className="icon-button" type="button" onClick={refreshOrders} title="Refresh orders">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <SellerSectionNav />

      {error && <ErrorBanner message={error} />}
      {notice && <div className="banner success">{notice}</div>}

      <section className="table-wrap seller-orders-table seller-orders-page-table">
        <div className="table-title seller-orders-title">
          <div className="form-heading">
            <ClipboardList size={22} />
            <h2>Orders</h2>
          </div>
        </div>

        <div className="seller-product-tools seller-order-tools">
          <label>
            Store
            <select
              value={storeFilter}
              onChange={(event) => {
                setStoreFilter(event.target.value);
                setPage(0);
              }}
              disabled={!stores.length || storesLoading || ordersLoading}
            >
              <option value="">All stores</option>
              {stores.map((store) => (
                <option key={storeId(store)} value={storeId(store)}>
                  {storeName(store)}
                </option>
              ))}
            </select>
          </label>
          <span className="table-count">{orders.length} loaded</span>
        </div>

        {ordersLoading && <LoadingBlock label="Loading seller orders" />}
        {!ordersLoading && !orders.length && <EmptyState title="No orders yet" text="Orders for your stores will appear here." />}
        {!ordersLoading && !!orders.length && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Products</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Update status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, orderIndex) => {
                  const id = orderId(order);
                  const currentStatus = orderStatus(order) || "UNKNOWN";
                  const allowedStatuses = SELLER_STATUS_TRANSITIONS[currentStatus] || [];
                  const selectedStatus = statusDrafts[id] || "";
                  const items = orderItems(order);
                  const isSaving = String(savingOrderId) === String(id);

                  return (
                    <tr key={id ?? `order-${page}-${orderIndex}`}>
                      <td>{id != null ? `#${id}` : "-"}</td>
                      <td>
                        {items.length ? (
                          <ul className="seller-order-items">
                            {items.map((item) => (
                              <li key={item.key}>
                                <span>{item.name}</span>
                                <strong>{item.quantity == null ? "Qty unavailable" : `Qty ${item.quantity}`}</strong>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="seller-order-items-empty">Product details unavailable</span>
                        )}
                      </td>
                      <td>{money(order.totalPrice)}</td>
                      <td>
                        <span className={`status status-${String(currentStatus).toLowerCase()}`}>
                          {label(currentStatus)}
                        </span>
                      </td>
                      <td>
                        {allowedStatuses.length ? (
                          <div className="seller-order-actions">
                            <select
                              value={selectedStatus}
                              onChange={(event) =>
                                setStatusDrafts((current) => ({ ...current, [id]: event.target.value }))
                              }
                              disabled={isSaving || !id}
                              aria-label={`Choose a new status for order ${id || ""}`}
                            >
                              <option value="">Choose status</option>
                              {allowedStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {label(status)}
                                </option>
                              ))}
                            </select>
                            <button
                              className="button compact"
                              type="button"
                              onClick={() => updateOrderStatus(order, selectedStatus)}
                              disabled={isSaving || !id || !allowedStatuses.includes(selectedStatus)}
                              aria-label={`Update order ${id || ""} status`}
                            >
                              {isSaving ? "Saving..." : "Update"}
                            </button>
                          </div>
                        ) : (
                          <span className="seller-order-no-action">{sellerStatusHint(currentStatus)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="pager">
              <button
                className="button compact"
                type="button"
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                disabled={pageInfo.first || ordersLoading}
              >
                Previous
              </button>
              <span>Page {pageInfo.number + 1}</span>
              <button
                className="button compact"
                type="button"
                onClick={() => setPage((value) => value + 1)}
                disabled={pageInfo.last || ordersLoading}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
