import { Select } from '@/components/Select';
import { Languages } from '@/constants';

type LanguageChooserProps<T extends string> = {
  label?: string;
  value: T;
  onValueChange: (value: T) => void;
  includeAutoDetect?: boolean;
  autoDetectValue?: T;
  autoDetectLabel?: string;
};

export function LanguageChooser<T extends string>({
  label,
  value,
  onValueChange,
  includeAutoDetect = false,
  autoDetectValue,
  autoDetectLabel = '✨ Detect automatically',
}: LanguageChooserProps<T>) {
  const languageOptions = Languages.map((lang) => ({
    value: lang.code as T,
    label: `${lang.icon} ${lang.name}`,
  }));

  const options =
    includeAutoDetect && autoDetectValue
      ? [{ value: autoDetectValue, label: autoDetectLabel }, ...languageOptions]
      : languageOptions;

  return <Select label={label} options={options} value={value} onValueChange={onValueChange} />;
}
