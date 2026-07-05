# N'ASSIST OT CONTROL

Application indépendante pour les objets trouvés : fiches OT, photos, signatures, train/destination, objets multiples dans la même souche, historique et export.

La reconnaissance photo est disponible avec une clé OpenAI. L'IA propose les objets, couleurs, marques visibles et description, puis l'agent vérifie et corrige avant enregistrement.

## Lancer en local

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

Ouvrir ensuite :

```text
http://127.0.0.1:3000/ot-control
```

## Déploiement Netlify

Dans Netlify :

- Build command : `npm run netlify:build`
- Publish directory : `.next`

Variables à ajouter dans Netlify :

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
OPENAI_VISION_MODEL="gpt-4o-mini"
```

Utiliser une base PostgreSQL externe comme Neon ou Supabase.
