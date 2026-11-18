// components/ChatMarkdown.tsx
// Lightweight, dependency-free inline-markdown renderer for AI chat bubbles.
// Handles **bold**, *italic*, `code`, [text](/path) links, "- item" lists
// and line breaks. Renders React nodes only — no dangerouslySetInnerHTML,
// so AI text can never inject HTML. QA M-12: raw "**no**" /
// "**FOR (A favor):**" leaked into Grammar AI Practice and Agora answers
// because bubbles rendered {msg.text} verbatim.
import React from 'react';

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Split on links, **bold**, *italic* and `code` — unmatched markers stay literal.
  const parts = text.split(/(\[[^\]\n]+\]\([^)\n]+\)|\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    // Markdown link — only same-site relative URLs become <a>; anything
    // else (external / javascript:) stays literal text.
    const linkMatch = part.match(/^\[([^\]\n]+)\]\(([^)\n]+)\)$/);
    if (linkMatch) {
      const href = linkMatch[2];
      if (href.startsWith('/')) {
        return (
          <a key={key} href={href} style={{ color: '#4F46E5', textDecoration: 'underline', fontWeight: 700 }}>
            {linkMatch[1]}
          </a>
        );
      }
      return <React.Fragment key={key}>{linkMatch[1]}</React.Fragment>;
    }
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} style={{
          background: 'rgba(100,116,139,0.12)', borderRadius: 5,
          padding: '1px 5px', fontSize: '0.92em',
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export default function ChatMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, li) => {
        const trimmed = line.trim();
        const isList = /^[-*•]\s+/.test(trimmed);
        const content = isList ? trimmed.replace(/^[-*•]\s+/, '') : line;
        return (
          <span
            key={li}
            style={isList ? { display: 'block', paddingLeft: 14, textIndent: -14 } : undefined}
          >
            {isList ? '• ' : null}
            {renderInline(content, `l${li}`)}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}
