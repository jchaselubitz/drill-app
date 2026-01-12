import database, { Phrase } from '@/database';
import { PHRASE_TABLE } from '@/database/schema';
import { FlatList } from 'react-native';

import { withObservables } from '@nozbe/watermelondb/react';
import PhraseItem from './PhraseItem';

const PhraseList = ({ phrases }: { phrases: Phrase[] }) => {
  return (
    <FlatList
      data={phrases}
      renderItem={({ item }) => <PhraseItem phrase={item} />}
      keyExtractor={(item) => item.id}
    />
  );
};

const EnhancedPhraseList = withObservables([], () => ({
  phrases: database.get<Phrase>(PHRASE_TABLE).query().observe(),
}))(PhraseList);

export default EnhancedPhraseList;
