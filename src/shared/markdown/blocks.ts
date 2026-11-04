export type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'rule' }
  | { type: 'list'; ordered: boolean; start: number; items: string[] };

const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/u;
const FENCE = /^\s*```/u;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/u;
const BULLET = /^\s*[-*+]\s+(.*)$/u;
const NUMBERED = /^\s*(\d{1,9})[.)]\s+(.*)$/u;
const QUOTE = /^\s*>\s?(.*)$/u;

export function parseBlocks(source: string): Block[] {
  const lines = source.replaceAll(/\r\n?/gu, '\n').split('\n');
  const blocks: Block[] = [];
  let index = 0;

  const collect = (matches: (line: string) => boolean): string[] => {
    const taken: string[] = [];
    let line = lines[index];
    while (line !== undefined && matches(line)) {
      taken.push(line);
      index += 1;
      line = lines[index];
    }
    return taken;
  };

  for (let line = lines[index]; line !== undefined; line = lines[index]) {
    if (line.trim() === '') {
      index += 1;
    } else if (FENCE.test(line)) {
      index += 1;
      const body = collect(next => !FENCE.test(next));
      index += 1;
      blocks.push({ type: 'code', text: body.join('\n') });
    } else if (HEADING.test(line)) {
      const [, hashes = '#', text = ''] = HEADING.exec(line) ?? [];
      blocks.push({ type: 'heading', level: hashes.length, text });
      index += 1;
    } else if (RULE.test(line)) {
      blocks.push({ type: 'rule' });
      index += 1;
    } else if (QUOTE.test(line)) {
      const quoted = collect(next => QUOTE.test(next));
      blocks.push({
        type: 'quote',
        text: joined(quoted.map(q => QUOTE.exec(q)?.[1] ?? '')),
      });
    } else if (BULLET.test(line)) {
      const items = collect(next => BULLET.test(next)).map(
        item => BULLET.exec(item)?.[1] ?? '',
      );
      blocks.push({ type: 'list', ordered: false, start: 1, items });
    } else if (NUMBERED.test(line)) {
      const start = Number(NUMBERED.exec(line)?.[1] ?? 1);
      const items = collect(next => NUMBERED.test(next)).map(
        item => NUMBERED.exec(item)?.[2] ?? '',
      );
      blocks.push({ type: 'list', ordered: true, start, items });
    } else {
      const text = collect(next => next.trim() !== '' && !startsBlock(next));
      blocks.push({ type: 'paragraph', text: joined(text) });
    }
  }

  return blocks;
}

function startsBlock(line: string): boolean {
  return [FENCE, HEADING, RULE, QUOTE, BULLET, NUMBERED].some(pattern =>
    pattern.test(line),
  );
}

function joined(lines: readonly string[]): string {
  return lines.map(line => line.trim()).join(' ');
}
