import type { ReactNode } from 'react';

const ESCAPABLE = /[\\`*_[\]()#+\-.!>~|]/u;
const SAFE_LINK = /^(?:https?:\/\/|mailto:)/iu;

interface Span {
  node: ReactNode;
  end: number;
}

export function renderInline(text: string, keyPrefix = 'i'): ReactNode[] {
  const nodes: ReactNode[] = [];
  let plain = '';
  let index = 0;

  const flush = () => {
    if (plain !== '') nodes.push(plain);
    plain = '';
  };

  for (let char = text[index]; char !== undefined; char = text[index]) {
    const escaped = char === '\\' ? (text[index + 1] ?? '') : '';
    if (ESCAPABLE.test(escaped)) {
      plain += escaped;
      index += 2;
      continue;
    }

    const span = spanAt(text, index, `${keyPrefix}-${nodes.length}`);
    if (span === null) {
      plain += char;
      index += 1;
    } else {
      flush();
      nodes.push(span.node);
      index = span.end;
    }
  }
  flush();

  return nodes;
}

function spanAt(text: string, index: number, key: string): Span | null {
  const char = text[index];

  if (char === '`') {
    const close = text.indexOf('`', index + 1);
    if (close <= index + 1) return null;
    return {
      node: (
        <code key={key} className="bg-muted rounded px-1 font-mono text-[0.9em]">
          {text.slice(index + 1, close)}
        </code>
      ),
      end: close + 1,
    };
  }

  if (char === '[') return linkAt(text, index, key);

  if (char === '*' || char === '_') {
    const strong = text.startsWith(char.repeat(2), index);
    const marker = strong ? char.repeat(2) : char;
    const close = text.indexOf(marker, index + marker.length + 1);
    if (close === -1 || text[index + marker.length] === ' ') return null;
    const inner = renderInline(text.slice(index + marker.length, close), key);

    return {
      node: strong ? <strong key={key}>{inner}</strong> : <em key={key}>{inner}</em>,
      end: close + marker.length,
    };
  }

  return null;
}

function linkAt(text: string, index: number, key: string): Span | null {
  const labelEnd = text.indexOf('](', index + 1);
  if (labelEnd === -1) return null;
  const hrefEnd = text.indexOf(')', labelEnd + 2);
  if (hrefEnd === -1) return null;

  const label = renderInline(text.slice(index + 1, labelEnd), key);
  const href = text.slice(labelEnd + 2, hrefEnd).trim();
  if (!SAFE_LINK.test(href))
    return { node: <span key={key}>{label}</span>, end: hrefEnd + 1 };

  const web = !href.toLowerCase().startsWith('mailto:');

  return {
    node: (
      <a
        key={key}
        href={href}
        className="text-primary underline underline-offset-4"
        {...(web ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
      </a>
    ),
    end: hrefEnd + 1,
  };
}
