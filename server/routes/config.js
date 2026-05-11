import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

// 사용자 config 조회
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    const { data, error } = await supabase
      .from('user_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(400).json({ error: error.message });
    }

    res.json({ config: data || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 사용자 config 저장
router.post('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    const { api_keys, settings } = req.body;

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
      return res.status(400).json({ error: error.message });
    }

    res.json({ config: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
