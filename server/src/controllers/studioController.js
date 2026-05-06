import * as studioService from "../services/studioService.js";
import { prisma } from "../db.js";
import * as stripeService from "../services/stripeService.js";

// --- Weekly Classes ---
export async function listClasses(req, res, next) {
  try {
    const classes = await studioService.listClasses(req.params.id);
    res.json(classes);
  } catch (err) { next(err); }
}

export async function createClass(req, res, next) {
  try {
    const newClass = await studioService.createClass(req.user.userId, req.body);
    res.status(201).json(newClass);
  } catch (err) { next(err); }
}

export async function updateClass(req, res, next) {
  try {
    const updated = await studioService.updateClass(req.params.classId, req.user.userId, req.body);
    res.json(updated);
  } catch (err) { next(err); }
}

export async function removeClass(req, res, next) {
  try {
    await studioService.removeClass(req.params.classId, req.user.userId);
    res.status(204).end();
  } catch (err) { next(err); }
}

// --- Memberships ---

// Public: only active tiers
export async function listMemberships(req, res, next) {
  try {
    const tiers = await studioService.listMemberships(req.params.id);
    res.json(tiers);
  } catch (err) { next(err); }
}

// Studio owner: all tiers including inactive (for management)
export async function listOwnMemberships(req, res, next) {
  try {
    const tiers = await studioService.listAllMemberships(req.user.userId);
    res.json(tiers);
  } catch (err) { next(err); }
}

export async function createMembership(req, res, next) {
  try {
    const tier = await studioService.createMembership(req.user.userId, req.body);
    res.status(201).json(tier);
  } catch (err) { next(err); }
}

export async function updateMembership(req, res, next) {
  try {
    const updated = await studioService.updateMembership(req.params.tierId, req.user.userId, req.body);
    res.json(updated);
  } catch (err) { next(err); }
}

export async function removeMembership(req, res, next) {
  try {
    await studioService.removeMembership(req.params.tierId, req.user.userId);
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function createMembershipPaymentIntent(req, res, next) {
  try {
    const { tierId } = req.params;
    const userId = req.user.userId;

    const tier = await prisma.membershipTier.findUnique({ where: { id: Number(tierId) } });
    if (!tier || !tier.isActive) {
      return res.status(404).json({ error: { message: "Membership tier not found or inactive", status: 404 } });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({ clientSecret: null, simulatedMode: true, amount: tier.priceCents, currency: "eur" });
    }

    let Stripe;
    try {
      ({ default: Stripe } = await import("stripe"));
    } catch {
      return res.json({ clientSecret: null, simulatedMode: true, amount: tier.priceCents, currency: "eur" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" });
    const customerId = await stripeService.getOrCreateCustomer(userId);

    const intentParams = {
      amount: Math.max(tier.priceCents, 50),
      currency: "eur",
      customer: customerId,
      metadata: { tierId: String(tierId), userId: String(userId) },
    };

    const { paymentMethodId } = req.body;
    if (paymentMethodId) {
      intentParams.payment_method = paymentMethodId;
      intentParams.confirm = true;
      intentParams.off_session = false;
      intentParams.return_url = `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard?payment=success`;
    }

    const intent = await stripe.paymentIntents.create(intentParams);
    res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id, status: intent.status, simulatedMode: false, amount: tier.priceCents, currency: "eur" });
  } catch (err) { next(err); }
}

export async function purchaseMembership(req, res, next) {
  try {
    const purchase = await studioService.purchaseMembership(req.params.tierId, req.user.userId);
    res.status(201).json(purchase);
  } catch (err) { next(err); }
}

// Dancer's purchased memberships
export async function getMyMemberships(req, res, next) {
  try {
    const memberships = await studioService.getMyMemberships(req.user.userId);
    res.json(memberships);
  } catch (err) { next(err); }
}

// --- Team ---
export async function listTeam(req, res, next) {
  try {
    const team = await studioService.listTeam(req.params.id);
    res.json(team);
  } catch (err) { next(err); }
}

export async function addTeamMember(req, res, next) {
  try {
    const member = await studioService.addTeamMember(req.user.userId, req.body);
    res.status(201).json(member);
  } catch (err) { next(err); }
}

export async function removeTeamMember(req, res, next) {
  try {
    await studioService.removeTeamMember(req.params.teamId, req.user.userId);
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function listPublicCvTags(req, res, next) {
  try {
    const tags = await studioService.getPublicCvTags(req.params.id);
    res.json(tags);
  } catch (err) { next(err); }
}

// --- Collaborations ---
export async function listCollaborations(req, res, next) {
  try {
    const collabs = await studioService.listCollaborations(req.params.id);
    res.json(collabs);
  } catch (err) { next(err); }
}

export async function addCollaboration(req, res, next) {
  try {
    const collab = await studioService.addCollaboration(req.user.userId, req.body);
    res.status(201).json(collab);
  } catch (err) { next(err); }
}

export async function removeCollaboration(req, res, next) {
  try {
    await studioService.removeCollaboration(req.params.agencyId, req.user.userId);
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function acceptAgencyCollaboration(req, res, next) {
  try {
    const collab = await studioService.acceptAgencyInvite(req.user.userId, req.params.agencyId);
    res.json(collab);
  } catch (err) { next(err); }
}

export async function getTaggedCvEntries(req, res, next) {
  try {
    const entries = await studioService.getTaggedCvEntries(req.user.userId);
    res.json(entries);
  } catch (err) { next(err); }
}

export async function acceptCvTag(req, res, next) {
  try {
    const cv = await studioService.acceptCvTag(req.user.userId, req.params.cvId);
    res.json(cv);
  } catch (err) { next(err); }
}

export async function declineCvTag(req, res, next) {
  try {
    const cv = await studioService.declineCvTag(req.user.userId, req.params.cvId);
    res.json(cv);
  } catch (err) { next(err); }
}
