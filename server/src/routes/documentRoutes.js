const { Router } = require("express");
const { z } = require("zod");

const validate = require("../middleware/validate");
const upload = require("../middleware/upload");
const { requireAuth } = require("../middleware/auth");

// Validation schemas
const title = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(200, "Title is too long");

const content = z.string().max(2_000_000, "Document is too large");

const createSchema = z.object({
  title: title.optional(),
  content: content.optional(),
});

const updateSchema = z
  .object({
    title: title.optional(),
    content: content.optional(),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined, {
    message: "Nothing to update",
  });

const shareSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),

  role: z.enum(["viewer", "editor"]),
});

module.exports = ({ documentController }) => {
  const router = Router();

  // All document routes require authentication
  router.use(requireAuth);

  // Get all documents
  router.get("/", documentController.list);

  // Create document
  router.post("/", validate(createSchema), documentController.create);

  // Import document from file
  router.post(
    "/import",
    upload.single("file"),
    documentController.importFromFile,
  );

  // Get single document
  router.get("/:id", documentController.get);

  // Update document
  router.patch("/:id", validate(updateSchema), documentController.update);

  // Delete document
  router.delete("/:id", documentController.remove);

  // Share document
  router.post("/:id/share", validate(shareSchema), documentController.share);

  // Remove shared access
  router.delete("/:id/share/:userId", documentController.unshare);

  return router;
};
