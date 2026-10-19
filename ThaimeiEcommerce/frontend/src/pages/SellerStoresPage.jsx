import { useEffect, useState } from "react";
import { Power, RefreshCw, Store } from "lucide-react";
import { api } from "../lib/api";
import { EmptyState, ErrorBanner, LoadingBlock } from "../components/StateBlocks";
import SellerSectionNav from "../components/SellerSectionNav";

const businessTypes = ["RETAIL", "INDIVIDUAL"];
const initialStoreForm = {
  storeName: "",
  businessType: "RETAIL",
  latitude: "",
  longitude: ""
};

function label(value = "") {
  return String(value || "").replaceAll("_", " ");
}

function storeId(store) {
  return store?.storeId ?? store?.id;
}

function storeName(store) {
  return store?.storeName || store?.name || `Store #${storeId(store) || "-"}`;
}

export default function SellerDashboardPage() {
  const [stores, setStores] = useState([]);
  const [storeForm, setStoreForm] = useState(initialStoreForm);
  const [loading, setLoading] = useState(true);
  const [busyStore, setBusyStore] = useState(false);
  const [busyStoreStatusId, setBusyStoreStatusId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadStores();
  }, []);

  async function loadStores() {
    setError("");
    setLoading(true);
    try {
      const data = await api.sellerStores();
      setStores(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seller stores could not load");
    } finally {
      setLoading(false);
    }
  }

  function updateStoreForm(key, value) {
    setStoreForm((current) => ({ ...current, [key]: value }));
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
      await loadStores();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Store could not be created");
    } finally {
      setBusyStore(false);
    }
  }

  async function toggleStoreOpenState(store) {
    const id = storeId(store);
    const currentStatus = store.openCloseStore || "CLOSED";
    const nextStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";

    setError("");
    setNotice("");
    setBusyStoreStatusId(id);

    try {
      await api.openSellerStore(id, nextStatus);
      setStores((current) =>
        current.map((item) => (String(storeId(item)) === String(id) ? { ...item, openCloseStore: nextStatus } : item))
      );
      setNotice(`${storeName(store)} is now ${label(nextStatus).toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Store status could not be updated");
    } finally {
      setBusyStoreStatusId(null);
    }
  }

  return (
    <main className="page seller-page">
      <div className="page-heading">
        <div>
          <span className="pill">Seller</span>
          <h1>Store management</h1>
          <p className="page-subtitle">Register your store and control whether it is open for orders.</p>
        </div>
        <button className="icon-button" type="button" onClick={loadStores} title="Refresh stores">
          <RefreshCw size={18} />
        </button>
      </div>

      <SellerSectionNav />

      {error && <ErrorBanner message={error} />}
      {notice && <div className="banner success">{notice}</div>}
      {loading && <LoadingBlock label="Loading seller stores" />}

      {!loading && (
        <div className="seller-page-content">
          <details className="seller-disclosure seller-store-disclosure">
            <summary>
              <div className="form-heading seller-form-heading">
                <Store size={22} />
                <div>
                  <h2>Register a store</h2>
                  <p>Enter the store details and location.</p>
                </div>
              </div>
              <span className="seller-disclosure-cta">Add store</span>
            </summary>
            <form className="profile-form seller-form seller-store-form" onSubmit={createStore}>
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
                    <option key={type} value={type}>{label(type)}</option>
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
              <button className="button seller-form-submit" type="submit" disabled={busyStore}>
                <Store size={18} />
                {busyStore ? "Saving..." : "Save store"}
              </button>
            </form>
          </details>

          <section className="table-wrap seller-store-list-panel">
            <div className="table-title">
              <div className="form-heading seller-form-heading">
                <Store size={22} />
                <div>
                  <h2>Your stores</h2>
                  <p>{stores.length} {stores.length === 1 ? "store" : "stores"}</p>
                </div>
              </div>
            </div>
            {!stores.length ? (
              <EmptyState title="No stores yet" text="Your registered stores will appear here." />
            ) : (
              <div className="store-manage-list">
                {stores.map((store) => {
                  const id = storeId(store);
                  const openCloseStore = store.openCloseStore || "CLOSED";
                  const nextStatus = openCloseStore === "OPEN" ? "CLOSED" : "OPEN";

                  return (
                    <article className="store-manage-row" key={id}>
                      <div>
                        <strong>{storeName(store)}</strong>
                        <small>Store #{id}</small>
                      </div>
                      <div className="seller-store-actions">
                        <span className={`status status-${String(openCloseStore).toLowerCase()}`}>
                          {label(openCloseStore)}
                        </span>
                        <button
                          className="button compact"
                          type="button"
                          disabled={String(busyStoreStatusId) === String(id)}
                          onClick={() => toggleStoreOpenState(store)}
                          title={`Mark store ${nextStatus.toLowerCase()}`}
                        >
                          <Power size={16} />
                          {String(busyStoreStatusId) === String(id) ? "Saving..." : `Set ${label(nextStatus).toLowerCase()}`}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
