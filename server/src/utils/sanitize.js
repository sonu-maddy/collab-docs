const sanitizeHtml = require('sanitize-html');

// Only what the editor can produce. Anything else (scripts, styles, iframes...) is dropped.
const OPTIONS = {
  allowedTags: [
    'p', 'br', 'hr', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's',
    'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a',
  ],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
  },
};

const sanitize = (html) => sanitizeHtml(html || '', OPTIONS);

module.exports = { sanitize };
