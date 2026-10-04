export const validateRequired = (
  fields
) => {
  return (req, res, next) => {
    const missing = fields.filter(
      (field) =>
        req.body[field] === undefined ||
        req.body[field] === null ||
        req.body[field] === ""
    );

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
        fields: missing
      });
    }

    next();
  };
};