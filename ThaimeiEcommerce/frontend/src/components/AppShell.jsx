import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CreditCard,
  LogOut,
  Package,
  RotateCcw,
  ShieldPlus,
  ShoppingBag,
  ShoppingCart,
  Store,
  UserRound,
  UsersRound
} from "lucide-react";
import { clearSession, hasRole, ROLES } from "../lib/api";

export default function AppShell({ session, onLogout }) {
  const navigate = useNavigate();
  const isAdmin = hasRole(session, ROLES.ADMIN);
  const isSeller = hasRole(session, ROLES.SELLER);
  const isCustomer = !session || hasRole(session, ROLES.CUSTOMER);
  const displayName = session?.username || session?.userName || "Account";

  function logout() {
    clearSession();
    onLogout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <div className="announcement-bar">
        <span>New season, considered choices.</span>
        <Link to={session ? "/products" : "/signup"}>Explore Thaimei <ArrowUpRight size={13} /></Link>
      </div>
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">T</span>
          <span>
            <strong>Thaimei</strong>
            <small>Modern marketplace</small>
          </span>
        </Link>

        <nav className="nav" aria-label="Primary navigation">
          <NavLink to="/products">
            <ShoppingBag size={18} />
            Start Shopping
          </NavLink>
          {session && isCustomer && (
            <>
              <NavLink to="/cart">
                <ShoppingCart size={18} />
                Cart
              </NavLink>
              <NavLink to="/orders">
                <Package size={18} />
                Order history
              </NavLink>
              <NavLink to="/payments">
                <CreditCard size={18} />
                Payments
              </NavLink>
              <NavLink to="/returns">
                <RotateCcw size={18} />
                Returns
              </NavLink>
            </>
          )}
          {session && !isAdmin && (
            <NavLink to="/profile">
              <UserRound size={18} />
              Profile
            </NavLink>
          )}
          {isSeller && (
            <NavLink to="/seller" end>
              <Store size={18} />
              Seller
            </NavLink>
          )}
          {isAdmin && (
            <>
              <NavLink to="/admin">
                <UsersRound size={18} />
                Admin
              </NavLink>
              <NavLink to="/admin/register">
                <ShieldPlus size={18} />
                Add admin
              </NavLink>
            </>
          )}
        </nav>

        {session ? (
          <div className="account-actions">
            <Link className="account-chip" to={isAdmin ? "/admin" : isSeller ? "/seller" : "/profile"} title="Open workspace">
              <span>{displayName.charAt(0).toUpperCase()}</span>
              <strong>{displayName}</strong>
            </Link>
            <button className="icon-button signout-button" type="button" onClick={logout} title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link className="button compact" to="/login">
            Sign in
          </Link>
        )}
      </header>
      <Outlet />
      <footer className="site-footer">
        <div className="footer-brand">
          <Link className="brand" to="/">
            <span className="brand-mark">T</span>
            <strong>Thaimei</strong>
          </Link>
          <p>A more thoughtful way to discover, buy, and grow with independent commerce.</p>
        </div>
        <div className="footer-links">
          <div>
            <span>Marketplace</span>
            <Link to="/products">Shop all</Link>
            {session && isCustomer && <Link to="/orders">Your orders</Link>}
            {session && isCustomer && <Link to="/returns">Returns</Link>}
          </div>
          <div>
            <span>Account</span>
            {session ? <Link to={isSeller ? "/seller" : isAdmin ? "/admin" : "/profile"}>Your workspace</Link> : <Link to="/login">Sign in</Link>}
            {!session && <Link to="/seller-signup">Sell with us</Link>}
            {session && isCustomer && <Link to="/payments">Payment status</Link>}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Thaimei</span>
          <span>Secure checkout · Order tracking · Easy returns</span>
        </div>
      </footer>
    </div>
  );
}
