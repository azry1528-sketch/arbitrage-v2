# Covesting

## Project info

Plateforme d'investissement en arbitrage crypto automatisé.

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Build the project with `npm run build` and deploy the `dist` folder to your hosting provider of choice (e.g. Vercel, Netlify).

## Can I connect a custom domain to my project?

Yes — configure it directly through your hosting provider's domain settings (e.g. Vercel > Project > Settings > Domains).

## Notifications push (Web Push)

1. Générer les clés : `npx web-push generate-vapid-keys`
2. Front : `VITE_VAPID_PUBLIC_KEY=<clé publique>` (Vercel + `.env`)
3. Secrets Supabase :
   `supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:contact@covesting.com PUSH_WEBHOOK_SECRET=<secret long>`
4. Déployer : `supabase functions deploy send-push` puis `supabase db push`
5. Exécuter une fois (SQL Editor) l'`INSERT INTO public.push_settings` en commentaire à la fin de
   `supabase/migrations/20261110120000_web_push.sql` (même secret que `PUSH_WEBHOOK_SECRET`).

Chaque ligne insérée dans `notifications` déclenche alors un push vers les appareils de l'utilisateur.
Envoi manuel / broadcast (admin) : `POST /functions/v1/send-push` avec `{ "broadcast": true, "title": "...", "body": "...", "url": "/dashboard" }`.
