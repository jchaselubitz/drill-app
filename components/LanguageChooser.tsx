import { Select } from '@/components/Select';
import { Languages } from '@/constants';

export type SmartDefaultConfig = {
  /** The language of the current context (e.g., the phrase being translated) */
  contextLanguage: string | null;
  /** The user's native language */
  userLanguage: string;
  /** The language the user is learning */
  topicLanguage: string;
};

/**
 * Determines the smart default language based on context.
 * - If context is in user's native language → returns learning language
 * - If context is in learning language → returns user's native language
 * - Otherwise → returns learning language as default
 */
export function getSmartDefaultLanguage(config: SmartDefaultConfig): string {
  const { contextLanguage, userLanguage, topicLanguage } = config;

  if (!contextLanguage) {
    return topicLanguage;
  }

  if (contextLanguage === userLanguage) {
    return topicLanguage;
  }

  if (contextLanguage === topicLanguage) {
    return userLanguage;
  }

  // For any other language, default to the learning language
  return topicLanguage;
}

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
