import sanitizeHtml from 'sanitize-html';

const editorialClasses = [
  'lr-*',
  'alignleft',
  'alignright',
  'aligncenter'
];

export function sanitizeArticleHtml(value: string) {
  return sanitizeHtml(value || '', {
    allowedTags: [
      'h2',
      'h3',
      'h4',
      'p',
      'strong',
      'b',
      'em',
      'i',
      'blockquote',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'figure',
      'figcaption',
      'div',
      'span',
      'br',
      'hr'
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
      figure: ['class'],
      figcaption: ['class'],
      div: ['class'],
      span: ['class'],
      p: ['class'],
      blockquote: ['class'],
      h2: ['class'],
      h3: ['class'],
      h4: ['class'],
      ul: ['class'],
      ol: ['class'],
      li: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https']
    },
    allowedClasses: {
      '*': editorialClasses
    },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          target: attribs.target || '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      img: (_tagName, attribs) => ({
        tagName: 'img',
        attribs: {
          ...attribs,
          loading: attribs.loading || 'lazy',
          decoding: attribs.decoding || 'async'
        }
      })
    }
  });
}

export function plainTextFromHtml(value: string) {
  return sanitizeHtml(value || '', {
    allowedTags: [],
    allowedAttributes: {}
  })
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizePlainText(value: string, maxLength = 5000) {
  return sanitizeHtml(value || '', {
    allowedTags: [],
    allowedAttributes: {}
  })
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeCommentBody(value: string) {
  return sanitizePlainText(value, 1200)
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\bwww\.\S+/gi, '')
    .trim();
}
