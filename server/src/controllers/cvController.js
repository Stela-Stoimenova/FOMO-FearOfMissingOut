import * as cvService from "../services/cvService.js";

export async function listByUser(req, res, next) {
  try {
    const entries = await cvService.listByUser(req.params.userId);
    res.json(entries);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const entry = await cvService.create(req.user.id, req.body);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const entry = await cvService.update(req.params.entryId, req.user.id, req.body);
    res.json(entry);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await cvService.remove(req.params.entryId, req.user.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
