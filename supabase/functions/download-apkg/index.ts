import { supabaseClient } from '../_shared/supabase.ts';
import { hashString, mapSupabaseLessonToLesson } from '../_shared/utilities.ts';
import { corsHeaders } from '../_shared/cors.ts';
import AnkiExport from 'npm:anki-apkg-export';
import { Lesson, Phrase, Translation, SupabaseLessonResponse } from '../_shared/types.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  const bucket = 'text-to-speech';

  const data = await req.json();
  const lessonId = data.lessonId;

  const { data: lessons, error: errorLessons } = await supabaseClient(req)
    .from('lesson')
    .select(
      'id, title, side_one, side_two, translation( phrase_primary_id (text, lang), phrase_secondary_id (text, lang))'
    )
    .eq('id', lessonId);

  if (errorLessons) {
    return new Response(errorLessons.message, { status: 500 });
  }

  const lesson = lessons
    ? mapSupabaseLessonToLesson(lessons[0] as SupabaseLessonResponse)
    : ({} as Lesson);

  async function downloadMedia(fileName: string) {
    const { data, error } = await supabaseClient(req).storage.from(bucket).download(fileName);

    if (error) {
      console.error('Error downloading media:', error);
      return null;
    }
    const audioBlob = new Blob([data], { type: 'audio/mpeg' });
    const arrayBuffer = await audioBlob.arrayBuffer(); // Convert the data to ArrayBuffer
    return arrayBuffer;
  }

  const apkg = new AnkiExport.default(lesson.title);

  const createMediaPackage = async () => {
    await Promise.all(
      lesson.translation?.map(async (t: Translation) => {
        const phrases = [t.phrase_primary_id, t.phrase_secondary_id].filter(
          (p) => p !== undefined && p !== null
        );
        const side1 = phrases.find((p) => p.lang === lesson.side_one) as Phrase;
        const side2 = phrases.find((p) => p.lang === lesson.side_two) as Phrase;
        if (!side1 || !side2 || !side1.text || !side2.text) return;
        const fileName = (await hashString(side2.text)) + '.mp3';
        const media = await downloadMedia(fileName);
        if (media !== null) {
          apkg.addMedia(`${fileName}`, media);
        }
        const withMedia = media !== null ? `[sound:${fileName}]` : '';
        apkg.addCard(side1.text, `${side2.text} ${withMedia}`);
      })
    );

    return await apkg.save();
  };

  try {
    const zip = await createMediaPackage();

    const resp = new Response(zip, {
      headers: {
        ...corsHeaders,
        'Content-Disposition': 'attachment; filename="export.apkg"',
        'Content-Type': 'application/octet-stream',
      },
    });

    return resp;
  } catch (error) {
    console.error('Error creating media package:', error);
    return new Response((error as Error).message, { status: 500 });
  }

  // return new Response('Method not allowed', {
  //   status: 405,
  //   headers: corsHeaders,
  // });
});
