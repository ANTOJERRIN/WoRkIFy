import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { PublicConfigurationError, readPublicConfig } from './config/runtime'

const root = createRoot(document.getElementById('root')!)

function showStartupError(error: unknown) {
  const configurationError = error instanceof PublicConfigurationError
  root.render(
    <main role="alert" className="min-h-screen flex items-center justify-center bg-[#FAFAFC] px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-[#DDE0E8] bg-white p-8 shadow-sm">
        <img src="/workify-logo.png" alt="Workify" className="w-12 h-12 mb-5" />
        <h1 className="text-2xl font-bold text-[#070C1F] mb-4">
          {configurationError ? 'Workify configuration is incomplete' : 'Workify could not start'}
        </h1>
        <p className="text-sm text-[#636875] leading-relaxed">
          {configurationError ? error.message : 'Please reload the page. If the problem continues, contact the site administrator.'}
        </p>
      </div>
    </main>,
  )
}

try {
  readPublicConfig(import.meta.env)
  // Validate before loading modules that create the backend clients.
  void import('./App.tsx').then(({ default: App }) => {
    root.render(<StrictMode><App /></StrictMode>)
  }).catch(showStartupError)
} catch (error) {
  showStartupError(error)
}
