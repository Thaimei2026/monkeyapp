import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HomePage({ session }) {
  const isGuest = !session;

  return (
    <main className="home">
      <section className="hero app-hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> {session?.role || "A smarter marketplace"}</span>
          <h1>Style that feels<br />like <em>you.</em></h1>
          <p>
            {session
              ? `Welcome back, ${session.username}. Your ${String(session.role || "customer").toLowerCase()} workspace is ready.`
              : "Discover everyday essentials, independent stores, and a checkout built to keep up with you."}
          </p>
          <div className="hero-actions">
            <Link className="button hero-button" to="/products">
              Browse Products
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        <div className="hero-orb" aria-hidden="true" />
      </section>

      <section className="trust-bar" aria-label="Store benefits">
        <span>Curated stores</span>
        <span>Secure payments</span>
        <span>Simple returns</span>
        <span>Real-time orders</span>
      </section>

    </main>
  );
}
