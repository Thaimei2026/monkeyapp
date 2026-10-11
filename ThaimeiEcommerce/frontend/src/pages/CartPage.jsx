import { useEffect, useMemo, useState } from "react";
import { CreditCard, Minus, Plus, RefreshCw, Trash2 } from "lucide-react";
import PaymentCheckout from "../components/PaymentCheckout";
import { api, paymentIntentIdFromClientSecret } from "../lib/api";
import { EmptyState, ErrorBanner, LoadingBlock } from "../components/StateBlocks";

const quantityActions = {
  INCREASE: "INCREASE",
  DECREASE: "DECREASE"
};

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [quantityBusyItemId, setQuantityBusyItemId] = useState(null);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const items = useMemo(() => {
    const productMatches = products.reduce((matches, product) => {
      const keys = [
        product.name,
        `${product.name}|${product.price}`,
        `${product.name}|${product.price}|${product.imageURL || ""}`
      ];

      keys.forEach((key) => {
        if (key && !matches.has(key)) {
          matches.set(key, product);
        }
      });

      return matches;
    }, new Map());

    return (cart?.items ?? []).map((item) => {
      const product =
        productMatches.get(`${item.productName}|${item.price}|${item.imageURL || ""}`) ||
        productMatches.get(`${item.productName}|${item.price}`) ||
        productMatches.get(item.productName);

      return { ...item, productId: item.productId || product?.productId };
    });
  }, [cart, products]);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0), [items]);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    setError("");
    setLoading(true);

    Promise.all([api.cart(), api.products(0, 100)])
      .then(([nextCart, nextProducts]) => {
        setCart(nextCart);
        setProducts(nextProducts);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Cart could not load"))
      .finally(() => setLoading(false));
  }

  async function placeOrders() {
    if (!items.length) return;
    setError("");
    setNotice("");
    setCheckoutBusy(true);

    const orderItems = items.filter((item) => item.productId);

    if (orderItems.length !== items.length) {
      setError("Some cart products could not be matched for checkout.");
      setCheckoutBusy(false);
      return;
    }

    try {
      const checkout = await api.checkoutCart(orderItems);
      const clientSecret = checkout?.clientSecret;

      if (!clientSecret) {
        throw new Error("Checkout did not return a payment client secret.");
      }

      setCheckoutSession({
        clientSecret,
        paymentId: paymentIntentIdFromClientSecret(clientSecret)
      });
      setNotice("Order created. Complete the payment to confirm it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order could not be placed");
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function removeCartItem(itemId) {
    if (!itemId) return;

    setError("");
    setNotice("");
    setRemovingItemId(itemId);

    try {
      await api.removeCartItem(itemId);
      setCart((currentCart) => ({
        ...currentCart,
        items: (currentCart?.items ?? []).filter((item) => item.itemId !== itemId)
      }));
      setNotice("Product removed from your cart.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product could not be removed");
    } finally {
      setRemovingItemId(null);
    }
  }

  async function changeCartItemQuantity(item, action) {
    if (!item?.itemId) return;

    setError("");
    setNotice("");
    setQuantityBusyItemId(item.itemId);

    try {
      await api.updateCartItemQuantity(item.itemId, action);
      setCart((currentCart) => {
        const nextItems = (currentCart?.items ?? []).reduce((updatedItems, currentItem) => {
          if (currentItem.itemId !== item.itemId) {
            updatedItems.push(currentItem);
            return updatedItems;
          }

          const change = action === quantityActions.INCREASE ? 1 : -1;
          const nextQuantity = Number(currentItem.quantity || 0) + change;

          if (nextQuantity > 0) {
            updatedItems.push({
              ...currentItem,
              quantity: nextQuantity,
              totalPrice: Number(currentItem.price || 0) * nextQuantity
            });
          }

          return updatedItems;
        }, []);

        return { ...currentCart, items: nextItems };
      });
      setNotice(action === quantityActions.INCREASE ? "Quantity increased." : "Quantity decreased.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cart quantity could not be updated");
    } finally {
      setQuantityBusyItemId(null);
    }
  }

  async function handlePaymentComplete({ payment, hasFailedOrders }) {
    setNotice(
      hasFailedOrders
        ? "Payment succeeded, but one or more orders could not be fulfilled. Review the payment status for order details."
        : payment
          ? "Payment confirmed and recorded."
          : "Payment confirmed. Payment status will update after the webhook."
    );
    await loadCart();
  }

  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <span className="pill">Checkout</span>
          <h1>Your cart</h1>
        </div>
        <div className="heading-actions">
          <strong className="price">Rs. {total.toFixed(2)}</strong>
          <button className="icon-button" type="button" onClick={loadCart} title="Refresh cart">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}
      {notice && <div className="banner success">{notice}</div>}
      {loading && <LoadingBlock label="Loading cart" />}
      {!loading && !items.length && <EmptyState title="Cart is empty" text="Add a product and it will show up here." />}

      {!!items.length && (
        <section className="split-layout">
          <div className="line-items">
            {items.map((item, index) => (
              <article className="line-item" key={item.itemId || `${item.productName}-${index}`}>
                <div className="item-copy">
                  {item.imageURL && <img className="item-thumb" src={item.imageURL} alt={item.productName} />}
                  <div>
                    <h2>{item.productName}</h2>
                    <p>Rs. {Number(item.price).toFixed(2)} each</p>
                  </div>
                </div>
                <div className="item-actions">
                  <strong>Rs. {Number(item.totalPrice).toFixed(2)}</strong>
                  <div className="quantity-control cart-quantity-control" aria-label={`Quantity for ${item.productName}`}>
                    <button
                      type="button"
                      onClick={() => changeCartItemQuantity(item, quantityActions.DECREASE)}
                      disabled={!item.itemId || quantityBusyItemId === item.itemId || removingItemId === item.itemId}
                      title="Decrease quantity"
                      aria-label={`Decrease ${item.productName} quantity`}
                    >
                      <Minus size={17} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeCartItemQuantity(item, quantityActions.INCREASE)}
                      disabled={!item.itemId || quantityBusyItemId === item.itemId || removingItemId === item.itemId}
                      title="Increase quantity"
                      aria-label={`Increase ${item.productName} quantity`}
                    >
                      <Plus size={17} />
                    </button>
                  </div>
                  <button
                    className="button secondary danger remove-cart-button"
                    type="button"
                    onClick={() => removeCartItem(item.itemId)}
                    disabled={!item.itemId || removingItemId === item.itemId || quantityBusyItemId === item.itemId}
                    aria-label={`Remove ${item.productName} from cart`}
                    title="Remove from cart"
                  >
                    <Trash2 size={17} />
                    {removingItemId === item.itemId ? "Removing..." : "Remove"}
                  </button>
                </div>
              </article>
            ))}
          </div>
          <aside className="summary-panel">
            <h2>Summary</h2>
            <p>{items.length} items ready for checkout.</p>
            <div className="summary-row">
              <span>Total</span>
              <strong>Rs. {total.toFixed(2)}</strong>
            </div>
            {checkoutSession ? (
              <PaymentCheckout
                clientSecret={checkoutSession.clientSecret}
                intentId={checkoutSession.paymentId}
                amountLabel={`Rs. ${total.toFixed(2)}`}
                onPaid={handlePaymentComplete}
                onCancel={() => setCheckoutSession(null)}
              />
            ) : (
              <button className="button" type="button" onClick={placeOrders} disabled={checkoutBusy}>
                <CreditCard size={18} />
                {checkoutBusy ? "Placing..." : "Place order"}
              </button>
            )}
          </aside>
        </section>
      )}
    </main>
  );
}
