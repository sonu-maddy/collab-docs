module.exports = ({ documentService }) => {
  // Get all documents
  const list = async (req, res) => {
    const documents = await documentService.list(req.userId);

    return res.status(200).json({ documents });
  };

  // Create document
  const create = async (req, res) => {
    const document = await documentService.create(req.userId, req.body);

    return res.status(201).json({ document });
  };

  // Import document from file
  const importFromFile = async (req, res) => {
    const document = await documentService.importFromFile(req.userId, req.file);

    return res.status(201).json({ document });
  };

  // Get single document
  const get = async (req, res) => {
    const document = await documentService.get(req.userId, req.params.id);

    return res.status(200).json({ document });
  };

  // Update document
  const update = async (req, res) => {
    const document = await documentService.update(
      req.userId,
      req.params.id,
      req.body,
    );

    return res.status(200).json({ document });
  };

  // Delete document
  const remove = async (req, res) => {
    await documentService.remove(req.userId, req.params.id);

    return res.status(204).end();
  };

  // Share document
  const share = async (req, res) => {
    const document = await documentService.share(
      req.userId,
      req.params.id,
      req.body,
    );

    return res.status(200).json({ document });
  };

  // Remove shared access
  const unshare = async (req, res) => {
    const document = await documentService.unshare(
      req.userId,
      req.params.id,
      req.params.userId,
    );

    return res.status(200).json({ document });
  };

  return {
    list,
    create,
    importFromFile,
    get,
    update,
    remove,
    share,
    unshare,
  };
};
