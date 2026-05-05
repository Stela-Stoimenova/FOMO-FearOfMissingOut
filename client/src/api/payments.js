import { apiRequest } from "./client.js";

/**
 * Get the Stripe Connect onboarding URL for the logged-in Studio/Agency.
 */
export async function getStripeOnboardingLink() {
    return apiRequest("/payments/onboarding");
}

/**
 * Check if the Stripe Connect onboarding is complete.
 */
export async function checkStripeStatus() {
    return apiRequest("/payments/status");
}

/**
 * List saved payment methods (cards) for the logged-in Dancer.
 */
export async function getWallet() {
    return apiRequest("/payments/wallet");
}

/**
 * Detach/Delete a saved card.
 */
export async function deleteCard(cardId) {
    return apiRequest(`/payments/wallet/${cardId}`, { method: "DELETE" });
}

export async function createSetupIntent() {
    return apiRequest("/payments/setup-intent", { method: "POST" });
}
