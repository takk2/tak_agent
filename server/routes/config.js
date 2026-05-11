import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

export default async function configRoutes(fastify, options) {
  // 사용자 config 조회
  fastify.get('/', async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      return reply.code(401).send({ error: authError.message });
    }

    const { data, error } = await supabase
      .from('user_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return reply.code(400).send({ error: error.message });
    }

    return { config: data || {} };
  });

  // 사용자 config 저장
  fastify.post('/', async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      return reply.code(401).send({ error: authError.message });
    }

    const { api_keys, settings } = request.body;

    const { data, error } = await supabase
      .from('user_configs')
      .upsert({
        user_id: user.id,
        api_keys,
        settings,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return reply.code(400).send({ error: error.message });
    }

    return { config: data };
  });
}
