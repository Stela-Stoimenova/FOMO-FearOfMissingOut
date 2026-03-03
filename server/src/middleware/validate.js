export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((e) => e.message).join("; ");
      const err = new Error(message);
      err.status = 400;
      return next(err);
    }
    req.body = result.data;
    return next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.issues.map((e) => e.message).join("; ");
      const err = new Error(message);
      err.status = 400;
      return next(err);
    }
    req.query = result.data;
    return next();
  };
}