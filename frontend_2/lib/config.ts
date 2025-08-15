export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  scratchUrl: 'https://scratch.mit.edu/',
  edublocksUrl: 'https://app.edublocks.org/',
  maxExamplesPerLabel: 1000,
  maxLabels: 10,
  supportedLanguages: [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'zh', name: 'Chinese' },
  ],
  projectTypes: [
    { value: 'text', label: 'recognising text', icon: '📝' },
    { value: 'image', label: 'recognising images', icon: '🖼️' },
    { value: 'sound', label: 'recognising sounds', icon: '🔊' },
    { value: 'numbers', label: 'recognising numbers', icon: '🔢' },
  ],
}
