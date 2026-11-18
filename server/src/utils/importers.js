const path = require('path');
const { marked } = require('marked');
const mammoth = require('mammoth');
const AppError = require('./AppError');
const { sanitize } = require('./sanitize');

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Plain text -> HTML: blank lines separate paragraphs, single newlines become <br>. */
function textToHtml(text) {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// Strategy table: add a new format by adding one entry here.
const IMPORTERS = {
  '.txt': async (buf) => textToHtml(buf.toString('utf8')),
  '.md': async (buf) => marked.parse(buf.toString('utf8'), { async: false }),
  '.docx': async (buf) => (await mammoth.convertToHtml({ buffer: buf })).value,
};

const SUPPORTED_EXTENSIONS = Object.keys(IMPORTERS);

/** Returns { title, content } for an uploaded file, or throws a 400 AppError. */
async function importFile({ originalname, buffer }) {
  const ext = path.extname(originalname || '').toLowerCase();
  const importer = IMPORTERS[ext];
  if (!importer) {
    throw AppError.badRequest(`Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
  }
  let html;
  try {
    html = await importer(buffer);
  } catch {
    throw AppError.badRequest('The file could not be read. Is it corrupted?');
  }
  const title = path.basename(originalname, ext).slice(0, 200) || 'Imported document';
  return { title, content: sanitize(html) };
}

module.exports = { importFile, textToHtml, SUPPORTED_EXTENSIONS };
