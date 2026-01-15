import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useCallback, useEffect, useState } from 'react';

import { useSettings } from '@/contexts/SettingsContext';
import { Feedback, Skill } from '@/database';
import { FEEDBACK_TABLE, SKILL_TABLE } from '@/database/schema';
import { analyzeSkills } from '@/lib/ai/analyzeSkills';
import type { SkillRank } from '@/types';

export function useSkillAnalysis() {
  const db = useDatabase();
  const { settings, updateSettings } = useSettings();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const subscription = db.collections
      .get<Skill>(SKILL_TABLE)
      .query(
        Q.where('lang', settings.topicLanguage),
        Q.sortBy('rank', Q.desc),
        Q.sortBy('occurrence_count', Q.desc)
      )
      .observe()
      .subscribe((results) => {
        setSkills(results);
      });

    return () => subscription.unsubscribe();
  }, [db, settings.topicLanguage]);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const feedbackItems = await db.collections
        .get<Feedback>(FEEDBACK_TABLE)
        .query(Q.where('created_at', Q.gte(thirtyDaysAgo)), Q.where('negative', true))
        .fetch();

      if (feedbackItems.length === 0) {
        setError('No feedback found from the past 30 days. Complete some lessons first!');
        setIsAnalyzing(false);
        return;
      }

      const formattedFeedback = feedbackItems.map((f) => ({
        id: f.id,
        point: f.point,
        explanation: f.explanation,
      }));

      const result = await analyzeSkills({
        feedbackItems: formattedFeedback,
        topicLanguage: settings.topicLanguage,
        userLanguage: settings.userLanguage,
      });

      for (const skill of result.skills) {
        await Skill.upsertSkill(db, {
          name: skill.name,
          category: skill.category,
          rank: skill.rank as SkillRank,
          description: skill.description,
          lastSeenAt: Date.now(),
          lang: settings.topicLanguage,
        });
      }

      await Skill.updateStaleStatuses(db);

      await updateSettings({ lastSkillAnalysisAt: Date.now() });
    } catch (err) {
      console.error('Skill analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [db, settings.topicLanguage, settings.userLanguage, updateSettings]);

  const staleDays = settings.lastSkillAnalysisAt
    ? Math.floor((Date.now() - settings.lastSkillAnalysisAt) / (24 * 60 * 60 * 1000))
    : null;

  return {
    skills,
    isAnalyzing,
    error,
    runAnalysis,
    lastAnalyzedAt: settings.lastSkillAnalysisAt,
    staleDays,
    isStale: staleDays === null || staleDays > 7,
  };
}
