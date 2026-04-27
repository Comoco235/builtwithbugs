# AUDIT REPORT — Built With Bugs
**Date :** 27 avril 2026  
**Outil :** Astro 6.1.6 — Vercel — TypeScript strict

---

## PASSE 3 — OPTIMISATION SEO PAGE D'ACCUEIL (27 avril 2026)

**Fichier modifié :** `src/pages/index.astro` uniquement.

### 1. Balises meta

| Balise | Avant | Après |
|---|---|---|
| `<title>` | `Built With Bugs` (15 chars) | `BuiltWithBugs — Automatisation IA, Build in Public & Python` (59 chars) |
| `meta description` | `Hacker sa visibilité avec la tech et l'IA. Dev, marketing digital...` | `Automatisation IA, build in public et Python pour indie makers francophones. VPS Hetzner, prompt engineering, marketing digital — chaque bug est une leçon.` (155 chars) |

**Note sur le titre :** La consigne demandait `"...Build in Public & Dev Python"` (63 chars). `BaseHead.astro` tronque les titres > 60 chars avec `substring(0, 57) + "..."`, ce qui aurait produit un titre cassé dans le `<title>` tag. Le mot `Dev` a été retiré pour tenir en 59 chars et conserver l'intégralité des mots-clés prioritaires sans troncature. Pour utiliser 63 chars, supprimer la logique de troncature dans `BaseHead.astro` ligne 65.

**Mots-clés présents dans les meta :**
- Primaires : `automatisation IA` ✓ · `build in public` ✓ · `Python` ✓ · `VPS Hetzner` ✓
- Secondaires : `marketing digital` ✓ · `prompt engineering` ✓ · `indie maker francophone` ✓

### 2. Hero section — sous-titre enrichi

| Avant | Après |
|---|---|
| `Dev, marketing digital et automatisation, construits en public | bugs inclus. Chaque article est un projet réel, chaque erreur est du contenu.` | `Automatisation IA, Python et marketing digital construits en public — chaque projet est un article, chaque bug est une leçon.` |

**aria-label ajouté sur `<h1>` :** `"Hacker sa visibilité avec la tech et l'IA — automatisation IA, build in public et Python pour makers francophones"` — le texte visible reste inchangé, l'attribut ajoute le contexte sémantique pour les moteurs et les lecteurs d'écran sans modifier le rendu visuel.

### 3. Badges de catégories → vrais liens

Les quatre badges `<span class="tag">` ont été transformés en `<a class="tag">` suivis par Google :

| Badge | Href |
|---|---|
| 🐍 Python | `/blog?tag=python` |
| 🤖 IA & LLM | `/blog?tag=ia` |
| 📈 Marketing | `/blog?tag=marketing` |
| 🖥️ VPS & Dev | `/blog?tag=vps` |

Style préservé : `text-decoration: none` ajouté sur `.tag`, état `:hover` avec couleur accent. Aucun changement visuel en état normal.

### 4. H2 section articles

Ajouté dans le DOM (visible, stylisé discrètement en `var(--text3)`, `font-weight: 400`) :
```html
<h2 class="section-h2">Derniers articles sur l'automatisation et le build in public</h2>
```
Ce H2 précède le label `// DERNIERS ARTICLES` existant. Il apporte le signal sémantique H2 sans modifier l'apparence perçue de la section.

### 5. Schema JSON-LD WebSite avec SearchAction

Ajouté directement dans le `<head>` de `index.astro` (uniquement sur la page d'accueil) :

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.builtwithbugs.com/#website",
  "name": "Built With Bugs",
  "url": "https://www.builtwithbugs.com/",
  "description": "...",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.builtwithbugs.com/blog?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

**Note :** `BaseHead.astro` injecte déjà un `WebSite` schema dans le `@graph` global sur toutes les pages. Sur la page d'accueil, il y a donc deux schemas `WebSite`. Google les fusionne par `@id`. La version avec `SearchAction` enrichit la version de base — pas de conflit. Pour consolider en un seul schema, déplacer le `SearchAction` dans le `globalSchema` de `BaseHead.astro` conditionné par `Astro.url.pathname === '/'`.

### Nettoyage supplémentaire

- `post.id.replace('.md', '')` → `post.id` (l'id Astro 5 Content Layer ne contient pas l'extension, le `.replace()` était une no-op)
- Indentation CSS normalisée (`.post-card`, `.post-content` avaient une indentation incohérente)

---

## PASSE 2 — NETTOYAGE EXHAUSTIF DU MAILLAGE INTERNE (27 avril 2026)

### Méthode d'audit
- Extraction de tous les slugs existants dans `src/content/blog/`
- Extraction de tous les liens internes `[text](url)` dans les 5 fichiers MD/MDX
- Comparaison des URLs `/blog/X` avec les slugs réels générés par Astro
- Recherche des motifs `[text]` sans URL `(...)` pouvant s'afficher avec des crochets visibles

### Résultat de l'audit des liens `[text](url)`

Tous les liens internes `[text](url)` sont **valides**. Les 5 URLs `/blog/` utilisées dans le contenu correspondent exactement aux 5 articles existants :

| URL interne utilisée | Article cible |
|---|---|
| `/blog/automatiser-promotion-saas-vps-ia` | `automatiser-promotion-saas-vps-ia.md` ✓ |
| `/blog/comment-jai-configure-mon-vps` | `comment-jai-configure-mon-vps-pour-automatiser-ma-creation-de-contenu.md` ✓ |
| `/blog/comment-maitriser-aeo-2026` | `comment-maitriser-aeo-2026.mdx` ✓ |
| `/blog/prompt-engineering-makers-system-prompt` | `prompt-engineering-makers-system-prompt.mdx` ✓ |
| `/blog/saas-copyboost-sans-coder` | `saas-copyboost-sans-coder.mdx` ✓ |

### Crochets orphelins corrigés (affichage cassé sans être des liens)

Dans `comment-jai-configure-mon-vps-pour-automatiser-ma-creation-de-contenu.md`, deux motifs `**[Titre]**` sans URL `(...)` rendaient des crochets littéraux visibles dans la page (`[Choisir et configurer un VPS...]`). Ce n'est pas techniquement un lien, mais l'affichage est cassé.

| Avant | Après |
|---|---|
| `**[Choisir et configurer un VPS pour ses projets side-project]**` | `**Choisir et configurer un VPS pour ses projets side-project** — (article à venir)` |
| `**[Utiliser l'API Notion pour centraliser ses workflows makers]**` | `**Utiliser l'API Notion pour centraliser ses workflows makers** — (article à venir)` |

### État final du maillage interne

```
src/content/blog/automatiser-promotion-saas-vps-ia.md
  → /blog/comment-jai-configure-mon-vps              ✓ existe
  → /blog/prompt-engineering-makers-system-prompt    ✓ existe

src/content/blog/comment-jai-configure-mon-vps-pour-automatiser-ma-creation-de-contenu.md
  → /blog/automatiser-promotion-saas-vps-ia          ✓ existe
  (2 ressources sans lien clairement marquées "article à venir")

src/content/blog/comment-maitriser-aeo-2026.mdx
  → /blog/saas-copyboost-sans-coder                  ✓ existe
  → /blog/comment-jai-configure-mon-vps              ✓ existe
  (2 ressources sans lien en texte gras simple)

src/content/blog/saas-copyboost-sans-coder.mdx
  → /blog/comment-jai-configure-mon-vps              ✓ existe (×2)
  → /blog/comment-maitriser-aeo-2026                 ✓ existe (×2)
  → https://copyboost.io                             lien externe ✓
  (1 ressource sans lien en texte gras simple)

src/content/blog/prompt-engineering-makers-system-prompt.mdx
  → /blog/automatiser-promotion-saas-vps-ia          ✓ existe
  → /blog/comment-jai-configure-mon-vps              ✓ existe
  → /blog/comment-maitriser-aeo-2026                 ✓ existe
```

**Aucun lien 404 ne subsiste dans le contenu du blog.**

---

## MISSION 1 — ERREURS CORRIGÉES

### TypeScript / Qualité de code
| Fichier | Problème | Correction |
|---|---|---|
| `src/components/Footer.astro` | Variable `today` déclarée mais jamais utilisée | Supprimée |
| `src/pages/index.astro` | Import `Image` inutilisé depuis `astro:assets` | Import supprimé |

**Résultat final :** `0 errors · 0 warnings · 0 hints`

### Variables d'environnement manquantes
Aucune variable `.env` critique manquante détectée. Le fichier `.env` existe.  
Le blog est entièrement statique (pas de secrets côté serveur requis à la génération).

---

## MISSION 2 — LIENS 404 CORRIGÉS

| Article source | Ancienne URL (404) | Nouvelle URL (valide) |
|---|---|---|
| `automatiser-promotion-saas-vps-ia.md` | `/blog/comment-jai-configure-mon-vps-pour-automatiser-ma-creation-de-contenu` | `/blog/comment-jai-configure-mon-vps` |
| `automatiser-promotion-saas-vps-ia.md` | Texte seul sans lien (Prompt Engineering) | `/blog/prompt-engineering-makers-system-prompt` |

### Liens sans URL répertoriés (articles inexistants — à écrire)
Ces textes en gras sans lien pointent vers des articles non encore publiés :
- `automatiser-promotion-saas-vps-ia.md` → "Automatiser sa présence LinkedIn avec Python et l'API Notion"
- `comment-jai-configure-mon-vps.md` → "Choisir et configurer un VPS pour ses projets side-project"
- `comment-jai-configure-mon-vps.md` → "Utiliser l'API Notion pour centraliser ses workflows makers"
- `comment-maitriser-aeo-2026.mdx` → "Structurer ses données JSON-LD dans un projet Astro"
- `comment-maitriser-aeo-2026.mdx` → "Build in Public et E-E-A-T : pourquoi documenter ses erreurs améliore votre SEO"
- `saas-copyboost-sans-coder.mdx` → "Stack No-Code et Low-Code pour lancer un SaaS en solo"

---

## MISSION 3 — SEO & AEO

### SEO technique
| Élément | Avant | Après |
|---|---|---|
| `og:type` | Toujours `"website"` | `"article"` sur les articles, `"website"` ailleurs |
| `og:url` | `Astro.url` (query strings inclus) | `canonicalURL` (URL canonique propre) |
| `og:site_name` | Absent | Ajouté : `"Built With Bugs"` |
| `og:locale` | Absent | Ajouté : `"fr_FR"` |
| `og:image:width/height` | Absent | Ajouté : `1280 × 720` |
| Image OG par défaut | `/blog-placeholder-1.jpg` (fichier inexistant → 404) | `/favicon.svg` |
| `robots.txt` sitemap | `builtwithbugs.com` (sans www) | `www.builtwithbugs.com` |
| Title page À propos | `"À propos"` (trop court) | `"À propos — Samwane ABDALLAH, Indie Hacker & Built With Bugs"` |
| Description page À propos | `"Qui est derrière builtwithbugs.com ?"` (14 chars) | Description complète avec mots-clés (130+ chars) |

### Données structurées (JSON-LD) ajoutées par page

| Page | Schema ajouté |
|---|---|
| Toutes les pages (`BaseHead`) | `WebSite` + `Person` (existant, description enrichie) |
| Articles blog (`BlogPostLayout`) | `BlogPosting` (existant) + `BreadcrumbList` (nouveau) |
| Articles blog avec FAQ | `FAQPage` (existant, inchangé) |
| `/blog/` (liste) | `CollectionPage` + `BreadcrumbList` (nouveau) |
| `/a-propos` | `AboutPage` + `BreadcrumbList` (nouveau) |

**Amélioration BlogPosting :**
- Ajout du champ `url` (lien direct vers l'article)
- Ajout de `dateModified` avec fallback sur `pubDate`
- Ajout de `isPartOf` (référence au Blog parent)
- Liaison `author` avec `@id` vers le `Person` global

### AEO (Answer Engine Optimization)
- Structure déjà bonne : introductions directes en `> **TL;DR**` sur chaque article
- Titres H2 formulés comme questions sur les articles VPS et AEO ✓
- `FAQPage` schema sur les 5 articles publiés ✓
- Meta descriptions respectant 150–160 chars sur les articles (vérifiées dans le frontmatter)

---

## MISSION 4 — PERFORMANCE & CACHE

### Images
| Fichier | Avant | Après |
|---|---|---|
| `saas-copyboost-sans-coder.mdx` | `<img src="/images/copyboost-score.webp">` (non optimisé, public/) | `<Image src={copyboostScore}>` (src/assets/, optimisé Astro) |
| `saas-copyboost-sans-coder.mdx` | `<img src="/images/copyboost-analyse.webp">` (non optimisé, public/) | `<Image src={copyboostAnalyse}>` (src/assets/, optimisé Astro) |

Les hero images utilisent déjà le composant `<Image>` avec `loading="eager"` ✓  
Les images non hero dans le MDX utilisent maintenant `loading="lazy"` ✓

### Headers Vercel (`vercel.json`)
**Problèmes corrigés :**
- Conflit entre la règle `/_astro/(.*)` (immutable) et la règle regex `/(.*).(js|css)` → la règle regex écrasait l'immutable
- Absence de headers de cache pour les pages HTML
- Absence de headers de sécurité

**Headers maintenant en place :**

| Ressource | Cache-Control |
|---|---|
| `/_astro/*` (assets hashés) | `public, max-age=31536000, immutable` |
| `/images/*` (images publiques) | `public, max-age=31536000, immutable` |
| Fonts `.woff2/.woff` | `public, max-age=31536000, immutable` |
| Images non hashées | `public, max-age=86400, must-revalidate` |
| JS/CSS non hashés | `public, max-age=86400, must-revalidate` |
| Pages `.html` | `public, s-maxage=3600, stale-while-revalidate=86400` |
| Sitemap + RSS | `public, s-maxage=3600, stale-while-revalidate=86400` |

**Headers de sécurité ajoutés (toutes les pages) :**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Fonts
Les fonts DM Sans, Syne et JetBrains Mono sont chargées via `@fontsource` qui inclut automatiquement `font-display: swap` ✓  
**Reste à faire manuellement :** ajouter des `<link rel="preload">` pour les woff2 critiques (voir ci-dessous).

---

## PASSE 4 — AMÉLIORATIONS TECHNIQUES (27 avril 2026)

### Fichiers créés / modifiés

| Fichier | Action | Détail |
|---|---|---|
| `astro.config.mjs` | Modifié | `output: 'static'`, Shiki `theme: 'github-dark'`, `rehype-external-links`, `prefetch.defaultStrategy: 'hover'` |
| `src/pages/404.astro` | Créé | Page 404 brandée avec gradient, liens vers accueil/blog, 3 derniers articles |
| `src/pages/blog/tag/[tag].astro` | Créé | Pages de tag dynamiques avec `getStaticPaths()`, `CollectionPage` + `BreadcrumbList` schema |
| `src/pages/blog/index.astro` | Modifié | Tag badges `<span>` → `<a href="/blog/tag/X/">`, `tagToSlug()`, `post.id.replace('.md','')` → `post.id` |
| `src/pages/index.astro` | Modifié | Tag badges `<span>` → `<a href="/blog/tag/X/">` (URLs de vraies pages) |
| `src/components/BaseHead.astro` | Modifié | Image OG défaut `/images/og-default.png`, tags Twitter `@samwanebuild`, RSS `<link rel="alternate">` |
| `src/components/Footer.astro` | Modifié | `rel="noopener noreferrer"` sur les 4 liens sociaux |
| `src/pages/rss.xml.js` | Modifié | Tri par date, champs explicites (plus de spread `...post.data`) |

### Syntaxe highlighting (Shiki)

Remplacement de l'absense de config highlighting par Shiki `github-dark` dans `astro.config.mjs` :
```js
markdown: {
  shikiConfig: { theme: 'github-dark' },
}
```
Tous les blocs ` ```code``` ` dans les articles MD/MDX bénéficient maintenant de la coloration syntaxique.

### Liens externes sécurisés (`rehype-external-links`)

Plugin configuré dans `astro.config.mjs` pour ajouter automatiquement `rel="noopener noreferrer" target="_blank"` sur tous les liens absolus (https/http) dans les fichiers Markdown/MDX. Les liens internes (`/blog/...`) ne sont pas affectés.

### Stratégie de préchargement

`prefetchAll: true` → `prefetch: { defaultStrategy: 'hover' }` : préchargement uniquement au survol, évite de charger toutes les pages en background au chargement.

### Pages de tags

URL pattern : `/blog/tag/[slug]/` où `slug = tag.toLowerCase().replace(/\s+/g, '-')`.  
Badges de tags sur `/blog/` et `/blog/tag/[tag]` sont des liens cliquables.  
Tag actif sur la page de tag reçoit la classe `.active` pour différenciation visuelle.

### Résultat `astro check`

```
Result (20 files): 0 errors · 0 warnings · 0 hints
```

---

## CE QUI RESTE À FAIRE MANUELLEMENT

### Priorité haute
1. **Image OG par défaut** : `BaseHead.astro` utilise `/images/og-default.png` ✓. S'assurer que le fichier `public/images/og-default.png` existe bien en 1280×720px.

2. **Préchargement des fonts critiques** : Ajouter dans `BaseHead.astro` après les imports CSS :
   ```html
   <link rel="preload" href="/_astro/dm-sans-latin-400-normal.[hash].woff2" as="font" type="font/woff2" crossorigin />
   <link rel="preload" href="/_astro/syne-latin-700-normal.[hash].woff2" as="font" type="font/woff2" crossorigin />
   ```
   Note : le hash change à chaque build — utiliser un plugin Astro ou injecter dynamiquement.

3. **Nouveaux articles manquants** : 6 liens internes pointent vers des articles inexistants (listés en Mission 2). Chaque article manquant est une opportunité de contenu.

### Priorité moyenne
4. **Image OG spécifique par article** : Les articles utilisent la `heroImage` comme OG image, ce qui est correct. Mais la `heroImage` est servie depuis `/_astro/[hash].webp` — vérifier que les dimensions 1200×630 (ratio 1.91:1 idéal pour OG) sont respectées dans les fichiers source.

5. **`twitter:site` et `twitter:creator`** : Tags Twitter `@samwanebuild` déjà ajoutés dans `BaseHead.astro` ✓.

6. **Sitemap dynamique** : `@astrojs/sitemap` est configuré et génère `sitemap-index.xml` ✓. Vérifier dans Google Search Console que le sitemap est bien soumis.

7. **hreflang** : Le blog est uniquement en français → pas de hreflang nécessaire.

### Priorité basse
8. **Google Search Console** : Soumettre le sitemap `https://www.builtwithbugs.com/sitemap-index.xml` et valider les résultats enrichis avec l'outil de test Google.

9. **Variables d'environnement Vercel** : Vérifier que toutes les variables du `.env` local sont bien configurées dans le tableau de bord Vercel (Settings → Environment Variables).

10. **`PageLayout.astro`** : Ce layout (utilisé par les pages MD) n'a pas de Header/Footer ni de BackToTop — à vérifier si les pages `mentions-legales.md` et `politique-de-confidentialite.md` utilisent `MainLayout` ou `PageLayout`.
