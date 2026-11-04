import type { ReactNode } from 'react';

import { parseBlocks, type Block } from './blocks';
import { renderInline } from './inline';

const HEADING_CLASS = 'font-semibold tracking-tight mt-6 first:mt-0';
const HEADING_SIZES = ['text-xl', 'text-lg', 'text-base', 'text-base', 'text-sm'];

export function Markdown({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-3 leading-relaxed">
      {parseBlocks(source).map((block, index) => renderBlock(block, `b${index}`))}
    </div>
  );
}

function renderBlock(block: Block, key: string): ReactNode {
  switch (block.type) {
    case 'heading': {
      const level = Math.min(block.level + 1, 6);
      const Tag = `h${level}` as 'h2';
      return (
        <Tag
          key={key}
          className={`${HEADING_CLASS} ${HEADING_SIZES[level - 2] ?? 'text-sm'}`}
        >
          {renderInline(block.text, key)}
        </Tag>
      );
    }
    case 'paragraph':
      return <p key={key}>{renderInline(block.text, key)}</p>;
    case 'code':
      return (
        <pre key={key} className="bg-muted overflow-x-auto rounded-md p-3 text-sm">
          <code className="font-mono">{block.text}</code>
        </pre>
      );
    case 'quote':
      return (
        <blockquote
          key={key}
          className="border-border text-muted-foreground border-l-4 pl-4"
        >
          {renderInline(block.text, key)}
        </blockquote>
      );
    case 'rule':
      return <hr key={key} className="border-border" />;
    case 'list': {
      const items = block.items.map((item, index) => (
        <li key={`${key}-${index}`}>{renderInline(item, `${key}-${index}`)}</li>
      ));
      return block.ordered ? (
        <ol
          key={key}
          start={block.start === 1 ? undefined : block.start}
          className="list-decimal pl-6"
        >
          {items}
        </ol>
      ) : (
        <ul key={key} className="list-disc pl-6">
          {items}
        </ul>
      );
    }
  }
}
