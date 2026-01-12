import { Text, StyleSheet, TextStyle, View } from 'react-native';
import { useColors } from '@/hooks';

type MarkdownProps = {
  children: string;
  style?: TextStyle;
};

type TextSegment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
};

function parseInlineMarkdown(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let remaining = text;

  // Pattern to match **bold**, *italic*, ~~strikethrough~~
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }

    if (match[2]) {
      // Bold **text**
      segments.push({ text: match[2], bold: true });
    } else if (match[3]) {
      // Italic *text*
      segments.push({ text: match[3], italic: true });
    } else if (match[4]) {
      // Strikethrough ~~text~~
      segments.push({ text: match[4], strikethrough: true });
    }

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ text }];
}

function InlineText({ segments, style }: { segments: TextSegment[]; style?: TextStyle }) {
  const colors = useColors();

  return (
    <Text style={style}>
      {segments.map((segment, index) => {
        const segmentStyle: TextStyle[] = [];
        if (segment.bold) segmentStyle.push(styles.bold);
        if (segment.italic) segmentStyle.push(styles.italic);
        if (segment.strikethrough) {
          segmentStyle.push(styles.strikethrough, { color: colors.textSecondary });
        }

        return (
          <Text key={index} style={segmentStyle}>
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
}

export function Markdown({ children, style }: MarkdownProps) {
  const colors = useColors();
  const lines = children.split('\n');

  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ');
      const segments = parseInlineMarkdown(text);
      elements.push(
        <InlineText
          key={elements.length}
          segments={segments}
          style={[styles.text, { color: colors.text }, style]}
        />
      );
      currentParagraph = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Empty line - flush paragraph
    if (!trimmed) {
      flushParagraph();
      return;
    }

    // Bullet point
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      flushParagraph();
      const bulletText = trimmed.slice(2);
      const segments = parseInlineMarkdown(bulletText);
      elements.push(
        <View key={elements.length} style={styles.bulletItem}>
          <Text style={[styles.bullet, { color: colors.text }]}>•</Text>
          <InlineText
            segments={segments}
            style={[styles.text, styles.bulletText, { color: colors.text }, style]}
          />
        </View>
      );
      return;
    }

    // Regular text - add to paragraph
    currentParagraph.push(trimmed);
  });

  // Flush any remaining paragraph
  flushParagraph();

  return <View style={styles.container}>{elements}</View>;
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
  },
  italic: {
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
  },
});
