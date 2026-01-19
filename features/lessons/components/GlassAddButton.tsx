import { Button } from '@/components/Button';
import { useNewLessonModal } from '@/features/lessons/context/NewLessonModalContext';

import type { FilterTab } from './FilterTabs';

type GlassAddButtonProps = {
  activeTab: FilterTab;
};

export function GlassAddButton({ activeTab }: GlassAddButtonProps) {
  const { open } = useNewLessonModal();

  const handlePress = () => {
    open(activeTab === 'lessons' ? 'lesson' : 'set');
  };

  return (
    <Button
      text="Create Lesson"
      onPress={handlePress}
      variant="secondary"
      icon={{ name: 'add', size: 24, position: 'left' }}
    />
  );
}
