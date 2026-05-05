import { prisma } from "../db.js";
import { BUSINESS } from "../config/business.js";

export async function createIntent(req, res, next) {
  try {
    const { eventId, usePoints } = req.body;
    const userId = req.user.userId;

    if (!eventId) {
      return res.status(400).json({ error: { message: "eventId required", status: 400 } });
    }

    const event = await prisma.event.findUnique({ where: { id: Number(eventId) } });
    if (!event) return res.status(404).json({ error: { message: "Event not found", status: 404 } });

    // Compute final price (mirrors purchaseTicket logic)
    let finalPrice = event.priceCents;
    if (event.capacity != null && event.capacity > 0) {
      const sold = await prisma.ticket.count({ where: { eventId: event.id, status: "VALID" } });
      if (sold > event.capacity * BUSINESS.SURGE_THRESHOLD) {
        finalPrice = Math.round(event.priceCents * (1 + BUSINESS.SURGE_RATE));
      }
    }

    let discountCents = 0;
    if (usePoints) {
      const loyalty = await prisma.loyaltyAccount.findUnique({ where: { userId } });
      if (loyalty && loyalty.points > 0) {
        const potential = loyalty.points * BUSINESS.POINT_TO_CENT;
        const maxDiscount = Math.floor(finalPrice * BUSINESS.LOYALTY_MAX_DISCOUNT_RATE);
        discountCents = Math.min(potential, maxDiscount);
      }
    }

    const chargeCents = finalPrice - discountCents;

    // Demo / no-Stripe-key mode
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({
        clientSecret: null,
        simulatedMode: true,
        amount: chargeCents,
        currency: "eur",
        message: "Stripe not configured — payment is simulated.",
      });
    }

    // Lazily load stripe so the server boots fine without the package
    let Stripe;
    try {
      ({ default: Stripe } = await import("stripe"));
    } catch {
      return res.json({
        clientSecret: null,
        simulatedMode: true,
        amount: chargeCents,
        currency: "eur",
        message: "Stripe package unavailable — payment is simulated.",
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" });
    const intent = await stripe.paymentIntents.create({
      amount: Math.max(chargeCents, 50), // Stripe minimum is 50 cents
      currency: "eur",
      metadata: { eventId: String(eventId), userId: String(userId) },
    });

    res.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      simulatedMode: false,
      amount: chargeCents,
      currency: "eur",
    });
  } catch (err) {
    next(err);
  }
}
