# Supabase setup

This directory contains placeholders for Supabase Edge Functions used by the mobile application.
They are not wired to any AI provider yet; instead, they provide deterministic mock data so that the
front end can be developed and tested offline.

- `generate-content`: Accepts lesson request parameters and stores the metadata in `lesson_requests`.
  Replace the mocked content array with calls to OpenAI or Google Vertex AI when credentials are
  available.
- `lesson-feedback`: Receives an answer submission, records it in `lesson_submissions`, and returns a
  placeholder correction object along with follow-up prompts.
- `library-expansion`: Generates seed data for the learner's phrase library based on focus items from
  a lesson.

Deploy these functions using the Supabase CLI once the project configuration is in place:

```bash
supabase functions deploy generate-content
supabase functions deploy lesson-feedback
supabase functions deploy library-expansion
```

Remember to set secrets for `OPENAI_API_KEY` or any alternative provider before replacing the mock
implementations.
