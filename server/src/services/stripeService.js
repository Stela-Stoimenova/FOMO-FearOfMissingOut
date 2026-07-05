import Stripe from "stripe";
import { prisma } from "../db.js";

let _stripe = null;

function getStripe() {
  if (_stripe) return _stripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    const err = new Error("Stripe is not configured on this server");
    err.status = 503;
    throw err;
  }
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10", timeout: 8000 });
  return _stripe;
}

export async function getOrCreateCustomer(userId) {
  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId: String(userId) },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createConnectOnboardingLink(userId) {
  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  let accountId = user.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { userId: String(userId) },
    });
    accountId = account.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeConnectAccountId: accountId },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.CLIENT_URL || "http://localhost:5174"}/profile?stripe=refresh`,
    return_url: `${process.env.CLIENT_URL || "http://localhost:5174"}/profile?stripe=success`,
    type: "account_onboarding",
  });

  return accountLink.url;
}

export async function syncConnectStatus(userId) {
  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user.stripeConnectAccountId) return false;

  const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
  const complete = account.details_submitted;

  if (complete !== user.stripeOnboardingComplete) {
    await prisma.user.update({
      where: { id: userId },
      data: { stripeOnboardingComplete: complete },
    });
  }

  return complete;
}

export async function createCardSetupIntent(userId) {
  const stripe = getStripe();
  const customerId = await getOrCreateCustomer(userId);
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
  });
  return {
    clientSecret: setupIntent.client_secret,
    customerId,
  };
}

export async function listSavedCards(userId) {
  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user.stripeCustomerId) return [];

  const paymentMethods = await stripe.paymentMethods.list({
    customer: user.stripeCustomerId,
    type: "card",
  });

  return paymentMethods.data.map(pm => ({
    id: pm.id,
    brand: pm.card.brand,
    last4: pm.card.last4,
    expMonth: pm.card.exp_month,
    expYear: pm.card.exp_year,
  }));
}

export async function deleteSavedCard(userId, paymentMethodId) {
  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (pm.customer !== user.stripeCustomerId) {
    const err = new Error("Not your payment method");
    err.status = 403;
    throw err;
  }

  await stripe.paymentMethods.detach(paymentMethodId);
  return { success: true };
}
