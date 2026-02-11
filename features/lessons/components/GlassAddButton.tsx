import { Button } from '@/components/Button';
import { useNewLessonModal } from '@/features/lessons/context/NewLessonModalContext';

import type { FilterTab } from './FilterTabs';

type GlassAddButtonProps = {
  activeTab: FilterTab;
};

export function GlassAddButton({ activeTab }: GlassAddButtonProps) {
  const { open } = useNewLessonModal();

  const handlePress = () => {
    // Map the active tab to the appropriate modal mode
    if (activeTab === 'topics') {
      open('unified');
    } else if (activeTab === 'lessons') {
      open('lesson');
    } else {
      open('set');
    }
  };

  let buttonText = 'Create Topic';
  if (activeTab === 'lessons') {
    buttonText = 'Create Prompt';
  } else if (activeTab === 'sets') {
    buttonText = 'Create Set';
  }

  return (
    <Button
      text={buttonText}
      onPress={handlePress}
      variant="secondary"
      icon={{ name: 'add', size: 24, position: 'left' }}
    />
  );
}
