import { useState, useEffect } from 'react';

export default function Settings({ user, onLogout }) {
  const [apiKeys, setApiKeys] = useState({
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    GEMINI_API_KEY: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('tak_session'));
      const response = await fetch('/api/config', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
        },
      });

      const data = await response.json();
      if (data.config?.api_keys) {
        setApiKeys(data.config.api_keys);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const session = JSON.parse(localStorage.getItem('tak_session'));
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          api_keys: apiKeys,
          settings: {},
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save config');
      }

      setMessage('설정이 저장되었습니다.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('저장 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">설정</h1>
              <p className="text-gray-600 mt-1">
                안녕하세요, {user.user_metadata?.name || user.email}님
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              로그아웃
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">API Keys</h2>
              <p className="text-sm text-gray-600 mb-6">
                API 키는 암호화되어 안전하게 저장됩니다. 모든 디바이스에서 자동으로 동기화됩니다.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenAI API Key (GPT)
                  </label>
                  <input
                    type="password"
                    value={apiKeys.OPENAI_API_KEY}
                    onChange={(e) => setApiKeys({ ...apiKeys, OPENAI_API_KEY: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="sk-..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anthropic API Key (Claude)
                  </label>
                  <input
                    type="password"
                    value={apiKeys.ANTHROPIC_API_KEY}
                    onChange={(e) => setApiKeys({ ...apiKeys, ANTHROPIC_API_KEY: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="sk-ant-..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google API Key (Gemini)
                  </label>
                  <input
                    type="password"
                    value={apiKeys.GEMINI_API_KEY}
                    onChange={(e) => setApiKeys({ ...apiKeys, GEMINI_API_KEY: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="AIza..."
                  />
                </div>
              </div>
            </div>

            {message && (
              <div className={`px-4 py-3 rounded-lg ${
                message.includes('실패') 
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </form>

          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">다음 단계</h3>
            <p className="text-sm text-gray-600 mb-4">
              설정이 완료되면 터미널에서 다음 명령어로 TAK Agent를 사용할 수 있습니다:
            </p>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm space-y-2">
              <div>$ tak dev  <span className="text-gray-500"># 개발 모드</span></div>
              <div>$ tak chat <span className="text-gray-500"># 채팅 모드</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
