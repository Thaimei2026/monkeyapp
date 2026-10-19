import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { loadSession } from "./lib/api";
import AdminPage from "./pages/AdminPage";
import AdminRegistrationPage from "./pages/AdminRegistrationPage";
import AuthPage from "./pages/AuthPage";
import CartPage from "./pages/CartPage";
import HomePage from "./pages/HomePage";
import OrdersPage from "./pages/OrdersPage";
import PaymentsPage from "./pages/PaymentsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductsPage from "./pages/ProductsPage";
import ProfilePage from "./pages/ProfilePage";
import ReturnsPage from "./pages/ReturnsPage";
import SellerAreaPage from "./pages/SellerAreaPage";

export default function App() {
  const [session, setSession] = useState(() => loadSession());

  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" onSession={setSession} />} />
      <Route path="/signup" element={<AuthPage mode="signup" onSession={setSession} />} />
      <Route path="/admin-login" element={<AuthPage mode="admin" onSession={setSession} />} />
      <Route path="/seller-login" element={<AuthPage mode="seller" onSession={setSession} />} />
      <Route path="/seller-signup" element={<AuthPage mode="seller-signup" onSession={setSession} />} />
      <Route element={<AppShell session={session} onLogout={() => setSession(null)} />}>
        <Route path="/" element={<HomePage session={session} />} />
        <Route path="/products" element={<ProductsPage session={session} />} />
        <Route path="/products/:id" element={<ProductDetailPage session={session} />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute session={session}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute session={session}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute session={session}>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/returns"
          element={
            <ProtectedRoute session={session}>
              <ReturnsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute session={session}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller"
          element={
            <ProtectedRoute session={session} sellerOnly>
              <SellerAreaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={<Navigate to="/seller?view=orders" replace />}
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute session={session} adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/register"
          element={
            <ProtectedRoute session={session} adminOnly>
              <AdminRegistrationPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
