import { Button } from '@/components/Button';
import { useNewLessonModal } from '@/features/lessons/context/NewLessonModalContext';

export function GlassAddButton() {
  const { open } = useNewLessonModal();

  return (
    <Button
      text="Create Lesson"
      onPress={open}
      variant="secondary"
      icon={{ name: 'add', size: 24, position: 'left' }}
    />
  );
}
