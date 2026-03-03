export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: {
          message: "Validation error",
          details: result.error.issues,
        },
      });
    }
    req.body = result.data;
    next();
  };
}