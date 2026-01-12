import Ionicons from '@expo/vector-icons/Ionicons';

export type PhraseType = 'word' | 'phrase' | 'recording';
export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Iso639LanguageCode = string;

export enum LanguagesISO639 {
  Indonesian = 'id',
  Afar = 'aa',
  Abkhazian = 'ab',
  Avestan = 'ae',
  Afrikaans = 'af',
  Akan = 'ak',
  Amharic = 'am',
  Aragonese = 'an',
  Arabic = 'ar',
  Assamese = 'as',
  Avaric = 'av',
  Aymara = 'ay',
  Azerbaijani = 'az',
  Bashkir = 'ba',
  Belarusian = 'be',
  Bulgarian = 'bg',
  Bihari = 'bh',
  Bislama = 'bi',
  Bambara = 'bm',
  Bengali = 'bn',
  Tibetan = 'bo',
  Breton = 'br',
  Bosnian = 'bs',
  'Catalan; Valencian' = 'ca',
  Chechen = 'ce',
  Chamorro = 'ch',
  Corsican = 'co',
  Cree = 'cr',
  Czech = 'cs',
  'Church Slavic' = 'cu',
  Chuvash = 'cv',
  Welsh = 'cy',
  Danish = 'da',
  German = 'de',
  'Divehi; Maldivian' = 'dv',
  Dzongkha = 'dz',
  Ewe = 'ee',
  Greek = 'el',
  English = 'en',
  Esperanto = 'eo',
  Spanish = 'es',
  Estonian = 'et',
  Basque = 'eu',
  Persian = 'fa',
  'Fula; Fulah; Pulaar; Pular' = 'ff',
  Finnish = 'fi',
  Fijian = 'fj',
  Faroese = 'fo',
  French = 'fr',
  'Western Frisian' = 'fy',
  Irish = 'ga',
  'Scottish Gaelic' = 'gd',
  Galician = 'gl',
  Guarani = 'gn',
  Gujarati = 'gu',
  Manx = 'gv',
  Hausa = 'ha',
  Hebrew = 'he',
  Hindi = 'hi',
  'Hiri Motu' = 'ho',
  Croatian = 'hr',
  Haitian = 'ht',
  Hungarian = 'hu',
  Armenian = 'hy',
  Herero = 'hz',
  Interlingua = 'ia',
  Interlingue = 'ie',
  Igbo = 'ig',
  Nuosu = 'ii',
  Inupiaq = 'ik',
  Ido = 'io',
  Icelandic = 'is',
  Italian = 'it',
  Inuktitut = 'iu',
  Japanese = 'ja',
  Javanese = 'jv',
  Georgian = 'ka',
  Kongo = 'kg',
  Kikuyu = 'ki',
  Kwanyama = 'kj',
  Kazakh = 'kk',
  Kalaallisut = 'kl',
  'Central Khmer' = 'km',
  Kannada = 'kn',
  Korean = 'ko',
  Kanuri = 'kr',
  Kashmiri = 'ks',
  Kurdish = 'ku',
  Komi = 'kv',
  Cornish = 'kw',
  Kyrgyz = 'ky',
  Latin = 'la',
  Luxembourgish = 'lb',
  Ganda = 'lg',
  Limburgan = 'li',
  Lingala = 'ln',
  Lao = 'lo',
  Lithuanian = 'lt',
  'Luba-Katanga' = 'lu',
  Latvian = 'lv',
  Malagasy = 'mg',
  Marshallese = 'mh',
  Maori = 'mi',
  Macedonian = 'mk',
  Malayalam = 'ml',
  Mongolian = 'mn',
  Marathi = 'mr',
  Malay = 'ms',
  Maltese = 'mt',
  Burmese = 'my',
  Nauru = 'na',
  'Norwegian Bokmål' = 'nb',
  'North Ndebele' = 'nd',
  Nepali = 'ne',
  Ndonga = 'ng',
  Dutch = 'nl',
  'Norwegian Nynorsk' = 'nn',
  Norwegian = 'no',
  'South Ndebele' = 'nr',
  Navajo = 'nv',
  Chichewa = 'ny',
  Occitan = 'oc',
  Ojibwe = 'oj',
  Oromo = 'om',
  Oriya = 'or',
  Ossetian = 'os',
  Panjabi = 'pa',
  Pali = 'pi',
  Polish = 'pl',
  Pashto = 'ps',
  Portuguese = 'pt',
  Quechua = 'qu',
  Romansh = 'rm',
  Rundi = 'rn',
  Romanian = 'ro',
  Russian = 'ru',
  Kinyarwanda = 'rw',
  Sanskrit = 'sa',
  Sardinian = 'sc',
  Sindhi = 'sd',
  'Northern Sami' = 'se',
  Sango = 'sg',
  Sinhala = 'si',
  Slovak = 'sk',
  Slovene = 'sl',
  Samoan = 'sm',
  Shona = 'sn',
  Somali = 'so',
  Albanian = 'sq',
  Serbian = 'sr',
  Swati = 'ss',
  'Southern Sotho' = 'st',
  Sundanese = 'su',
  Swedish = 'sv',
  Swahili = 'sw',
  Tamil = 'ta',
  Telugu = 'te',
  Tajik = 'tg',
  Thai = 'th',
  Tigrinya = 'ti',
  Turkmen = 'tk',
  Tagalog = 'tl',
  Tswana = 'tn',
  Tonga = 'to',
  Turkish = 'tr',
  Tsonga = 'ts',
  Tatar = 'tt',
  Twi = 'tw',
  Tahitian = 'ty',
  Uighur = 'ug',
  Ukrainian = 'uk',
  Urdu = 'ur',
  Uzbek = 'uz',
  Venda = 've',
  Vietnamese = 'vi',
  Volapük = 'vo',
  Walloon = 'wa',
  Wolof = 'wo',
  Xhosa = 'xh',
  Yiddish = 'yi',
  Yoruba = 'yo',
  Zhuang = 'za',
  Chinese = 'zh',
  Zulu = 'zu',
}

export const Languages = [
  { name: 'German', value: LanguagesISO639.German, icon: '🇩🇪' },
  { name: 'English', value: LanguagesISO639.English, icon: '🇬🇧' },
  { name: 'French', value: LanguagesISO639.French, icon: '🇫🇷' },
  { name: 'Spanish', value: LanguagesISO639.Spanish, icon: '🇪🇸' },
  { name: 'Italian', value: LanguagesISO639.Italian, icon: '🇮🇹' },
  { name: 'Portuguese', value: LanguagesISO639.Portuguese, icon: '🇵🇹' },
  { name: 'Dutch', value: LanguagesISO639.Dutch, icon: '🇳🇱' },
  { name: 'Swedish', value: LanguagesISO639.Swedish, icon: '🇸🇪' },
  { name: 'Polish', value: LanguagesISO639.Polish, icon: '🇵🇱' },
  { name: 'Romanian', value: LanguagesISO639.Romanian, icon: '🇷🇴' },
  { name: 'Czech', value: LanguagesISO639.Czech, icon: '🇨🇿' },
  { name: 'Danish', value: LanguagesISO639.Danish, icon: '🇩🇰' },
  { name: 'Hungarian', value: LanguagesISO639.Hungarian, icon: '🇭🇺' },
  { name: 'Finnish', value: LanguagesISO639.Finnish, icon: '🇫🇮' },
  { name: 'Slovak', value: LanguagesISO639.Slovak, icon: '🇸🇰' },
  { name: 'Slovenian', value: LanguagesISO639.Slovene, icon: '🇸🇮' },
  { name: 'Estonian', value: LanguagesISO639.Estonian, icon: '🇪🇪' },
  { name: 'Greek', value: LanguagesISO639.Greek, icon: '🇬🇷' },
  { name: 'Bulgarian', value: LanguagesISO639.Bulgarian, icon: '🇧🇬' },
  { name: 'Croatian', value: LanguagesISO639.Croatian, icon: '🇭🇷' },
  { name: 'Lithuanian', value: LanguagesISO639.Lithuanian, icon: '🇱🇹' },
  { name: 'Latvian', value: LanguagesISO639.Latvian, icon: '🇱🇻' },
  { name: 'Maltese', value: LanguagesISO639.Maltese, icon: '🇲🇹' },
  { name: 'Norwegian', value: LanguagesISO639.Norwegian, icon: '🇳🇴' },
  { name: 'Turkish', value: LanguagesISO639.Turkish, icon: '🇹🇷' },
  { name: 'Ukrainian', value: LanguagesISO639.Ukrainian, icon: '🇺🇦' },
  { name: 'Hebrew', value: LanguagesISO639.Hebrew, icon: '🇮🇱' },
  { name: 'Hindi', value: LanguagesISO639.Hindi, icon: '🇮🇳' },
  { name: 'Indonesian', value: LanguagesISO639.Indonesian, icon: '🇮🇩' },
  { name: 'Korean', value: LanguagesISO639.Korean, icon: '🇰🇷' },
  { name: 'Malay', value: LanguagesISO639.Malay, icon: '🇲🇾' },
  { name: 'Vietnamese', value: LanguagesISO639.Vietnamese, icon: '🇻🇳' },
  { name: 'Chinese', value: LanguagesISO639.Chinese, icon: '🇨🇳' },
  { name: 'Japanese', value: LanguagesISO639.Japanese, icon: '🇯🇵' },
  { name: 'Urdu', value: LanguagesISO639.Urdu, icon: '🇵🇰' },
  { name: 'Bengali', value: LanguagesISO639.Bengali, icon: '🇧🇩' },
  { name: 'Russian', value: LanguagesISO639.Russian, icon: '🇷🇺' },
  { name: 'Arabic', value: LanguagesISO639.Arabic, icon: '🇸🇦' },
].sort((a, b) => a.name.localeCompare(b.name));

export const getLangName = (langCode: string | undefined | null) => {
  return Languages.find((lang) => lang.value.toString() === langCode)?.name ?? '';
};

export const getLangValue = (langName: string) => {
  return (
    Languages.find((lang) => lang.name.toLowerCase() === langName.toLowerCase())?.value ?? null
  );
};

export const getLangIcon = (langCode: string | null) => {
  return Languages.find((lang) => lang.value === langCode)?.icon ?? '';
};
export const Levels = [
  { name: 'A1', value: 'A1' },
  { name: 'A2', value: 'A2' },
  { name: 'B1', value: 'B1' },
  { name: 'B2', value: 'B2' },
  { name: 'C1', value: 'C1' },
  { name: 'C2', value: 'C2' },
];

export type PhraseListType = {
  name: string;
  value: PhraseType;
  icon: string;
};
export const PhraseTypes = [
  { name: 'Word', value: 'word' as PhraseType, icon: 'text', color: 'blue' },
  { name: 'Phrase', value: 'phrase' as PhraseType, icon: 'document-text', color: 'black' },
  { name: 'Recording', value: 'recording' as PhraseType, icon: 'mic', color: 'green' },
];

export const getPhraseTypeName = (phraseType: string) => {
  return PhraseTypes.find((type) => type.value === phraseType)?.name ?? '';
};

export const getPhraseTypeValue = (phraseTypeName: string) => {
  return PhraseTypes.find((type) => type.name === phraseTypeName)?.value ?? '';
};

export const getPhraseTypeIcon = (phraseType: string, size?: number) => {
  const type = PhraseTypes.find((type) => type.value === phraseType);
  if (!type) return <></>;
  const icon = <Ionicons name={type.icon as any} size={size} color={type.color} />;
  return icon;
};

export enum PartSpeechType {
  Noun = 'noun',
  Verb = 'verb',
  Adjective = 'adjective',
  Adverb = 'adverb',
  Pronoun = 'pronoun',
  Preposition = 'preposition',
  Phrase = 'phrase',
}

export type PosListType = {
  name: string;
  value: string;
  icon: string;
  color: string;
};
export const PartSpeechTypes = [
  { name: 'Noun', value: 'noun' as PartSpeechType, icon: 'N', color: 'blue' },
  { name: 'Verb', value: 'verb' as PartSpeechType, icon: 'V', color: 'black' },
  { name: 'Adjective', value: 'adjective' as PartSpeechType, icon: 'Adj', color: 'green' },
  { name: 'Adverb', value: 'adverb' as PartSpeechType, icon: 'Adv', color: 'green' },
  { name: 'Pronoun', value: 'pronoun' as PartSpeechType, icon: 'Pr', color: 'red' },
  { name: 'Preposition', value: 'preposition' as PartSpeechType, icon: 'P', color: 'red' },
  { name: 'Phrase', value: 'phrase' as PartSpeechType, icon: 'Ph', color: 'red' },
];

export const getPartSpeechTypeName = (PartSpeechType: string) => {
  return PartSpeechTypes.find((type) => type.value === PartSpeechType)?.name ?? '';
};

export const getPartSpeechTypeValue = (PartSpeechTypeName: string) => {
  return PartSpeechTypes.find((type) => type.name === PartSpeechTypeName)?.value ?? '';
};

export const getPartSpeechTypeIcon = (PartSpeechType: string, size?: number) => {
  return PartSpeechTypes.find((type) => type.value === PartSpeechType)?.icon ?? '';
};

export const ContentSuggestions = [
  `Computer science and AI`,
  `Adjective verb agreement`,
  `Daily interactions`,
  `Sentences using the word 'Weltschmerz'`,
];

export const TranscriptRequestSuggestions = [
  `Extract all of the nouns`,
  `Generate four paragraphs like this one`,
  `List all the sentences.`,
];

const sourceOptionBase = ['home', 'history', 'lesson', 'correction', 'transcript', 'chat'];

// export type SourceOptionType = (typeof sourceOptionBase)[number];

export type SourceOptionType = 'home' | 'history' | 'lesson' | 'correction' | 'transcript' | 'chat';

export const sourceOptions = sourceOptionBase as SourceOptionType[];

export const getContentSuggestions = ({
  contentLang,
  userLanguage,
  prefLanguage,
  suggestionList,
}: {
  contentLang: Iso639LanguageCode | null | undefined;
  userLanguage: Iso639LanguageCode | null | undefined;
  prefLanguage: Iso639LanguageCode | null | undefined;
  suggestionList: string[];
}) => {
  const suggestedTranslationLang = contentLang === userLanguage ? prefLanguage : userLanguage;

  return [
    ...suggestionList,
    userLanguage
      ? `Translate to ${suggestedTranslationLang && getLangName(suggestedTranslationLang)}`
      : `Translate to`,
  ];
};
