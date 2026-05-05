import { prisma } from "../db.js";
import { BUSINESS } from "../config/business.js";
import * as stripeService from "../services/stripeService.js";

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
    
    const { paymentMethodId } = req.body;
    const customerId = await stripeService.getOrCreateCustomer(userId);

    const intentParams = {
      amount: Math.max(chargeCents, 50),
      currency: "eur",
      customer: customerId,
      metadata: { eventId: String(eventId), userId: String(userId) },
    };

    if (paymentMethodId) {
      intentParams.payment_method = paymentMethodId;
      intentParams.confirm = true;
      intentParams.off_session = false; // user is present
      intentParams.return_url = `${process.env.CLIENT_URL || "http://localhost:5173"}/events/${eventId}?payment=success`;
    }

    const intent = await stripe.paymentIntents.create(intentParams);

    res.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      status: intent.status,
      simulatedMode: false,
      amount: chargeCents,
      currency: "eur",
    });
  } catch (err) {
    next(err);
  }
}

export async function getOnboardingLink(req, res, next) {
  try {
    const url = await stripeService.createConnectOnboardingLink(req.user.userId);
    res.json({ url });
  } catch (err) { next(err); }
}

export async function checkConnectStatus(req, res, next) {
  try {
    const complete = await stripeService.syncConnectStatus(req.user.userId);
    res.json({ complete });
  } catch (err) { next(err); }
}

export async function getWallet(req, res, next) {
  try {
    const cards = await stripeService.listSavedCards(req.user.userId);
    res.json(cards);
  } catch (err) { next(err); }
}

export async function removeCard(req, res, next) {
  try {
    await stripeService.deleteSavedCard(req.user.userId, req.params.cardId);
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function createSetupIntent(req, res, next) {
  try {
    const { clientSecret } = await stripeService.createCardSetupIntent(req.user.userId);
    res.json({ clientSecret });
  } catch (err) { next(err); }
}
