import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Package,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Store,
  UsersRound
} from "lucide-react";
import { api } from "../lib/api";
import { EmptyState, ErrorBanner, LoadingBlock } from "../components/StateBlocks";

const userStatusOptions = ["ACTIVE", "DEACTIVATED", "DELETED"];
const storeStatusOptions = ["ACCEPTED", "PENDING", "REJECTED"];
const productStatusOptions = ["ACTIVE", "DISABLED"];

const userViews = {
  customers: {
    label: "Customers",
    load: api.adminUsers,
    empty: "Customer accounts from the backend will appear here."
  },
  sellers: {
    label: "Sellers",
    load: api.adminSellers,
    empty: "Seller accounts from the backend will appear here."
  }
};

const sections = [
  { key: "users", label: "Users", icon: UsersRound },
  { key: "sellers", label: "Stores", icon: Store },
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "refunds", label: "Refunds", icon: RotateCcw }
];

function label(value = "") {
  return String(value || "").replaceAll("_", " ");
}

function money(value) {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "USD"
  });
}

function dateTime(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function userId(user) {
  return user?.id ?? user?.userId;
}

function username(user) {
  return user?.username || user?.userName || "Unknown";
}

function storeId(store) {
  return store?.storeId ?? store?.id;
}

function storeName(store) {
  return store?.name || store?.storeName || `Store #${storeId(store) || "-"}`;
}

function storeStatus(store) {
  return store?.status || store?.storeStatus || "PENDING";
}

function productId(product) {
  return product?.productId ?? product?.id;
}

function productStoreId(product) {
  return product?.storeId ?? product?.store?.storeId ?? product?.storeModel?.storeId;
}

function productStatus(product) {
  return product?.productStatus || product?.status || "UNKNOWN";
}

function pageState() {
  return { first: true, last: true, number: 0 };
}

export default function AdminPage() {
  const [section, setSection] = useState("users");
  const [users, setUsers] = useState([]);
  const [userView, setUserView] = useState("customers");
  const [userPage, setUserPage] = useState(0);
  const [userPageInfo, setUserPageInfo] = useState(pageState);
  const [usersLoading, setUsersLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);

  const [sellers, setSellers] = useState([]);
  const [sellerPage, setSellerPage] = useState(0);
  const [sellerPageInfo, setSellerPageInfo] = useState(pageState);
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [sellersLoading, setSellersLoading] = useState(false);
  const [sellerDetailsLoading, setSellerDetailsLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [sellerOrdersPage, setSellerOrdersPage] = useState(0);
  const [sellerOrdersPageInfo, setSellerOrdersPageInfo] = useState(pageState);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [savingStoreId, setSavingStoreId] = useState(null);
  const [bulkProductStatus, setBulkProductStatus] = useState("ACTIVE");
  const [bulkSaving, setBulkSaving] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersPageInfo, setOrdersPageInfo] = useState(pageState);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [refunds, setRefunds] = useState([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [savingRefundId, setSavingRefundId] = useState(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedSeller = useMemo(
    () => sellers.find((seller) => String(userId(seller)) === String(selectedSellerId)),
    [selectedSellerId, sellers]
  );

  const visibleProducts = useMemo(() => {
    if (!selectedStoreId) return products;

    const productsWithStore = products.filter((product) => productStoreId(product));
    if (!productsWithStore.length) return products;

    return products.filter((product) => String(productStoreId(product)) === String(selectedStoreId));
  }, [products, selectedStoreId]);

  useEffect(() => {
    if (section === "users") {
      loadUsers();
    }
  }, [section, userPage, userView]);

  useEffect(() => {
    if (section === "sellers") {
      loadSellers();
    }
  }, [section, sellerPage]);

  useEffect(() => {
    if (section === "orders") {
      loadOrders();
    }
  }, [section, ordersPage]);

  useEffect(() => {
    if (section === "refunds") loadRefunds();
  }, [section]);

  useEffect(() => {
    if (section === "sellers" && selectedSellerId) {
      loadSellerDetails(selectedSellerId, sellerOrdersPage);
    }
  }, [section, selectedSellerId, sellerOrdersPage]);

  async function loadUsers() {
    setError("");
    setUsersLoading(true);

    try {
      const data = await userViews[userView].load(userPage);
      setUsers(data.content);
      setUserPageInfo({
        first: data.first,
        last: data.last,
        number: data.number
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Users could not load");
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadSellers() {
    setError("");
    setSellersLoading(true);

    try {
      const data = await api.adminSellers(sellerPage);
      setSellers(data.content);
      setSellerPageInfo({
        first: data.first,
        last: data.last,
        number: data.number
      });

      const sellerStillVisible = data.content.some((seller) => String(userId(seller)) === String(selectedSellerId));

      if (data.content.length && (!selectedSellerId || !sellerStillVisible)) {
        setSellerOrdersPage(0);
        setSelectedSellerId(String(userId(data.content[0])));
      }

      if (!data.content.length) {
        setSelectedSellerId("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sellers could not load");
    } finally {
      setSellersLoading(false);
    }
  }

  async function loadSellerDetails(sellerId, orderPage = 0) {
    setError("");
    setSellerDetailsLoading(true);
    setSelectedProductIds([]);

    try {
      const [sellerStores, sellerProducts, sellerOrdersData] = await Promise.all([
        api.adminSellerStores(sellerId),
        api.adminSellerProducts(sellerId),
        api.adminSellerOrders(sellerId, orderPage)
      ]);

      setStores(Array.isArray(sellerStores) ? sellerStores : []);
      setProducts(sellerProducts.content);
      setSellerOrders(sellerOrdersData.content);
      setSellerOrdersPageInfo({
        first: sellerOrdersData.first,
        last: sellerOrdersData.last,
        number: sellerOrdersData.number
      });

      const firstStoreId = Array.isArray(sellerStores) && sellerStores[0] ? storeId(sellerStores[0]) : "";
      setSelectedStoreId(firstStoreId ? String(firstStoreId) : "");
    } catch (err) {
      setStores([]);
      setProducts([]);
      setSellerOrders([]);
      setError(err instanceof Error ? err.message : "Seller details could not load");
    } finally {
      setSellerDetailsLoading(false);
    }
  }

  async function loadOrders() {
    setError("");
    setOrdersLoading(true);

    try {
      const data = await api.adminOrders(ordersPage);
      setOrders(data.content);
      setOrdersPageInfo({
        first: data.first,
        last: data.last,
        number: data.number
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Orders could not load");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function loadRefunds() {
    setError("");
    setRefundsLoading(true);
    try {
      const data = await api.adminRefunds();
      setRefunds(Array.isArray(data?.refundResponseList) ? data.refundResponseList : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund requests could not load");
    } finally {
      setRefundsLoading(false);
    }
  }

  async function updateRefund(refund, action) {
    const id = refund.id;
    if (id === null || id === undefined) return;
    let reason;
    if (action === "reject") {
      reason = window.prompt("Reason for rejecting this refund:")?.trim();
      if (!reason) return;
    }
    setError("");
    setNotice("");
    setSavingRefundId(id);
    try {
      const response = action === "approve"
        ? await api.approveRefund(id)
        : await api.rejectRefund(id, reason);
      setNotice(response?.message || `Refund ${action}d.`);
      await loadRefunds();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Refund could not be ${action}d`);
    } finally {
      setSavingRefundId(null);
    }
  }

  function refreshCurrentSection() {
    setNotice("");
    if (section === "users") loadUsers();
    if (section === "sellers") {
      loadSellers();
      if (selectedSellerId) loadSellerDetails(selectedSellerId, sellerOrdersPage);
    }
    if (section === "orders") loadOrders();
    if (section === "refunds") loadRefunds();
  }

  function changeUserView(nextView) {
    setNotice("");
    setError("");
    setUserView(nextView);
    setUserPage(0);
  }

  function changeUserStatus(id, userStatus) {
    setUsers((current) =>
      current.map((user) => (userId(user) === id ? { ...user, pendingStatus: userStatus } : user))
    );
  }

  async function saveUserStatus(user) {
    const id = userId(user);
    const nextStatus = user.pendingStatus || user.status || "ACTIVE";

    setError("");
    setNotice("");
    setSavingUserId(id);

    try {
      await api.updateUserStatus(id, nextStatus);
      setUsers((current) =>
        current.map((item) =>
          userId(item) === id ? { ...item, status: nextStatus, pendingStatus: undefined } : item
        )
      );
      setNotice(`${username(user)} is now ${label(nextStatus).toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "User status could not be updated");
    } finally {
      setSavingUserId(null);
    }
  }

  function changeStoreStatus(id, status) {
    setStores((current) =>
      current.map((store) => (storeId(store) === id ? { ...store, pendingStatus: status } : store))
    );
  }

  async function saveStoreStatus(store) {
    const id = storeId(store);
    const nextStatus = store.pendingStatus || storeStatus(store);

    setError("");
    setNotice("");
    setSavingStoreId(id);

    try {
      await api.approveStore(id, nextStatus);
      setStores((current) =>
        current.map((item) =>
          storeId(item) === id
            ? {
                ...item,
                status: nextStatus,
                storeStatus: nextStatus,
                pendingStatus: undefined
              }
            : item
        )
      );
      setNotice(`${storeName(store)} is now ${label(nextStatus).toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Store status could not be updated");
    } finally {
      setSavingStoreId(null);
    }
  }

  function toggleProduct(id) {
    setSelectedProductIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  async function saveProductStatus() {
    if (!selectedStoreId) {
      setError("Select a store before updating products.");
      return;
    }

    if (!selectedProductIds.length) {
      setError("Select at least one product.");
      return;
    }

    setError("");
    setNotice("");
    setBulkSaving(true);

    try {
      await api.updateProductStatus(selectedStoreId, selectedProductIds, bulkProductStatus);
      setProducts((current) =>
        current.map((product) =>
          selectedProductIds.includes(productId(product))
            ? { ...product, productStatus: bulkProductStatus, status: bulkProductStatus }
            : product
        )
      );
      setSelectedProductIds([]);
      setNotice(`Updated ${selectedProductIds.length} product status value.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product status could not be updated");
    } finally {
      setBulkSaving(false);
    }
  }

  return (
    <main className="page admin-page">
      <div className="page-heading admin-heading">
        <div>
          <span className="pill">Seeded admin</span>
          <h1>Admin console</h1>
        </div>
        <button className="icon-button" type="button" onClick={refreshCurrentSection} title="Refresh current admin view">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="admin-section-tabs" aria-label="Admin sections">
        {sections.map(({ key, label: sectionLabel, icon: Icon }) => (
          <button
            className={section === key ? "section-tab active" : "section-tab"}
            key={key}
            type="button"
            onClick={() => {
              setError("");
              setNotice("");
              setSection(key);
            }}
          >
            <Icon size={18} />
            {sectionLabel}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}
      {notice && <div className="banner success">{notice}</div>}

      {section === "users" && (
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Account control</h2>
              <p>{userViews[userView].label}</p>
            </div>
            <div className="admin-toolbar" aria-label="Admin user type">
              {Object.entries(userViews).map(([key, item]) => (
                <button
                  className={userView === key ? "segment active" : "segment"}
                  key={key}
                  type="button"
                  onClick={() => changeUserView(key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {usersLoading && <LoadingBlock label="Loading users" />}
          {!usersLoading && !users.length && <EmptyState title="No users returned" text={userViews[userView].empty} />}
          {!!users.length && (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const id = userId(user);
                      const currentStatus = user.status || "ACTIVE";
                      const selectedStatus = user.pendingStatus || currentStatus;
                      const isDirty = selectedStatus !== currentStatus;
                      const isSaving = savingUserId === id;

                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{username(user)}</td>
                          <td>{user.email || "-"}</td>
                          <td>{user.role || "-"}</td>
                          <td>
                            <div className="status-control">
                              <span className={`status status-${selectedStatus.toLowerCase()}`}>
                                {label(selectedStatus)}
                              </span>
                              <select
                                value={selectedStatus}
                                onChange={(event) => changeUserStatus(id, event.target.value)}
                                disabled={isSaving}
                                aria-label={`Status for ${username(user)}`}
                              >
                                {userStatusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {label(status)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td>
                            <button
                              className="icon-button"
                              type="button"
                              onClick={() => saveUserStatus(user)}
                              disabled={!isDirty || isSaving}
                              title="Save status"
                            >
                              <Save size={17} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pager
                first={userPageInfo.first}
                last={userPageInfo.last}
                page={userPageInfo.number}
                loading={usersLoading}
                onPrevious={() => setUserPage((value) => Math.max(0, value - 1))}
                onNext={() => setUserPage((value) => value + 1)}
              />
            </>
          )}
        </section>
      )}

      {section === "sellers" && (
        <section className="admin-seller-layout">
          <div className="admin-panel seller-list-panel">
            <div className="panel-heading">
              <div>
                <h2>Sellers</h2>
                <p>{sellers.length} loaded</p>
              </div>
              <UsersRound size={24} />
            </div>

            {sellersLoading && <LoadingBlock label="Loading sellers" />}
            {!sellersLoading && !sellers.length && (
              <EmptyState title="No sellers returned" text="Seller accounts from the backend will appear here." />
            )}
            {!!sellers.length && (
              <>
                <div className="seller-list">
                  {sellers.map((seller) => {
                    const id = userId(seller);
                    const selected = String(id) === String(selectedSellerId);

                    return (
                      <button
                        className={selected ? "seller-row active" : "seller-row"}
                        key={id}
                        type="button"
                        onClick={() => {
                          setNotice("");
                          setError("");
                          setSellerOrdersPage(0);
                          setSelectedSellerId(String(id));
                        }}
                      >
                        <span>
                          <strong>{username(seller)}</strong>
                          <small>{seller.email || `Seller #${id}`}</small>
                        </span>
                        <span className={`status status-${String(seller.status || "active").toLowerCase()}`}>
                          {label(seller.status || "ACTIVE")}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Pager
                  first={sellerPageInfo.first}
                  last={sellerPageInfo.last}
                  page={sellerPageInfo.number}
                  loading={sellersLoading}
                  onPrevious={() => setSellerPage((value) => Math.max(0, value - 1))}
                  onNext={() => setSellerPage((value) => value + 1)}
                />
              </>
            )}
          </div>

          <div className="admin-panel seller-detail-panel">
            <div className="panel-heading">
              <div>
                <h2>{selectedSeller ? username(selectedSeller) : "Seller details"}</h2>
                <p>{selectedSeller?.email || "Select a seller"}</p>
              </div>
              <ShieldCheck size={25} />
            </div>

            {sellerDetailsLoading && <LoadingBlock label="Loading seller details" />}
            {!sellerDetailsLoading && !selectedSellerId && (
              <EmptyState title="No seller selected" text="Choose a seller account to review stores, products, and orders." />
            )}
            {!sellerDetailsLoading && selectedSellerId && (
              <div className="seller-detail-grid">
                <section>
                  <div className="subsection-heading">
                    <h3>Stores</h3>
                    <Store size={20} />
                  </div>
                  {!stores.length && <EmptyState title="No stores" text="This seller has no stores yet." />}
                  {!!stores.length && (
                    <div className="stack-list">
                      {stores.map((store) => {
                        const id = storeId(store);
                        const currentStatus = storeStatus(store);
                        const selectedStatus = store.pendingStatus || currentStatus;
                        const isDirty = selectedStatus !== currentStatus;
                        const isSaving = savingStoreId === id;

                        return (
                          <article className="store-admin-item" key={id}>
                            <div>
                              <strong>{storeName(store)}</strong>
                              <small>#{id}</small>
                            </div>
                            <div className="status-control compact">
                              <span className={`status status-${selectedStatus.toLowerCase()}`}>
                                {label(selectedStatus)}
                              </span>
                              <select
                                value={selectedStatus}
                                onChange={(event) => changeStoreStatus(id, event.target.value)}
                                disabled={isSaving}
                                aria-label={`Status for ${storeName(store)}`}
                              >
                                {storeStatusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {label(status)}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="icon-button"
                                type="button"
                                onClick={() => saveStoreStatus(store)}
                                disabled={!isDirty || isSaving}
                                title="Save store status"
                              >
                                <Save size={17} />
                              </button>
                              <button
                                className="button compact accept-store-button"
                                type="button"
                                onClick={() => saveStoreStatus({ ...store, pendingStatus: "ACCEPTED" })}
                                disabled={selectedStatus === "ACCEPTED" || isSaving}
                              >
                                <CheckCircle2 size={16} />
                                {isSaving && selectedStatus === "ACCEPTED" ? "Accepting..." : "Accept"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section>
                  <div className="subsection-heading">
                    <h3>Products</h3>
                    <ShoppingBag size={20} />
                  </div>

                  <div className="bulk-actions">
                    <label>
                      Store
                      <select value={selectedStoreId} onChange={(event) => setSelectedStoreId(event.target.value)}>
                        <option value="">Select store</option>
                        {stores.map((store) => {
                          const id = storeId(store);
                          return (
                            <option key={id} value={id}>
                              {storeName(store)}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                    <label>
                      Status
                      <select value={bulkProductStatus} onChange={(event) => setBulkProductStatus(event.target.value)}>
                        {productStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {label(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="button compact"
                      type="button"
                      disabled={bulkSaving || !selectedProductIds.length}
                      onClick={saveProductStatus}
                    >
                      {bulkProductStatus === "ACTIVE" ? <CheckCircle2 size={17} /> : <Ban size={17} />}
                      Save
                    </button>
                  </div>

                  {!visibleProducts.length && <EmptyState title="No products" text="This seller has no products returned yet." />}
                  {!!visibleProducts.length && (
                    <div className="table-wrap compact-table">
                      <table>
                        <thead>
                          <tr>
                            <th></th>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleProducts.map((product) => {
                            const id = productId(product);
                            const hasId = id !== null && id !== undefined;
                            const checked = selectedProductIds.includes(id);
                            const status = productStatus(product);

                            return (
                              <tr key={hasId ? id : product.name}>
                                <td>
                                  <input
                                    className="row-check"
                                    type="checkbox"
                                    checked={checked}
                                    disabled={!hasId}
                                    onChange={() => toggleProduct(id)}
                                    aria-label={`Select ${product.name || `product ${id}`}`}
                                  />
                                </td>
                                <td>
                                  <strong>{product.name || `Product #${id}`}</strong>
                                  <small>{product.category || product.color || product.size ? [product.category, product.color, product.size].filter(Boolean).join(" / ") : `#${id}`}</small>
                                </td>
                                <td>{money(product.price)}</td>
                                <td>{product.quantity ?? "-"}</td>
                                <td>
                                  <span className={`status status-${String(status).toLowerCase()}`}>
                                    {label(status)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="span-two">
                  <div className="subsection-heading">
                    <h3>Seller orders</h3>
                    <Package size={20} />
                  </div>
                  {!sellerOrders.length && <EmptyState title="No orders" text="Orders for this seller will appear here." />}
                  {!!sellerOrders.length && (
                    <>
                      <OrderTable orders={sellerOrders} />
                      <Pager
                        first={sellerOrdersPageInfo.first}
                        last={sellerOrdersPageInfo.last}
                        page={sellerOrdersPageInfo.number}
                        loading={sellerDetailsLoading}
                        onPrevious={() => setSellerOrdersPage((value) => Math.max(0, value - 1))}
                        onNext={() => setSellerOrdersPage((value) => value + 1)}
                      />
                    </>
                  )}
                </section>
              </div>
            )}
          </div>
        </section>
      )}

      {section === "orders" && (
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Orders</h2>
              <p>{orders.length} loaded</p>
            </div>
            <Package size={24} />
          </div>

          {ordersLoading && <LoadingBlock label="Loading orders" />}
          {!ordersLoading && !orders.length && <EmptyState title="No orders returned" text="All platform orders will appear here." />}
          {!!orders.length && (
            <>
              <OrderTable orders={orders} />
              <Pager
                first={ordersPageInfo.first}
                last={ordersPageInfo.last}
                page={ordersPageInfo.number}
                loading={ordersLoading}
                onPrevious={() => setOrdersPage((value) => Math.max(0, value - 1))}
                onNext={() => setOrdersPage((value) => value + 1)}
              />
            </>
          )}
        </section>
      )}

      {section === "refunds" && (
        <section className="admin-panel">
          <div className="panel-heading">
            <div><h2>Refund requests</h2><p>{refunds.length} loaded</p></div>
            <RotateCcw size={24} />
          </div>
          {refundsLoading && <LoadingBlock label="Loading refund requests" />}
          {!refundsLoading && !refunds.length && <EmptyState title="No refund requests" text="Customer refund requests will appear here." />}
          {!!refunds.length && <div className="table-wrap"><table>
            <thead><tr><th>Refund</th><th>Item</th><th>Qty</th><th>Amount</th><th>Status</th><th>Requested</th><th>Reason</th><th>Actions</th></tr></thead>
            <tbody>{refunds.map((refund) => {
              const id = refund.id;
              const pending = String(refund.status || "").toUpperCase() === "PENDING";
              return <tr key={id}>
                <td>#{id}</td><td>{refund.itemName || refund.ItemName || "Item"}</td><td>{refund.quantity ?? "-"}</td>
                <td>{money(refund.amount)}</td><td><span className={`status status-${String(refund.status || "pending").toLowerCase()}`}>{label(refund.status || "PENDING")}</span></td>
                <td>{dateTime(refund.requestedAt || refund.createdAt)}</td><td>{refund.rejectionReason || "-"}</td>
                <td>{pending && <div className="admin-toolbar">
                  <button className="button compact" type="button" disabled={savingRefundId === id} onClick={() => updateRefund(refund, "approve")}>Approve</button>
                  <button className="button danger-subtle compact" type="button" disabled={savingRefundId === id} onClick={() => updateRefund(refund, "reject")}>Reject</button>
                </div>}</td>
              </tr>;
            })}</tbody>
          </table></div>}
        </section>
      )}
    </main>
  );
}

function OrderTable({ orders }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Status</th>
            <th>Customer</th>
            <th>Store</th>
            <th>Total</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>
                <span className={`status status-${String(order.status || "pending").toLowerCase()}`}>
                  {label(order.status || "PENDING")}
                </span>
              </td>
              <td>
                <strong>{order.userName || order.username || "-"}</strong>
                <small>{order.userId ? `#${order.userId}` : ""}</small>
              </td>
              <td>
                <strong>{order.storeName || "-"}</strong>
                <small>{order.storeId ? `#${order.storeId}` : ""}</small>
              </td>
              <td>{money(order.totalPrice)}</td>
              <td>{dateTime(order.orderedDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pager({ first, last, page, loading, onPrevious, onNext }) {
  return (
    <div className="pager">
      <button className="button compact" type="button" onClick={onPrevious} disabled={first || loading}>
        Previous
      </button>
      <span>Page {page + 1}</span>
      <button className="button compact" type="button" onClick={onNext} disabled={last || loading}>
        Next
      </button>
    </div>
  );
}
