import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession, hasRole, ROLES } from "../lib/api";

export default function AppShell({ session, onLogout }) {
  const navigate = useNavigate();
  const isAdmin = hasRole(session, ROLES.ADMIN);
  const isSeller = hasRole(session, ROLES.SELLER);
  const isCustomer = hasRole(session, ROLES.CUSTOMER);
  const displayName = session?.username || session?.userName || "Account";

  function logout() {
    clearSession();
    onLogout?.();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">T</span>
          <span><strong>Thaimei</strong><small>Modern marketplace</small></span>
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          {(!session || isCustomer) && <NavLink to="/products">Browse Products</NavLink>}
          {session && isCustomer && <>
            <NavLink to="/cart">Cart</NavLink>
            <NavLink to="/orders">Order history</NavLink>
            <NavLink to="/payments">Payments</NavLink>
          </>}
          {session && !isAdmin && <NavLink to="/profile">Profile</NavLink>}
          {isSeller && <NavLink to="/seller" end>Seller</NavLink>}
          {isAdmin && <><NavLink to="/admin">Admin</NavLink><NavLink to="/admin/register">Add admin</NavLink></>}
        </nav>
        {session ? (
          <div className="account-actions">
            <Link className="account-chip" to={isAdmin ? "/admin" : isSeller ? "/seller" : "/profile"} title="Open workspace">
              <span>{displayName.charAt(0).toUpperCase()}</span><strong>{displayName}</strong>
            </Link>
            <button className="icon-button signout-button" type="button" onClick={logout} title="Sign out" aria-label="Sign out">↪</button>
          </div>
        ) : <Link className="button compact" to="/login">Login</Link>}
      </header>
      <Outlet />
      <footer className="site-footer">
        <div className="footer-brand">
          <Link className="brand" to="/"><span className="brand-mark">T</span><strong>Thaimei</strong></Link>
          <p>A more thoughtful way to discover, buy, and grow with independent commerce.</p>
        </div>
        {session && <div className="footer-links">
          <div><span>Marketplace</span><Link to="/products">Browse Products</Link>{isCustomer && <Link to="/orders">Your orders</Link>}</div>
          <div><span>Account</span><Link to={isSeller ? "/seller" : isAdmin ? "/admin" : "/profile"}>Your workspace</Link>{isCustomer && <Link to="/payments">Payment status</Link>}</div>
        </div>}
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Thaimei</span></div>
      </footer>
    </div>
  );
}
