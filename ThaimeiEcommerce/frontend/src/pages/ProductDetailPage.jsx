import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Minus, Plus, ShoppingCart } from "lucide-react";
import PaymentCheckout from "../components/PaymentCheckout";
import { api, paymentIntentIdFromClientSecret } from "../lib/api";
import { ErrorBanner, LoadingBlock } from "../components/StateBlocks";
import { productImage } from "./ProductsPage";

export default function ProductDetailPage({ session }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const productId = Number(id);
    if (!productId) return;
    setCheckoutSession(null);
    loadProduct(productId);
  }, [id]);

  function loadProduct(productId) {
    api
      .product(productId)
      .then((nextProduct) => {
        setProduct(nextProduct);
        setQuantity((current) => Math.min(Math.max(1, current), Math.max(1, Number(nextProduct?.quantity || 1))));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Product could not load"))
      .finally(() => setLoading(false));
  }

  async function add() {
    if (!product) return;
    setError("");
    setNotice("");
    setBusyAction("cart");

    try {
      await api.addToCart(product.productId, quantity);
      setNotice("Added to cart.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item");
    } finally {
      setBusyAction("");
    }
  }

  async function buyNow() {
    if (!product) return;
    setError("");
    setNotice("");
    setBusyAction("buy");

    try {
      const checkout = await api.buyNow(product.productId, quantity);
      const clientSecret = checkout?.clientSecret;

      if (!clientSecret) {
        throw new Error("Checkout did not return a payment client secret.");
      }

      setCheckoutSession({
        clientSecret,
        paymentId: paymentIntentIdFromClientSecret(clientSecret),
        amountLabel: `Rs. ${(Number(product.price || 0) * quantity).toFixed(2)}`
      });
      setNotice("Order created. Complete the payment to confirm it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order could not be placed");
    } finally {
      setBusyAction("");
    }
  }

  function changeQuantity(nextQuantity) {
    setQuantity(nextQuantity);
    setCheckoutSession(null);
  }

  function handlePaymentComplete({ payment, hasFailedOrders }) {
    setNotice(
      hasFailedOrders
        ? "Payment succeeded, but the order could not be fulfilled. Review the payment status for details."
        : payment
          ? "Payment confirmed and recorded."
          : "Payment confirmed. Payment status will update after the webhook."
    );
    const productId = Number(id);
    if (productId) {
      loadProduct(productId);
    }
  }

  const maxQuantity = Math.max(1, Number(product?.quantity || 1));
  const isUnavailable = Number(product?.quantity || 0) < 1;

  return (
    <main className="page detail-page">
      <Link className="back-link" to="/products">
        <ArrowLeft size={18} />
        Products
      </Link>
      {error && <ErrorBanner message={error} />}
      {notice && <div className="banner success">{notice}</div>}
      {loading && <LoadingBlock label="Loading product" />}
      {product && (
        <section className="detail-layout">
          <div className="detail-image-frame">
            <img className="detail-image" src={productImage(product)} alt={product.name} />
          </div>
          <div className="detail-copy">
            <span className="pill">{product.quantity > 0 ? `${product.quantity} in stock` : "Out of stock"}</span>
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            <strong className="price">Rs. {Number(product.price).toFixed(2)}</strong>
            {session && (
              <div className="quantity-control">
                <button type="button" onClick={() => changeQuantity(Math.max(1, quantity - 1))} title="Decrease">
                  <Minus size={17} />
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => changeQuantity(Math.min(maxQuantity, quantity + 1))} title="Increase">
                  <Plus size={17} />
                </button>
              </div>
            )}
            {session && (
              <div className="button-row">
                <button className="button" type="button" onClick={add} disabled={isUnavailable || busyAction === "cart"}>
                  <ShoppingCart size={18} />
                  {busyAction === "cart" ? "Adding..." : "Add to cart"}
                </button>
                <button className="button secondary" type="button" onClick={buyNow} disabled={isUnavailable || busyAction === "buy"}>
                  <CreditCard size={18} />
                  {busyAction === "buy" ? "Placing..." : "Buy now"}
                </button>
              </div>
            )}
            {checkoutSession && (
              <PaymentCheckout
                clientSecret={checkoutSession.clientSecret}
                intentId={checkoutSession.paymentId}
                amountLabel={checkoutSession.amountLabel}
                onPaid={handlePaymentComplete}
                onCancel={() => setCheckoutSession(null)}
              />
            )}
          </div>
        </section>
      )}
    </main>
  );
}
