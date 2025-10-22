import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { generateMockLessonItems } from '@lib/mockLessonGenerator';
import { LessonRequest } from '@types/lesson';
import { useLessonContext } from '@context/LessonContext';

interface LessonMutationVariables {
  request: LessonRequest;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useLessonSession() {
  const { startLesson, advanceLesson, resetLesson, activeLesson } = useLessonContext();
  const [isGenerating, setGenerating] = useState(false);

  const generateLesson = useCallback(async ({ request }: LessonMutationVariables) => {
    setGenerating(true);
    try {
      await delay(600); // simulate network
      const items = generateMockLessonItems(request);
      startLesson(request, items);
      return items;
    } finally {
      setGenerating(false);
    }
  }, [startLesson]);

  const { mutateAsync: createLesson } = useMutation({
    mutationFn: generateLesson
  });

  const submitAnswer = useCallback(
    async (input: { spelling: number; grammar: number }) => {
      await delay(300);
      advanceLesson({ spelling: input.spelling, grammar: input.grammar });
    },
    [advanceLesson]
  );

  return {
    activeLesson,
    isGenerating,
    createLesson,
    submitAnswer,
    resetLesson
  };
}
