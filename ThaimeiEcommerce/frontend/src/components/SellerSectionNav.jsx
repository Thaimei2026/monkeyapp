import { Link, useLocation } from "react-router-dom";

export default function SellerSectionNav() {
  const location = useLocation();
  const view = new URLSearchParams(location.search).get("view") || "stores";

  return (
    <nav className="seller-section-nav" aria-label="Seller workspace sections">
      <Link className={view === "stores" ? "active" : ""} to="/seller?view=stores">
        Stores
      </Link>
      <Link className={view === "products" ? "active" : ""} to="/seller?view=products">
        Products
      </Link>
      <Link className={view === "orders" ? "active" : ""} to="/seller?view=orders">
        Orders
      </Link>
    </nav>
  );
}
