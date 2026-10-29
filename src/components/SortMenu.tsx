import { ActionSheet, ActionOption } from './ActionSheet';
import { SortOption } from '../types/record';

interface SortMenuProps {
  visible: boolean;
  currentSort: SortOption;
  onSelectSort: (sort: SortOption) => void;
  onClose: () => void;
}

export const SortMenu = ({
  visible,
  currentSort,
  onSelectSort,
  onClose,
}: SortMenuProps) => {
  const options: ActionOption[] = [
    {
      label: currentSort === 'newest' ? 'Newest First (Selected)' : 'Newest First',
      icon: 'time-outline',
      onPress: () => onSelectSort('newest'),
    },
    {
      label: currentSort === 'oldest' ? 'Oldest First (Selected)' : 'Oldest First',
      icon: 'calendar-outline',
      onPress: () => onSelectSort('oldest'),
    },
    {
      label: currentSort === 'alphabetical' ? 'Title A–Z (Selected)' : 'Title A–Z',
      icon: 'text-outline',
      onPress: () => onSelectSort('alphabetical'),
    },
  ];

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title="Sort Notes By"
      options={options}
    />
  );
};
