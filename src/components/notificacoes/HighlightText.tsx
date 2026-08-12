import { memo } from 'react';

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * Realça ocorrências (case-insensitive) de `query` em `text` sem risco
 * de XSS: nunca usa dangerouslySetInnerHTML. Escapa metacaracteres do
 * regex e ignora queries vazias ou apenas com espaços.
 */
export const HighlightText = memo(({ text, query, className }: HighlightTextProps) => {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'ig');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className={
              className ??
              'bg-yellow-300/40 dark:bg-yellow-400/25 text-foreground rounded px-0.5'
            }
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
});

HighlightText.displayName = 'HighlightText';
