import { useEffect, useMemo, useState } from "react";
import { Boxes, PackagePlus, RefreshCw, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { EmptyState, ErrorBanner, LoadingBlock } from "../components/StateBlocks";
import SellerSectionNav from "../components/SellerSectionNav";

const categories = ["T_SHIRTS", "HOODIES", "PANTS", "SHOES", "JACKETS"];
const colors = ["RED", "BLUE", "GREY", "YELLOW", "BLACK", "WHITE"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const maxProductsPerRequest = 100;
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

function label(value = "") {
  return String(value || "").replaceAll("_", " ");
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

export default function SellerProductsPage() {
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [productForms, setProductForms] = useState([{ ...initialProductForm }]);
  const [restockForm, setRestockForm] = useState({ productId: "", quantity: 1 });
  const [manageStoreId, setManageStoreId] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyProduct, setBusyProduct] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);
  const [restockingProductId, setRestockingProductId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadSellerProducts();
  }, []);

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
    const firstStoreId = stores[0] ? String(storeId(stores[0])) : "";

    if (!stores.length) {
      setProductForms((current) => current.map((form) => ({ ...form, storeId: "" })));
      setManageStoreId("");
      setSelectedProductIds([]);
      return;
    }

    setProductForms((current) => current.map((form) => (form.storeId ? form : { ...form, storeId: firstStoreId })));
    setManageStoreId((current) => current || firstStoreId);
  }, [stores]);

  useEffect(() => {
    setRestockForm((current) => {
      if (!restockProducts.length) return { ...current, productId: "" };
      const stillExists = restockProducts.some((product) => String(productId(product)) === String(current.productId));
      return stillExists ? current : { ...current, productId: String(productId(restockProducts[0])) };
    });
  }, [restockProducts]);

  async function loadSellerProducts() {
    setError("");
    setLoading(true);
    try {
      const [nextStores, nextProducts] = await Promise.all([api.sellerStores(), api.sellerProducts()]);
      setStores(Array.isArray(nextStores) ? nextStores : []);
      setProducts(Array.isArray(nextProducts) ? nextProducts : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seller products could not load");
    } finally {
      setLoading(false);
    }
  }

  function updateProductForm(index, key, value) {
    setProductForms((current) => current.map((form, formIndex) =>
      formIndex === index ? { ...form, [key]: value } : form
    ));
  }

  function addProductForm() {
    if (productForms.length >= maxProductsPerRequest) return;
    const preferredStoreId = productForms[productForms.length - 1]?.storeId || (stores[0] ? String(storeId(stores[0])) : "");
    setProductForms((current) => [...current, { ...initialProductForm, storeId: preferredStoreId }]);
  }

  function removeProductForm(index) {
    setProductForms((current) => current.length > 1 ? current.filter((_, formIndex) => formIndex !== index) : current);
  }

  function updateRestockForm(key, value) {
    setRestockForm((current) => ({ ...current, [key]: value }));
  }

  async function addProducts(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusyProduct(true);

    try {
      await api.addSellerProducts(productForms);
      const preferredStoreId = productForms[0]?.storeId || (stores[0] ? String(storeId(stores[0])) : "");
      setProductForms([{ ...initialProductForm, storeId: preferredStoreId }]);
      setNotice(`${productForms.length} product${productForms.length === 1 ? "" : "s"} saved.`);
      await loadSellerProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product could not be saved");
    } finally {
      setBusyProduct(false);
    }
  }

  function toggleProductSelection(id) {
    if (id === null || id === undefined) return;
    setSelectedProductIds((current) =>
      current.some((item) => String(item) === String(id))
        ? current.filter((item) => String(item) !== String(id))
        : [...current, id]
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
          String(productId(item)) === String(id) ? { ...item, quantity: Number(item.quantity || 0) + quantity } : item
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
      await loadSellerProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Products could not be deleted");
    } finally {
      setBusyDelete(false);
    }
  }

  return (
    <main className="page seller-page">
      <div className="page-heading">
        <div>
          <span className="pill">Seller</span>
          <h1>Product management</h1>
          <p className="page-subtitle">Add products, update stock, and manage your inventory.</p>
        </div>
        <button className="icon-button" type="button" onClick={loadSellerProducts} title="Refresh products">
          <RefreshCw size={18} />
        </button>
      </div>

      <SellerSectionNav />

      {error && <ErrorBanner message={error} />}
      {notice && <div className="banner success">{notice}</div>}
      {loading && <LoadingBlock label="Loading seller products" />}

      {!loading && (
        <div className="seller-page-content">
          <details className="seller-disclosure seller-product-disclosure">
            <summary>
              <div className="form-heading seller-form-heading">
                <PackagePlus size={22} />
                <div>
                  <h2>Add products</h2>
                  <p>Add up to {maxProductsPerRequest} products in one save.</p>
                </div>
              </div>
              <span className="seller-disclosure-cta">Add products</span>
            </summary>
            <form className="profile-form seller-form seller-product-form" onSubmit={addProducts}>
              <div className="seller-product-batch span-all">
                {productForms.map((productForm, index) => (
                  <section className="seller-product-entry" key={index} aria-labelledby={`seller-product-title-${index}`}>
                    <div className="seller-product-entry-heading">
                      <h3 id={`seller-product-title-${index}`}>Product {index + 1}</h3>
                      {productForms.length > 1 && (
                        <button
                          className="button secondary compact"
                          type="button"
                          onClick={() => removeProductForm(index)}
                          disabled={busyProduct}
                          aria-label={`Remove product ${index + 1}`}
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      )}
                    </div>
                    <label className="span-all">
                      Store
                      <select
                        value={productForm.storeId}
                        onChange={(event) => updateProductForm(index, "storeId", event.target.value)}
                        disabled={!stores.length || busyProduct}
                        required
                      >
                        {!stores.length && <option value="">No stores</option>}
                        {stores.map((store) => (
                          <option key={storeId(store)} value={storeId(store)}>{storeName(store)}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Product name
                      <input value={productForm.name} onChange={(event) => updateProductForm(index, "name", event.target.value)} disabled={busyProduct} required />
                    </label>
                    <label>
                      Price
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={productForm.price}
                        onChange={(event) => updateProductForm(index, "price", event.target.value)}
                        disabled={busyProduct}
                        required
                      />
                    </label>
                    <label>
                      Starting quantity
                      <input
                        type="number"
                        min="1"
                        value={productForm.quantity}
                        onChange={(event) => updateProductForm(index, "quantity", event.target.value)}
                        disabled={busyProduct}
                        required
                      />
                    </label>
                    <label>
                      Image URL
                      <input value={productForm.imageURL} onChange={(event) => updateProductForm(index, "imageURL", event.target.value)} disabled={busyProduct} required />
                    </label>
                    <label>
                      Category
                      <select value={productForm.category} onChange={(event) => updateProductForm(index, "category", event.target.value)} disabled={busyProduct}>
                        {categories.map((category) => <option key={category} value={category}>{label(category)}</option>)}
                      </select>
                    </label>
                    <label>
                      Color
                      <select value={productForm.color} onChange={(event) => updateProductForm(index, "color", event.target.value)} disabled={busyProduct}>
                        {colors.map((color) => <option key={color} value={color}>{label(color)}</option>)}
                      </select>
                    </label>
                    <label>
                      Size
                      <select value={productForm.size} onChange={(event) => updateProductForm(index, "size", event.target.value)} disabled={busyProduct}>
                        {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
                      </select>
                    </label>
                    <label className="span-all">
                      Description
                      <textarea
                        value={productForm.description}
                        onChange={(event) => updateProductForm(index, "description", event.target.value)}
                        disabled={busyProduct}
                        required
                      />
                    </label>
                  </section>
                ))}
              </div>
              <div className="seller-product-batch-actions span-all">
                <button
                  className="button secondary"
                  type="button"
                  onClick={addProductForm}
                  disabled={busyProduct || productForms.length >= maxProductsPerRequest || !stores.length}
                >
                  <PackagePlus size={18} />
                  Add another product
                </button>
                <button className="button seller-form-submit" type="submit" disabled={busyProduct || !stores.length}>
                  <PackagePlus size={18} />
                  {busyProduct ? "Saving..." : `Save ${productForms.length} product${productForms.length === 1 ? "" : "s"}`}
                </button>
              </div>
            </form>
          </details>

          <section className="table-wrap seller-inventory-panel">
            <div className="table-title seller-inventory-title">
              <div className="form-heading seller-form-heading">
                <Boxes size={22} />
                <div>
                  <h2>Inventory</h2>
                  <p>{visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}</p>
                </div>
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
                  {stores.map((store) => <option key={storeId(store)} value={storeId(store)}>{storeName(store)}</option>)}
                </select>
              </label>
              <button
                className={`button compact seller-delete-button ${selectedProductIds.length ? "danger" : "secondary"}`}
                type="button"
                onClick={deleteSelectedProducts}
                disabled={busyDelete || !selectedProductIds.length}
              >
                <Trash2 size={16} />
                {selectedProductIds.length ? `Delete (${selectedProductIds.length})` : "Delete selected"}
              </button>
            </div>
            <form className="seller-restock-toolbar" onSubmit={restockSelectedProduct}>
              <label>
                Restock product
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
                        {product.name || `Product #${id}`} · {label(product.category)} / {label(product.color)} / {product.size} · {product.quantity} in stock
                      </option>
                    );
                  })}
                </select>
              </label>
              <label>
                Add quantity
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
              <button className="button compact" type="submit" disabled={!selectedRestockProduct || restockingProductId !== null}>
                <PackagePlus size={16} />
                {restockingProductId ? "Restocking..." : "Restock"}
              </button>
            </form>
            {!visibleProducts.length ? (
              <EmptyState title="No products yet" text="Products saved to your stores will appear here." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th aria-label="Select"></th>
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
                            checked={selectedProductIds.some((item) => String(item) === String(id))}
                            disabled={!hasId}
                            onChange={() => toggleProductSelection(id)}
                            aria-label={`Select ${product.name || `product ${id}`}`}
                          />
                        </td>
                        <td>{id ?? "-"}</td>
                        <td>{product.name}</td>
                        <td>{label(product.category)} / {label(product.color)} / {product.size}</td>
                        <td>{product.quantity}</td>
                        <td>Rs. {Number(product.price).toFixed(2)}</td>
                        <td><span className={`status status-${String(status).toLowerCase()}`}>{label(status)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
