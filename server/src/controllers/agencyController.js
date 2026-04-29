import * as agencyService from "../services/agencyService.js";

export async function getCollaborations(req, res, next) {
  try {
    const collabs = await agencyService.getAgencyCollaborations(req.user.userId);
    res.json(collabs);
  } catch (err) { next(err); }
}

export async function acceptCollaboration(req, res, next) {
  try {
    const collab = await agencyService.acceptCollaboration(req.user.userId, req.params.studioId);
    res.json(collab);
  } catch (err) { next(err); }
}

export async function declineCollaboration(req, res, next) {
  try {
    const result = await agencyService.declineCollaboration(req.user.userId, req.params.studioId);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getRoster(req, res, next) {
  try {
    const roster = await agencyService.getAgencyRoster(req.user.userId);
    res.json(roster);
  } catch (err) { next(err); }
}

export async function addToRoster(req, res, next) {
  try {
    const entry = await agencyService.addToRoster(req.user.userId, req.body);
    res.status(201).json(entry);
  } catch (err) { next(err); }
}

export async function removeFromRoster(req, res, next) {
  try {
    await agencyService.removeFromRoster(req.user.userId, req.params.dancerId);
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function getTaggedCvEntries(req, res, next) {
  try {
    const entries = await agencyService.getTaggedCvEntries(req.user.userId);
    res.json(entries);
  } catch (err) { next(err); }
}
