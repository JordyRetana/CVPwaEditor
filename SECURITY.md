# Security

Do not commit production secrets to this repository.

Required private environment variables:

- `GROQ_API_KEY`
- `LICENSE_API_BASE_URL`

The Groq key is used only by the server-side API route. It must never be exposed to browser JavaScript.

For production:

- configure environment variables in Vercel or the selected host;
- rotate any token that was shared in chat, screenshots, logs, or support messages;
- keep the license backend separate from the PWA frontend;
- use one-device licenses for paid customers when needed;
- review deployments before sharing public URLs.
