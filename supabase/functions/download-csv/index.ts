import { corsHeaders } from '../_shared/cors.ts';
import { supabaseClient, SupabaseClient } from '../_shared/supabase.ts';
import { Lesson, Phrase, Translation, SupabaseLessonResponse } from '../_shared/types.ts';
import { hashString, mapSupabaseLessonToLesson } from '../_shared/utilities.ts';

async function getUrl(text: string, bucket: string, supabase: SupabaseClient) {
  const fileName = (await hashString(text)) + '.mp3';
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName, { download: true });

  if (data) {
    return data;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const data = await req.json();
  const lessonId = data.lessonId;

  const { data: lessons, error: errorLessons } = await supabaseClient(req)
    .from('lesson')
    .select(
      'id, title, side_one, side_two, translation ( phrase_primary_id (text, lang), phrase_secondary_id (text, lang))'
    )
    .eq('id', lessonId);

  if (errorLessons) {
    return new Response(errorLessons.message, { status: 500 });
  }

  const lesson = lessons
    ? mapSupabaseLessonToLesson(lessons[0] as SupabaseLessonResponse)
    : ({} as Lesson);

  const createExportArray = async () =>
    await Promise.all(
      lesson.translation?.map(async (t: Translation) => {
        const phrases = [t.phrase_primary_id, t.phrase_secondary_id].filter(
          (p) => p !== undefined && p !== null
        );
        const side1 = phrases.find((p) => p.lang === lesson.side_one) as Phrase;
        const side2 = phrases.find((p) => p.lang === lesson.side_two) as Phrase;

        if (!side1 || !side2 || !side1.text || !side2.text) {
          return null;
        }

        const fileUrl = await getUrl(side2.text as string, 'text-to-speech', supabaseClient(req));

        return {
          [side1.lang as string]: side1.text,
          [side2.lang as string]: side2.text,
          media: fileUrl ? fileUrl.publicUrl : '',
        };
      })
    ).then((results) => results.filter((r) => r !== null));

  const arrayForExport = await createExportArray();

  if (!arrayForExport || arrayForExport.length === 0) {
    return new Response('No valid translations found', {
      headers: corsHeaders,
      status: 404,
    });
  }

  const headers = Object.keys(arrayForExport[0]);

  const csvContent = arrayForExport.map((row: Record<string, string>) => {
    return headers.map((header) => `"${row[header].replace(/"/g, '""')}"`).join(',');
  });

  const csvOutput = [...csvContent].join('\n');

  return new Response(csvOutput, {
    headers: {
      ...corsHeaders,
      'Content-Disposition': 'attachment; filename=export.csv',
      'Content-Type': 'text/csv',
    },
  });
});
