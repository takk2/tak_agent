import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

export default async function authRoutes(fastify, options) {
  // 회원가입
  fastify.post('/signup', async (request, reply) => {
    const { email, password, name } = request.body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      return reply.code(400).send({ error: error.message });
    }

    return { user: data.user, session: data.session };
  });

  // 로그인
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return reply.code(401).send({ error: error.message });
    }

    return { user: data.user, session: data.session };
  });

  // 로그아웃
  fastify.post('/logout', async (request, reply) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return reply.code(400).send({ error: error.message });
    }

    return { success: true };
  });

  // 세션 확인
  fastify.get('/me', async (request, reply) => {
    const token = request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      return reply.code(401).send({ error: error.message });
    }

    return { user: data.user };
  });
}
