# Security

Do not commit production secrets to this repository.

Required private environment variables:

- `GROQ_API_KEY`

The Groq key is used only by the server-side API route. It must never be exposed to browser JavaScript.

For production:

- configure environment variables in Vercel or the selected host;
- rotate any token that was shared in chat, screenshots, logs, or support messages;
- review deployments before sharing public URLs.
