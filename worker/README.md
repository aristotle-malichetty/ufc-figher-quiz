# UFC API Proxy Worker

This Cloudflare Worker proxies requests to the UFC API and adds your API key securely.

## Deploy in 3 steps:

### 1. Install Wrangler (if not installed)
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Deploy and add your API key
```bash
cd worker
wrangler deploy
wrangler secret put UFC_API_KEY
# Paste your API key when prompted
```

## Your worker URL will be:
```
https://ufc-api-proxy.<your-account>.workers.dev
```

## Update the quiz app:
Change `API_BASE` in `ufc-fighter-quiz.jsx` to your worker URL.
