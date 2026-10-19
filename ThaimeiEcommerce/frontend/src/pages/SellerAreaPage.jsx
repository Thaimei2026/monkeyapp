import { useSearchParams } from "react-router-dom";
import SellerStoresPage from "./SellerStoresPage";
import SellerProductsPage from "./SellerProductsPage";
import SellerOrdersPage from "./SellerOrdersPage";

export default function SellerAreaPage() {
  const [searchParams] = useSearchParams();

  const view = searchParams.get("view");

  if (view === "orders") return <SellerOrdersPage />;
  if (view === "products") return <SellerProductsPage />;
  return <SellerStoresPage />;
}
