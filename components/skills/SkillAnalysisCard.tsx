import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components';
import { useColors } from '@/hooks';

type SkillAnalysisCardProps = {
  onAnalyze: () => void;
  isAnalyzing: boolean;
  error: string | null;
  lastAnalyzedAt?: number;
  staleDays: number | null;
  skillCount: number;
};

function formatLastAnalyzed(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}

export function SkillAnalysisCard({
  onAnalyze,
  isAnalyzing,
  error,
  lastAnalyzedAt,
  staleDays,
  skillCount,
}: SkillAnalysisCardProps) {
  const colors = useColors();

  const isStale = staleDays === null || staleDays > 7;

  return (
    <View style={styles.container}>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Analyze your recent feedback to identify areas for improvement.
      </Text>

      {lastAnalyzedAt ? (
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            Last analyzed: {formatLastAnalyzed(lastAnalyzedAt)}
          </Text>
          {skillCount > 0 && (
            <Text style={[styles.skillCountText, { color: colors.textSecondary }]}>
              {skillCount} skill{skillCount !== 1 ? 's' : ''} identified
            </Text>
          )}
        </View>
      ) : (
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>Never analyzed</Text>
      )}

      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

      <Button
        text={isStale ? 'Analyze My Skills' : 'Re-analyze'}
        onPress={onAnalyze}
        buttonState={isAnalyzing ? 'loading' : 'default'}
        loadingText="Analyzing..."
        variant={isStale ? 'primary' : 'secondary'}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    marginBottom: 12,
  },
  skillCountText: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    marginTop: 4,
  },
});
