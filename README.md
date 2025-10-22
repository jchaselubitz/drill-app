# drill-app

This mobile app will use content users generate to offer continuous testing and feedback for language learning.

## User flow
The user will request content by indicating his or her language, level, and the topic or subject they want to study. Each request will be considered a "lesson". An example of a user request might be: "German, B1, Verb adjective agreement". The app will then use OpenAI or Google to generate a batch of study content based on the user's requests. This content will be presented to the user one item at a time in the user's native language. The user will have to enter a translation of the content into the language they are studying. The app will then review each entry, present a corrected version of the user's translation (as similar to the original as possible). The software will maintain separate scores for spelling and grammatical correctness. These scores will be per lesson, and an average of the last 10 entries. The user can then select words, phrases, or concepts from each correction they want presented more often. These words and phrases will go into their library, where they can configure the frequency of presentation. There will be a similar library of grammatical concepts. 

## Aspects

### Inputs
1. Language and level selector + arbitrary topic/subject input. For example: German, B1, "Verb adjective agreement"
2. individual words with optional translation input - otherwise the app automatically generates translations in user's language.
3. Any text presented in the app can be added to library

### Generation
1. The app will first generate a batch of study content (ten items) based on the user's requests.
2. As the user progresses through the lesson, the app will generate additional content that includes any items added to the users word/phrase or grammatical concept library.

### Library
1. The library as a phrases/words section and a concepts section.
2. The user can add any text presented in the app to their library.
3. The user can also add their own translations to the library.

### Technical aspects
1. Built with React Native and TypeScript (iOS is the primary target, but Android is a secondary target).
2. It will use Supabase for backend/database/auth needs.
3. Supabase functions will be used to interact with the OpenAI API.
4. The app will use the Expo framework for developer experience. It will NOT use Expo's app hosting service.
5. It will do version control with github


## Repository map
- `App.tsx` – navigation container and providers.
- `screens` – layout scaffolding for lesson request, active session, library, and settings.
- `components` – reusable UI primitives used across screens.
- `context` – temporary state container for lesson progress and library entries.
- `lib/mockLessonGenerator.ts` – mocked content generation aligned with the database blueprint in `docs/mock-database.md`.
- `supabase/functions` – edge function scaffolds for generating lessons, scoring attempts, and syncing the library.
- `docs/assumptions.md` – setup instructions and explicit assumptions.
- `docs/mock-database.md` – mock Supabase schema for implementation reference.
