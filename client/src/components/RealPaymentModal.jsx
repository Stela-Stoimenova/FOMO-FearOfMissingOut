import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

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


export default function RealPaymentModal({ isOpen, amount, onConfirm, onCancel, loading, savedCards = [] }) {
    const stripe = useStripe();
    const elements = useElements();
    const [selectedCardId, setSelectedCardId] = useState(savedCards.length > 0 ? savedCards[0].id : "new");
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    async function handleSubmit(e) {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        setError(null);

        try {
            if (selectedCardId === "new") {
                // Pass the CardElement to the parent to confirm with Stripe
                onConfirm({ type: "new", element: elements.getElement(CardElement) });
            } else {
                // Use a saved card — pass the Stripe PaymentMethod ID
                onConfirm({ type: "saved", cardId: selectedCardId });
            }
        } catch (err) {
            setError(err.message);
            setIsProcessing(false);
        }
    }

    const isBusy = loading || isProcessing;

    return (
        <div style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(12px)",
            zIndex: 1100,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
        }}>
            <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                borderRadius: "28px",
                padding: "2.5rem",
                maxWidth: "500px",
                width: "100%",
                boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
            }}>
                {/* Header */}
                <div style={{ marginBottom: "2rem" }}>
                    <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 800 }}>Complete Purchase</h2>
                    <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>
                        Your ticket will be issued immediately after payment.
                    </p>
                </div>

                {/* Amount summary */}
                <div style={{
                    background: "linear-gradient(135deg, var(--accent-soft), var(--bg-hover))",
                    padding: "1.25rem 1.5rem",
                    borderRadius: "18px",
                    marginBottom: "1.75rem",
                    border: "1px solid var(--accent-border)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                    <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Total to pay</div>
                        <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-main)", marginTop: "0.2rem" }}>
                            €{(amount / 100).toFixed(2)}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Saved cards list */}
                    {savedCards.length > 0 && (
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                                Payment Method
                            </label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {savedCards.map(c => (
                                    <label
                                        key={c.id}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "0.75rem",
                                            padding: "0.9rem 1.1rem",
                                            background: selectedCardId === c.id ? "rgba(99,102,241,0.12)" : "var(--bg-input)",
                                            border: `1px solid ${selectedCardId === c.id ? "var(--accent)" : "var(--border-light)"}`,
                                            borderRadius: "14px",
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="card"
                                            checked={selectedCardId === c.id}
                                            onChange={() => setSelectedCardId(c.id)}
                                            style={{ accentColor: "var(--accent)", width: "16px", height: "16px" }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                                                {c.brand?.toUpperCase()} •••• {c.last4}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                Expires {String(c.expMonth).padStart(2, "0")}/{String(c.expYear).slice(-2)}
                                            </div>
                                        </div>
                                        {selectedCardId === c.id && (
                                            <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 700 }}>Selected</span>
                                        )}
                                    </label>
                                ))}

                                {/* New card option */}
                                <label style={{
                                    display: "flex", alignItems: "center", gap: "0.75rem",
                                    padding: "0.9rem 1.1rem",
                                    background: selectedCardId === "new" ? "rgba(99,102,241,0.12)" : "var(--bg-input)",
                                    border: `1px solid ${selectedCardId === "new" ? "var(--accent)" : "var(--border-light)"}`,
                                    borderRadius: "14px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}>
                                    <input
                                        type="radio"
                                        name="card"
                                        checked={selectedCardId === "new"}
                                        onChange={() => setSelectedCardId("new")}
                                        style={{ accentColor: "var(--accent)", width: "16px", height: "16px" }}
                                    />
                                    <span style={{ fontSize: "1.2rem" }}>+</span>
                                    <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>Use a different card</div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* New card input */}
                    {selectedCardId === "new" && (
                        <div style={{ marginBottom: "1.5rem" }}>
                            {savedCards.length === 0 && (
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
                                    Card Details
                                </label>
                            )}
                            <div style={{
                                background: "var(--bg-input)",
                                padding: "1.1rem 1.25rem",
                                borderRadius: "16px",
                                border: "1px solid var(--border-light)",
                            }}>
                                <CardElement options={CARD_ELEMENT_OPTIONS} />
                            </div>
                            <p style={{ margin: "0.6rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                Test: <code style={{ background: "var(--bg-hover)", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>4242 4242 4242 4242</code> · any future date · any CVC
                            </p>
                        </div>
                    )}

                    {error && (
                        <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", color: "#ef4444", fontSize: "0.85rem", marginBottom: "1.5rem", display: "flex", gap: "0.5rem" }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "1rem" }}>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isBusy}
                            style={{ flex: 1, padding: "0.85rem", borderRadius: "14px", border: "1px solid var(--border-light)", background: "transparent", color: "var(--text-main)", fontWeight: 600, cursor: isBusy ? "not-allowed" : "pointer", fontSize: "0.95rem" }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!stripe || isBusy}
                            style={{
                                flex: 2, padding: "0.85rem", borderRadius: "14px", border: "none",
                                background: isBusy ? "var(--bg-hover)" : "var(--primary)",
                                color: "#fff", fontWeight: 700,
                                cursor: (!stripe || isBusy) ? "not-allowed" : "pointer",
                                fontSize: "0.95rem", transition: "all 0.2s",
                                opacity: (!stripe || isBusy) ? 0.7 : 1,
                            }}
                        >
                            {isBusy ? (
                                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                    <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    Processing…
                                </span>
                            ) : `Pay €${(amount / 100).toFixed(2)}`}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Payments secured by <strong style={{ color: "var(--text-main)" }}>Stripe</strong>
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
