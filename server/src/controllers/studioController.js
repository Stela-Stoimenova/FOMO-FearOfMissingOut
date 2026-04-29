import * as studioService from "../services/studioService.js";

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
