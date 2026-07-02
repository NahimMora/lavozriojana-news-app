const paragraphPattern = /<p\b[^>]*>[\s\S]*?<\/p>/gi;

function textFromHtmlFragment(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitFirstArticleParagraph(html: string | null | undefined) {
  const source = html || '';
  paragraphPattern.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = paragraphPattern.exec(source))) {
    const firstParagraphHtml = match[0];
    if (!textFromHtmlFragment(firstParagraphHtml)) continue;

    return {
      firstParagraphHtml,
      restHtml: `${source.slice(0, match.index)}${source.slice(match.index + firstParagraphHtml.length)}`.trim()
    };
  }

  return {
    firstParagraphHtml: '',
    restHtml: source
  };
}

export function splitArticleHtmlAfterParagraphs(html: string | null | undefined, paragraphCount: number) {
  const source = html || '';
  if (paragraphCount <= 0) {
    return { beforeHtml: '', afterHtml: source };
  }

  paragraphPattern.lastIndex = 0;
  let seen = 0;
  let splitAt = 0;
  let match: RegExpExecArray | null;

  while ((match = paragraphPattern.exec(source))) {
    if (!textFromHtmlFragment(match[0])) continue;
    seen += 1;

    if (seen === paragraphCount) {
      splitAt = match.index + match[0].length;
      break;
    }
  }

  if (!splitAt) {
    return { beforeHtml: source, afterHtml: '' };
  }

  return {
    beforeHtml: source.slice(0, splitAt).trim(),
    afterHtml: source.slice(splitAt).trim()
  };
}
