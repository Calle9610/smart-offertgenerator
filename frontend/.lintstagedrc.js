module.exports = {
  // TypeScript and JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // JSON, Markdown, and other files
  '**/*.{json,md,yml,yaml,html,css,scss}': [
    'prettier --write',
  ],
  
  // TypeScript type checking for changed files
  '**/*.{ts,tsx}': () => 'tsc --noEmit --incremental false',
};
