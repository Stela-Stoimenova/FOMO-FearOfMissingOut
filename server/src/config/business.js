export const BUSINESS = Object.freeze({
  COMMISSION_RATE: 0.10,
  LOYALTY_EARN_RATE: 0.01,
  SURGE_RATE: 0.15,
  SURGE_THRESHOLD: 0.50,
  POINT_TO_CENT: 1,
  // Time-based refund tiers (applied to what the user paid after discount)
  CANCEL_REFUND_RATE_EARLY: 0.80,   // 7+ days before event
  CANCEL_REFUND_RATE_MID: 0.50,     // 2–7 days before event
  CANCEL_REFUND_RATE_LATE: 0.00,    // under 48h before event
  // Loyalty points can cover at most 15% of the ticket price
  LOYALTY_MAX_DISCOUNT_RATE: 0.15,
});
