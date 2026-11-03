import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { readPublicConfig } from './config/runtime'

const root = createRoot(document.getElementById('root')!);
try {
  readPublicConfig(import.meta.env);
  const { default: App } = await import('./App.tsx');
  root.render(<StrictMode><App /></StrictMode>);
} catch (error) {
  root.render(<main className="max-w-xl mx-auto p-8 mt-20"><h1 className="text-2xl font-bold mb-4">Connect Workify</h1><p role="alert">{error instanceof Error ? error.message : 'Workify could not start. Please reload.'}</p></main>);
}
