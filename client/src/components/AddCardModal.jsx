import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { createSetupIntent } from "../api/payments.js";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#fff",
      fontFamily: "'Inter', sans-serif",
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": { color: "#94a3b8" }
    },
    invalid: { color: "#ef4444", iconColor: "#ef4444" }
  },
  hidePostalCode: true,
};

export default function AddCardModal({ isOpen, onClose, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Get SetupIntent client secret from our backend
      const { clientSecret } = await createSetupIntent();

      // 2. Confirm the card setup with Stripe
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        // Card successfully saved
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(10px)",
      zIndex: 1200,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
        borderRadius: "28px",
        padding: "2.5rem",
        maxWidth: "460px",
        width: "100%",
        boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
        position: "relative",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Add Payment Card</h2>
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.88rem", color: "var(--text-muted)" }}>
              Saved securely for one-click event purchases.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "var(--bg-hover)", border: "none", color: "var(--text-muted)", fontSize: "1.1rem", cursor: "pointer", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
          >×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Card Element */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              Card Details
            </label>
            <div style={{
              background: "var(--bg-input)",
              padding: "1.1rem 1.25rem",
              borderRadius: "16px",
              border: `1px solid ${error ? "#ef4444" : cardComplete ? "var(--accent)" : "var(--border-light)"}`,
              transition: "border-color 0.2s",
            }}>
              <CardElement
                options={CARD_ELEMENT_OPTIONS}
                onChange={e => {
                  setCardComplete(e.complete);
                  if (e.error) setError(e.error.message);
                  else setError(null);
                }}
              />
            </div>
          </div>

          {/* Test card hint */}
          <div style={{ padding: "0.75rem 1rem", background: "rgba(99,102,241,0.08)", borderRadius: "12px", border: "1px solid var(--accent-border)", marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--accent)" }}>Test Mode: </strong>
            Use card <code style={{ background: "var(--bg-hover)", padding: "0.1rem 0.4rem", borderRadius: "4px", color: "var(--text-main)" }}>4242 4242 4242 4242</code> with any future date &amp; any CVC.
          </div>

          {error && (
            <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", color: "#ef4444", fontSize: "0.85rem", marginBottom: "1.5rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: "0.85rem", borderRadius: "14px", border: "1px solid var(--border-light)", background: "transparent", color: "var(--text-main)", fontWeight: 600, cursor: "pointer", fontSize: "0.95rem" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!stripe || loading}
              style={{
                flex: 2, padding: "0.85rem", borderRadius: "14px", border: "none",
                background: loading ? "var(--bg-hover)" : "var(--primary)",
                color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.95rem", transition: "all 0.2s",
                opacity: (!stripe || loading) ? 0.7 : 1,
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Saving...
                </span>
              ) : "Save Card"}
            </button>
          </div>
        </form>

        {/* Stripe branding */}
        <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Secured by <strong style={{ color: "var(--text-main)" }}>Stripe</strong>. We never store your card details.
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
