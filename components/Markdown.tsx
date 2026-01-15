import { StyleSheet, TextStyle } from 'react-native';
import MarkdownDisplay from 'react-native-markdown-display';

import { useColors } from '@/hooks';

type MarkdownProps = {
  children: string | undefined | null;
  style?: TextStyle;
};

export function Markdown({ children, style }: MarkdownProps) {
  const colors = useColors();

  if (!children || typeof children !== 'string') {
    return null;
  }

  const baseTextStyle = StyleSheet.flatten([styles.text, { color: colors.text }, style]);
  const strikeTextStyle = StyleSheet.flatten([
    styles.strikethrough,
    { color: colors.textSecondary },
    style,
  ]);

  const markdownStyles = {
    body: baseTextStyle,
    paragraph: baseTextStyle,
    text: baseTextStyle,
    list_item: baseTextStyle,
    strong: styles.bold,
    em: styles.italic,
    s: strikeTextStyle,
    bullet_list: styles.bulletList,
    bullet_list_icon: StyleSheet.flatten([styles.bulletIcon, { color: colors.text }]),
  };

  return <MarkdownDisplay style={markdownStyles}>{children}</MarkdownDisplay>;
}

const styles = StyleSheet.create({
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
  bulletList: {
    marginVertical: 0,
  },
  bulletIcon: {
    fontSize: 14,
    lineHeight: 22,
    marginRight: 8,
  },
});
