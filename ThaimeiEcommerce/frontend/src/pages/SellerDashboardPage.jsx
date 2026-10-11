import { useEffect, useMemo, useState } from "react";
import { Boxes, ClipboardList, PackagePlus, Power, RefreshCw, Save, Store, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { EmptyState, ErrorBanner, LoadingBlock } from "../components/StateBlocks";

const businessTypes = ["RETAIL", "INDIVIDUAL"];
const categories = ["T_SHIRTS", "HOODIES", "PANTS", "SHOES", "JACKETS"];
const colors = ["RED", "BLUE", "GREY", "YELLOW", "BLACK", "WHITE"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const orderStatusOptions = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "FAILED", "RETURNED"];

const initialStoreForm = {
  storeName: "",
  businessType: "RETAIL",
  latitude: "",
  longitude: ""
};

const initialProductForm = {
  storeId: "",
  name: "",
  price: "",
  description: "",
  imageURL: "",
  quantity: 1,
  category: "T_SHIRTS",
  color: "BLACK",
  size: "M"
};

const initialRestockForm = {
  productId: "",
  quantity: 1
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

function productId(product) {
  return product?.productId ?? product?.id;
}

function productStoreId(product) {
  return product?.storeId ?? product?.store?.storeId ?? product?.storeModel?.storeId;
}

function productStatus(product) {
  return product?.status || product?.productStatus || "ACTIVE";
}

function storeId(store) {
  return store?.storeId ?? store?.id;
}

function storeName(store) {
  return store?.storeName || store?.name || `Store #${storeId(store) || "-"}`;
}

function orderId(order) {
  return order?.orderId ?? order?.id;
}

function orderStatus(order) {
  return order?.status || order?.orderStatus || "PENDING";
}

function pageState() {
  return { first: true, last: true, number: 0 };
}

export default function SellerDashboardPage() {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [storeForm, setStoreForm] = useState(initialStoreForm);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [restockForm, setRestockForm] = useState(initialRestockForm);
  const [manageStoreId, setManageStoreId] = useState("");
  const [orderStoreId, setOrderStoreId] = useState("");
  const [orderPage, setOrderPage] = useState(0);
  const [orderPageInfo, setOrderPageInfo] = useState(pageState);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [busyStore, setBusyStore] = useState(false);
  const [busyProduct, setBusyProduct] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [restockingProductId, setRestockingProductId] = useState(null);
  const [busyStoreStatusId, setBusyStoreStatusId] = useState(null);
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadSellerData();
  }, []);

  useEffect(() => {
    loadSellerOrders();
  }, [orderPage, orderStoreId]);

  const selectedStore = useMemo(
    () => stores.find((store) => String(store.storeId) === String(productForm.storeId)),
    [productForm.storeId, stores]
  );

  const visibleProducts = useMemo(() => {
    if (!manageStoreId) return products;

    const productsWithStore = products.filter((product) => productStoreId(product));
    if (!productsWithStore.length) return products;

    return products.filter((product) => String(productStoreId(product)) === String(manageStoreId));
  }, [manageStoreId, products]);

  const restockProducts = useMemo(
    () => products.filter((product) => productId(product) !== null && productId(product) !== undefined),
    [products]
  );

  const selectedRestockProduct = useMemo(
    () => restockProducts.find((product) => String(productId(product)) === String(restockForm.productId)),
    [restockForm.productId, restockProducts]
  );

  useEffect(() => {
    const firstStoreId = stores[0]?.storeId ? String(stores[0].storeId) : "";

    if (!stores.length) {
      setProductForm((current) => ({ ...current, storeId: "" }));
      setManageStoreId("");
      setSelectedProductIds([]);
      return;
    }

    setProductForm((current) => (current.storeId ? current : { ...current, storeId: firstStoreId }));
    setManageStoreId((current) => current || firstStoreId);
  }, [stores]);

  useEffect(() => {
    setRestockForm((current) => {
      if (!restockProducts.length) {
        return { ...current, productId: "" };
      }

      const selectedExists = restockProducts.some((product) => String(productId(product)) === String(current.productId));
      return selectedExists ? current : { ...current, productId: String(productId(restockProducts[0])) };
    });
  }, [restockProducts]);

  async function loadSellerData() {
    setError("");
    setLoading(true);
    try {
      const [nextStores, nextProducts] = await Promise.all([api.sellerStores(), api.sellerProducts()]);
      setStores(nextStores || []);
      setProducts(nextProducts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seller data could not load");
    } finally {
      setLoading(false);
    }
  }

  async function loadSellerOrders(storeIdValue = orderStoreId, pageValue = orderPage) {
    setError("");
    setOrdersLoading(true);

    try {
      const data = storeIdValue
        ? await api.sellerStoreOrdersSlice(storeIdValue, pageValue)
        : await api.sellerOrdersSlice(pageValue);

      setOrders(data.content || []);
      setOrderPageInfo({
        first: data.first ?? pageValue === 0,
        last: data.last ?? true,
        number: data.number ?? pageValue
      });
    } catch (err) {
      setOrders([]);
      setOrderPageInfo(pageState());
      setError(err instanceof Error ? err.message : "Seller orders could not load");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function refreshSellerWorkspace() {
    await Promise.all([loadSellerData(), loadSellerOrders()]);
  }

  function updateStoreForm(key, value) {
    setStoreForm((current) => ({ ...current, [key]: value }));
  }

  function updateProductForm(key, value) {
    setProductForm((current) => ({ ...current, [key]: value }));
  }

  function updateRestockForm(key, value) {
    setRestockForm((current) => ({ ...current, [key]: value }));
  }

  async function createStore(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusyStore(true);

    try {
      await api.createSellerStore({
        ...storeForm,
        latitude: Number(storeForm.latitude),
        longitude: Number(storeForm.longitude)
      });
      setStoreForm(initialStoreForm);
      setNotice("Store registered.");
      await loadSellerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Store could not be created");
    } finally {
      setBusyStore(false);
    }
  }

  async function addProduct(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusyProduct(true);

    try {
      await api.addSellerProduct(productForm);
      setProductForm((current) => ({
        ...initialProductForm,
        storeId: current.storeId
      }));
      setNotice("Product saved.");
      await loadSellerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product could not be saved");
    } finally {
      setBusyProduct(false);
    }
  }

  async function toggleStoreOpenState(store) {
    const nextStatus = store.openCloseStore === "OPEN" ? "CLOSED" : "OPEN";

    setError("");
    setNotice("");
    setBusyStoreStatusId(store.storeId);

    try {
      await api.openSellerStore(store.storeId, nextStatus);
      setStores((current) =>
        current.map((item) => (item.storeId === store.storeId ? { ...item, openCloseStore: nextStatus } : item))
      );
      setNotice(`${store.storeName} is now ${label(nextStatus).toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Store status could not be updated");
    } finally {
      setBusyStoreStatusId(null);
    }
  }

  function toggleProductSelection(id) {
    if (id === null || id === undefined) return;

    setSelectedProductIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function changeOrderStatus(id, status) {
    setOrders((current) =>
      current.map((order) => (orderId(order) === id ? { ...order, pendingStatus: status } : order))
    );
  }

  async function restockProduct(product, quantityValue) {
    const id = productId(product);
    const quantity = Number(quantityValue ?? 1);

    if (!id) {
      setError("Product id is missing from this row.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Enter a whole restock quantity of at least 1.");
      return;
    }

    setError("");
    setNotice("");
    setRestockingProductId(id);

    try {
      await api.restockSellerProduct(id, quantity);
      setProducts((current) =>
        current.map((item) =>
          productId(item) === id ? { ...item, quantity: Number(item.quantity || 0) + quantity } : item
        )
      );
      setRestockForm((current) =>
        String(current.productId) === String(id) ? { ...current, quantity: 1 } : current
      );
      setNotice(`Restocked ${product.name || `product #${id}`} by ${quantity} unit${quantity === 1 ? "" : "s"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product could not be restocked");
    } finally {
      setRestockingProductId(null);
    }
  }

  async function restockSelectedProduct(event) {
    event.preventDefault();

    if (!selectedRestockProduct) {
      setError("Select a product to restock.");
      return;
    }

    await restockProduct(selectedRestockProduct, restockForm.quantity);
  }

  async function saveOrderStatus(order) {
    const id = orderId(order);
    const nextStatus = order.pendingStatus || orderStatus(order);

    if (!id) {
      setError("Order id is missing from this row.");
      return;
    }

    setError("");
    setNotice("");
    setSavingOrderId(id);

    try {
      await api.updateSellerOrderStatus(id, nextStatus);
      setOrders((current) =>
        current.map((item) =>
          orderId(item) === id ? { ...item, status: nextStatus, orderStatus: nextStatus, pendingStatus: undefined } : item
        )
      );
      setNotice(`Order #${id} is now ${label(nextStatus).toLowerCase()}.`);
      await loadSellerOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order status could not be updated");
    } finally {
      setSavingOrderId(null);
    }
  }

  async function deleteSelectedProducts() {
    if (!manageStoreId) {
      setError("Select a store before deleting products.");
      return;
    }

    if (!selectedProductIds.length) {
      setError("Select at least one product to delete.");
      return;
    }

    setError("");
    setNotice("");
    setBusyDelete(true);

    try {
      await api.deleteSellerProducts(manageStoreId, selectedProductIds);
      const count = selectedProductIds.length;
      setSelectedProductIds([]);
      setNotice(`Deleted ${count} product${count === 1 ? "" : "s"}.`);
      await loadSellerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Products could not be deleted");
    } finally {
      setBusyDelete(false);
    }
  }

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <span className="pill">Seller</span>
          <h1>Seller Workspace</h1>
        </div>
        <button className="icon-button" type="button" onClick={refreshSellerWorkspace} title="Refresh seller data">
          <RefreshCw size={18} />
        </button>
      </div>

      {error && <ErrorBanner message={error} />}
      {notice && <div className="banner success">{notice}</div>}
      {loading && <LoadingBlock label="Loading seller workspace" />}

      {!loading && (
        <>
          <section className="seller-grid">
            <form className="profile-form seller-form" onSubmit={createStore}>
              <div className="form-heading span-two">
                <Store size={22} />
                <h2>Register Store</h2>
              </div>
              <label>
                Store name
                <input
                  value={storeForm.storeName}
                  onChange={(event) => updateStoreForm("storeName", event.target.value)}
                  required
                />
              </label>
              <label>
                Business type
                <select
                  value={storeForm.businessType}
                  onChange={(event) => updateStoreForm("businessType", event.target.value)}
                  required
                >
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {label(type)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Latitude
                <input
                  type="number"
                  step="any"
                  value={storeForm.latitude}
                  onChange={(event) => updateStoreForm("latitude", event.target.value)}
                  required
                />
              </label>
              <label>
                Longitude
                <input
                  type="number"
                  step="any"
                  value={storeForm.longitude}
                  onChange={(event) => updateStoreForm("longitude", event.target.value)}
                  required
                />
              </label>
              <button className="button span-two" type="submit" disabled={busyStore}>
                <Store size={18} />
                {busyStore ? "Saving..." : "Save store"}
              </button>
            </form>

            <form className="profile-form seller-form" onSubmit={addProduct}>
              <div className="form-heading span-two">
                <PackagePlus size={22} />
                <h2>Add Product</h2>
              </div>
              <label className="span-two">
                Store
                <select
                  value={productForm.storeId}
                  onChange={(event) => updateProductForm("storeId", event.target.value)}
                  disabled={!stores.length}
                  required
                >
                  {!stores.length && <option value="">No stores</option>}
                  {stores.map((store) => (
                    <option key={storeId(store)} value={storeId(store)}>
                      {storeName(store)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Product name
                <input
                  value={productForm.name}
                  onChange={(event) => updateProductForm("name", event.target.value)}
                  required
                />
              </label>
              <label>
                Price
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={productForm.price}
                  onChange={(event) => updateProductForm("price", event.target.value)}
                  required
                />
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  value={productForm.quantity}
                  onChange={(event) => updateProductForm("quantity", event.target.value)}
                  required
                />
              </label>
              <label>
                Image URL
                <input
                  value={productForm.imageURL}
                  onChange={(event) => updateProductForm("imageURL", event.target.value)}
                  required
                />
              </label>
              <label>
                Category
                <select value={productForm.category} onChange={(event) => updateProductForm("category", event.target.value)}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {label(category)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Color
                <select value={productForm.color} onChange={(event) => updateProductForm("color", event.target.value)}>
                  {colors.map((color) => (
                    <option key={color} value={color}>
                      {label(color)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Size
                <select value={productForm.size} onChange={(event) => updateProductForm("size", event.target.value)}>
                  {sizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-two">
                Description
                <textarea
                  value={productForm.description}
                  onChange={(event) => updateProductForm("description", event.target.value)}
                  required
                />
              </label>
              <button className="button span-two" type="submit" disabled={busyProduct || !selectedStore}>
                <PackagePlus size={18} />
                {busyProduct ? "Saving..." : "Save product"}
              </button>
            </form>

            <form className="profile-form seller-form restock-form span-two" onSubmit={restockSelectedProduct}>
              <div className="form-heading span-two">
                <PackagePlus size={22} />
                <h2>Restock Product</h2>
              </div>
              <label className="restock-product-field">
                Product
                <select
                  value={restockForm.productId}
                  onChange={(event) => updateRestockForm("productId", event.target.value)}
                  disabled={!restockProducts.length || restockingProductId !== null}
                  required
                >
                  {!restockProducts.length && <option value="">No products</option>}
                  {restockProducts.map((product) => {
                    const id = productId(product);

                    return (
                      <option key={id} value={id}>
                        {product.name || `Product #${id}`} #{id} - {label(product.category)} / {label(product.color)} / {product.size} ({product.quantity} in stock)
                      </option>
                    );
                  })}
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={restockForm.quantity}
                  onChange={(event) => updateRestockForm("quantity", event.target.value)}
                  disabled={!restockProducts.length || restockingProductId !== null}
                  required
                />
              </label>
              <button className="button" type="submit" disabled={!selectedRestockProduct || restockingProductId !== null}>
                <PackagePlus size={18} />
                {restockingProductId ? "Restocking..." : "Restock"}
              </button>
            </form>
          </section>

          <section className="seller-summary">
            <div className="summary-panel">
              <div className="form-heading">
                <Store size={22} />
                <h2>Stores</h2>
              </div>
              {!stores.length ? (
                <EmptyState title="No stores yet" text="Registered stores will appear here." />
              ) : (
                <div className="store-manage-list">
                  {stores.map((store) => {
                    const openCloseStore = store.openCloseStore || "CLOSED";
                    const nextStatus = openCloseStore === "OPEN" ? "CLOSED" : "OPEN";
                    const id = storeId(store);

                    return (
                      <article className="store-manage-row" key={id}>
                        <div>
                          <strong>{storeName(store)}</strong>
                          <small>#{id}</small>
                        </div>
                        <button
                          className="button compact"
                          type="button"
                          disabled={busyStoreStatusId === id}
                          onClick={() => toggleStoreOpenState(store)}
                          title={`Mark store ${nextStatus.toLowerCase()}`}
                        >
                          <Power size={17} />
                          {label(openCloseStore)}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="table-wrap">
              <div className="table-title">
                <div className="form-heading">
                  <Boxes size={22} />
                  <h2>Products</h2>
                </div>
              </div>
              <div className="seller-product-tools">
                <label>
                  Store
                  <select
                    value={manageStoreId}
                    onChange={(event) => {
                      setManageStoreId(event.target.value);
                      setSelectedProductIds([]);
                    }}
                    disabled={!stores.length}
                  >
                    {!stores.length && <option value="">No stores</option>}
                    {stores.map((store) => (
                      <option key={storeId(store)} value={storeId(store)}>
                        {storeName(store)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button compact danger"
                  type="button"
                  onClick={deleteSelectedProducts}
                  disabled={busyDelete || !selectedProductIds.length}
                >
                  <Trash2 size={17} />
                  Delete selected
                </button>
              </div>
              {!visibleProducts.length ? (
                <EmptyState title="No products yet" text="Saved seller products will appear here." />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Variant</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((product) => {
                      const id = productId(product);
                      const hasId = id !== null && id !== undefined;
                      const status = productStatus(product);

                      return (
                        <tr key={hasId ? id : product.name}>
                          <td>
                            <input
                              className="row-check"
                              type="checkbox"
                              checked={selectedProductIds.includes(id)}
                              disabled={!hasId}
                              onChange={() => toggleProductSelection(id)}
                              aria-label={`Select ${product.name || `product ${id}`}`}
                            />
                          </td>
                          <td>{id || "-"}</td>
                          <td>{product.name}</td>
                          <td>
                            {label(product.category)} / {label(product.color)} / {product.size}
                          </td>
                          <td>{product.quantity}</td>
                          <td>Rs. {Number(product.price).toFixed(2)}</td>
                          <td>
                            <span className={`status status-${String(status).toLowerCase()}`}>{label(status)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <section className="table-wrap seller-orders-table span-two">
              <div className="table-title seller-orders-title">
                <div className="form-heading">
                  <ClipboardList size={22} />
                  <h2>Orders</h2>
                </div>
                <button className="icon-button" type="button" onClick={() => loadSellerOrders()} title="Refresh orders">
                  <RefreshCw size={18} />
                </button>
              </div>
              <div className="seller-product-tools seller-order-tools">
                <label>
                  Store
                  <select
                    value={orderStoreId}
                    onChange={(event) => {
                      setOrderStoreId(event.target.value);
                      setOrderPage(0);
                    }}
                    disabled={!stores.length || ordersLoading}
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
                        <th>Name</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const id = orderId(order);
                        const currentStatus = orderStatus(order);
                        const selectedStatus = order.pendingStatus || currentStatus;
                        const isDirty = selectedStatus !== currentStatus;
                        const isSaving = savingOrderId === id;
                        const options = orderStatusOptions.includes(selectedStatus)
                          ? orderStatusOptions
                          : [selectedStatus, ...orderStatusOptions];

                        return (
                          <tr key={id || order.name}>
                            <td>{id ? `#${id}` : "-"}</td>
                            <td>
                              <strong>{order.name || order.productName || `Order #${id || "-"}`}</strong>
                              <small>{order.storeName || order.customerName || ""}</small>
                            </td>
                            <td>{money(order.totalPrice)}</td>
                            <td>
                              <div className="status-control">
                                <span className={`status status-${String(selectedStatus).toLowerCase()}`}>
                                  {label(selectedStatus)}
                                </span>
                                <select
                                  value={selectedStatus}
                                  onChange={(event) => changeOrderStatus(id, event.target.value)}
                                  disabled={isSaving || !id}
                                  aria-label={`Status for order ${id || ""}`}
                                >
                                  {options.map((status) => (
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
                                onClick={() => saveOrderStatus(order)}
                                disabled={!isDirty || isSaving || !id}
                                title="Save order status"
                              >
                                <Save size={17} />
                              </button>
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
                      onClick={() => setOrderPage((value) => Math.max(0, value - 1))}
                      disabled={orderPageInfo.first || ordersLoading}
                    >
                      Previous
                    </button>
                    <span>Page {orderPageInfo.number + 1}</span>
                    <button
                      className="button compact"
                      type="button"
                      onClick={() => setOrderPage((value) => value + 1)}
                      disabled={orderPageInfo.last || ordersLoading}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </section>
          </section>
        </>
      )}
    </main>
  );
}
