'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ApiKeysPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [apiKeys, setApiKeys] = useState<any>(null);

  const checkConfiguration = async () => {
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch('/api/polymarket/init');
      const data = await response.json();

      if (data.configured) {
        setStatus('✅ Private key is configured');
      } else {
        setError('❌ Private key not found in .env.local');
      }
    } catch (err: any) {
      setError('Error checking configuration: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeKeys = async () => {
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch('/api/polymarket/init', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setStatus('✅ API keys initialized successfully! WebSocket and authenticated endpoints are now active.');
        
        // Fetch the generated keys
        const keysResponse = await fetch('/api/keys-status');
        const keysData = await keysResponse.json();
        if (keysData.success) {
          setApiKeys(keysData.keys);
        }
      } else {
        setError('❌ ' + (data.error || 'Failed to initialize API keys'));
      }
    } catch (err: any) {
      setError('Error initializing keys: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden p-8">
      {/* Background */}
      <div 
        className="absolute inset-0" 
        style={{
          background: 'radial-gradient(ellipse at center, #f5f5f5 0%, #e8e8e8 50%, #d8d8f8 100%)'
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(45, 45, 45, 0.95), rgba(30, 30, 30, 0.95))',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h1 className="text-3xl font-bold text-white mb-6" style={{ fontFamily: 'Surgena, sans-serif' }}>
            Polymarket API Keys Setup
          </h1>

          <div className="space-y-4 mb-8 text-gray-300 text-sm">
            <p>
              To enable real-time WebSocket updates and place orders, you need to initialize your Polymarket API keys.
            </p>
            
            <div className="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <p className="text-yellow-400 font-semibold mb-2">⚠️ Security First</p>
              <ul className="list-disc list-inside space-y-1 text-gray-300 text-xs">
                <li>Use a dedicated trading wallet (not your main wallet)</li>
                <li>Only fund it with what you need for trading</li>
                <li>Never share your private key or commit .env.local to git</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <p className="text-blue-400 font-semibold mb-2">📝 Setup Steps</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-300 text-xs">
                <li>Create a .env.local file in the project root</li>
                <li>Add: POLYMARKET_PRIVATE_KEY=0xYourPrivateKeyHere</li>
                <li>Get your private key from MetaMask → Account Details → Export Private Key</li>
                <li>Restart the dev server (npm run dev)</li>
                <li>Click "Initialize API Keys" below</li>
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <motion.button
              onClick={checkConfiguration}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-lg font-medium bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Configuration'}
            </motion.button>

            <motion.button
              onClick={initializeKeys}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Initialize API Keys'}
            </motion.button>

            {status && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg"
              >
                <p className="text-green-400 font-semibold mb-3">{status}</p>
                
                {apiKeys && (
                  <div className="mt-3 pt-3 border-t border-green-600/20">
                    <p className="text-xs text-gray-400 mb-2">Generated API Keys (masked for security):</p>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">API Key:</span>
                        <span className="text-gray-300">{apiKeys.apiKey}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Secret:</span>
                        <span className="text-gray-300">{apiKeys.apiSecret}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Passphrase:</span>
                        <span className="text-gray-300">{apiKeys.apiPassphrase}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 These are cached in server memory and used for authenticated API calls
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg text-red-400"
              >
                {error}
              </motion.div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-white font-semibold mb-3">What Gets Enabled:</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Real-time WebSocket order book updates
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Live price changes and trade notifications
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Order placement and management
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Portfolio tracking and P&L
              </li>
            </ul>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <a
              href="/trade"
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              ← Back to Trading
            </a>
            <a
              href="/api/status"
              target="_blank"
              className="text-gray-400 hover:text-gray-300 text-xs underline"
            >
              View Integration Status →
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

