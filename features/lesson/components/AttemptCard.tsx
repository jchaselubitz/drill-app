import { Ionicons } from '@expo/vector-icons';
import { useDatabase, withObservables } from '@nozbe/watermelondb/react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Markdown } from '@/components';
import { useSettings } from '@/contexts/SettingsContext';
import database from '@/database';
import { Attempt, Phrase, Translation } from '@/database/models';
import type Feedback from '@/database/models/Feedback';
import { TRANSLATION_TABLE } from '@/database/schema';
import { useColors } from '@/hooks';
import {
  deletePendingAttempt,
  hasActiveRequest,
  submitAttemptForReview,
} from '@/lib/backgroundReviewService';
import { formatDate } from '@/lib/helpers/helpersFormatting';

type AttemptCardProps = {
  attempt: Attempt;
  isExpanded: boolean;
  onToggle: () => void;
};

type AttemptCardInnerProps = AttemptCardProps & {
  feedbackItems: Feedback[];
  phrases: Phrase[];
};

type VocabularyPair = {
  nativePhrase: Phrase;
  targetPhrase: Phrase;
};

function AttemptCardInner({
  attempt,
  feedbackItems,
  phrases,
  isExpanded,
  onToggle,
}: AttemptCardInnerProps) {
  const colors = useColors();
  const db = useDatabase();
  const { settings } = useSettings();
  const [vocabularyPairs, setVocabularyPairs] = useState<VocabularyPair[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);

  const isPending = attempt.status === 'pending';
  const isFailed = attempt.status === 'failed';
  const isProcessing = isPending && hasActiveRequest(attempt.id);

  useEffect(() => {
    if (!phrases.length) {
      setVocabularyPairs([]);
      return;
    }

    const phraseIds = phrases.map((p) => p.id);
    // Create a map for quick phrase lookup
    const phraseMap = new Map(phrases.map((p) => [p.id, p]));

    // Query translations where primary phrase is from this attempt
    const subscription = db.collections
      .get<Translation>(TRANSLATION_TABLE)
      .query()
      .observe()
      .subscribe((allTranslations) => {
        // Filter to translations where primary phrase is from this attempt
        const relevantTranslations = allTranslations.filter((t) =>
          phraseIds.includes(t.phrasePrimaryId)
        );

        const pairs: VocabularyPair[] = [];

        for (const translation of relevantTranslations) {
          const nativePhrase = phraseMap.get(translation.phrasePrimaryId);
          const targetPhrase = phraseMap.get(translation.phraseSecondaryId);

          // Both phrases should be in the phrases array since they're both linked to the attempt
          if (nativePhrase && targetPhrase) {
            pairs.push({ nativePhrase, targetPhrase });
          }
        }

        setVocabularyPairs(pairs);
      });

    return () => subscription.unsubscribe();
  }, [db, phrases]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Delete the failed attempt and create a new one
      const lessonId = attempt.lessonId;
      const paragraph = attempt.paragraph;

      await deletePendingAttempt(database, attempt.id);

      await submitAttemptForReview({
        db: database,
        lessonId,
        paragraph,
        topicLanguage: settings.topicLanguage,
        userLanguage: settings.userLanguage,
      });
    } catch (error) {
      console.error('Failed to retry attempt:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePendingAttempt(database, attempt.id);
    } catch (error) {
      console.error('Failed to delete attempt:', error);
    }
  };

  // Render pending state
  if (isPending || isFailed) {
    return (
      <Card
        style={[
          styles.attemptCard,
          isFailed && { borderColor: colors.error, borderWidth: 1 },
        ]}
      >
        <View style={styles.attemptHeader}>
          <View style={styles.attemptMeta}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.attemptDate, { color: colors.textSecondary }]}>
              {formatDate(attempt.createdAt)}
            </Text>
          </View>
          {isPending && (
            <View style={styles.statusBadge}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.statusText, { color: colors.primary }]}>
                {isProcessing ? 'Processing...' : 'Pending'}
              </Text>
            </View>
          )}
          {isFailed && (
            <View style={[styles.statusBadge, { backgroundColor: colors.error + '20' }]}>
              <Ionicons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.statusText, { color: colors.error }]}>Failed</Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.attemptPreview, { color: colors.text }]}
          numberOfLines={2}
        >
          {attempt.paragraph}
        </Text>

        {isFailed && (
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <>
                  <Ionicons name="refresh" size={16} color={colors.primaryText} />
                  <Text style={[styles.actionButtonText, { color: colors.primaryText }]}>
                    Retry
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.error }]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={16} color={colors.primaryText} />
              <Text style={[styles.actionButtonText, { color: colors.primaryText }]}>
                Delete
              </Text>
            </Pressable>
          </View>
        )}
      </Card>
    );
  }

  // Render completed state
  return (
    <Card style={styles.attemptCard}>
      <Pressable onPress={onToggle}>
        <View style={styles.attemptHeader}>
          <View style={styles.attemptMeta}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.attemptDate, { color: colors.textSecondary }]}>
              {formatDate(attempt.createdAt)}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>
      <Text
        style={[styles.attemptPreview, { color: colors.text }]}
        numberOfLines={isExpanded ? undefined : 2}
        selectable
      >
        {attempt.paragraph}
      </Text>

      {isExpanded && (
        <View style={styles.attemptDetails}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.detailLabel, { color: colors.success }]}>Corrected Version</Text>
            </View>
            <Markdown style={styles.detailText}>{attempt.correction}</Markdown>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
              <Text style={[styles.detailLabel, { color: colors.primary }]}>Feedback</Text>
            </View>
            <View style={styles.feedbackList}>
              {feedbackItems.map((item, index) => (
                <View key={index} style={styles.feedbackItem}>
                  <Text
                    style={[
                      styles.feedbackPoint,
                      { color: item.negative ? colors.error : colors.success },
                    ]}
                    selectable
                  >
                    {item.point}
                  </Text>
                  <Markdown style={styles.detailText}>{item.explanation as string}</Markdown>
                </View>
              ))}
            </View>
          </View>

          {vocabularyPairs.length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.detailHeader}>
                <Ionicons name="book-outline" size={16} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.primary }]}>New Vocabulary</Text>
              </View>
              <View style={styles.vocabularyList}>
                {vocabularyPairs.map((pair, index) => (
                  <View key={index} style={styles.vocabularyItem}>
                    <Text style={[styles.vocabularyText, { color: colors.text }]} selectable>
                      <Text style={styles.vocabularyNative}>{pair.nativePhrase.text}</Text>
                      {' → '}
                      <Text style={styles.vocabularyTarget}>{pair.targetPhrase.text}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

export const AttemptCard = withObservables(['attempt'], ({ attempt }: AttemptCardProps) => ({
  attempt: attempt.observe(),
  feedbackItems: attempt.feedbackItems.observe(),
  phrases: attempt.phrases.observe(),
}))(AttemptCardInner);

const styles = StyleSheet.create({
  attemptCard: {
    gap: 8,
    marginBottom: 8,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attemptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attemptDate: {
    fontSize: 12,
  },
  attemptPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  attemptDetails: {
    gap: 12,
    marginTop: 8,
  },
  divider: {
    height: 1,
  },
  detailSection: {
    gap: 6,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
  },
  feedbackList: {
    marginTop: 12,
    gap: 8,
  },
  feedbackItem: {
    gap: 4,
  },
  feedbackPoint: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vocabularyList: {
    marginTop: 12,
    gap: 8,
  },
  vocabularyItem: {
    gap: 4,
  },
  vocabularyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  vocabularyNative: {
    fontWeight: '600',
  },
  vocabularyTarget: {
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
