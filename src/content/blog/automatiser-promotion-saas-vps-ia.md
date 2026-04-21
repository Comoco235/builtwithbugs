---
title: "Comment j'ai automatisé la promotion de mon SaaS depuis mon VPS : la stack 100% IA (Bugs inclus)"
description: "Découvre comment j'ai relié mon VPS Hetzner, Python et l'API Gemini pour automatiser la promotion LinkedIn de mon SaaS Copyboost, et les bugs que j'ai dû corriger."
pubDate: 2026-04-21
slug: "automatiser-promotion-saas-vps-ia"
---

<!-- markdownlint-disable MD033 -->
<img src="/images/builtwithbusg_article.webp" alt="Pipeline automatisation IA et VPS" style="width:100%; border-radius:12px; margin:1.5rem 0;" />

Je venais de lancer Copyboost sans savoir coder et mon infrastructure automatisée de contenu tournait enfin sur mon serveur. La prochaine étape logique ? Relier les deux.

Faire connaître un produit est toujours le plus difficile. Plutôt que de rédiger mes posts LinkedIn à la main chaque jour, j'ai décidé de modifier mon pipeline existant pour qu'il gère la promotion de mon SaaS de manière autonome.

> **TL;DR (Réponse Directe) :** Pour automatiser la promotion de mon SaaS Copyboost, j'ai modifié mon script **Python** hébergé sur un **VPS Hetzner**. J'utilise l'**API Gemini** pour générer des posts LinkedIn "Build in Public", qui sont ensuite envoyés vers l'API **Notion** pour relecture. Les principaux bugs rencontrés étaient un mon IA trop robotique corrigé via l'optimisation du **System Prompt** et la suppression des sauts de ligne corrigé avec un script de formatage Python.

## Le défi : Faire la promotion de Copyboost en automatique

Le plan sur le papier était parfait : demander à l'IA de trouver des angles d'attaque marketing pour Copyboost, écrire un post LinkedIn par jour, et le mettre en attente de publication.

Ma stack technique était déjà prête :

- **VPS Hetzner** (Ubuntu) pour faire tourner le script 24/7.
- **Python** pour la logique et les requêtes.
- **API Gemini** pour la génération de texte.
- **Notion** comme tableau de bord de validation.

Sauf que dans la réalité, rien ne s'est passé comme prévu.

## Le problème concret : Une IA "vendeuse de tapis" et des posts illisibles

Dès les premiers tests, je me suis heurté à deux gros bugs qui ruinaient complètement ma stratégie.

**1. Le "Robot Vendeur" de l'IA**
L'API me sortait des posts remplis d'emojis fusée 🚀 et de phrases du type : *"Révolutionnez votre marketing digital dès aujourd'hui avec Copyboost !"*.
Sur LinkedIn, c'est le meilleur moyen de se faire ignorer. L'audience veut de l'authenticité et de la transparence, pas une publicité générique.

**2. Le bug des sauts de ligne disparus dans Notion**
Une fois généré par l'IA, le texte partait vers l'API Notion. Sauf qu'à l'arrivée dans ma base de données, tous les sauts de ligne sautaient (`\n`). Résultat ? Des pavés de texte massifs, totalement illisibles et impossibles à publier tels quels.

## La solution technique : Prompt Engineering et nettoyage Python

Au lieu de tout jeter, j'ai itéré sur mon code pour patcher ces deux problèmes.

### Ajuster le "System Prompt" pour un ton Maker

Pour casser le côté robotique de l'**API Gemini**, j'ai dû changer sa personnalité à la racine en modifiant le *System Prompt* dans mon code **Python** :

- **L'instruction clé :** *"Tu es un Solopreneur Indie Hacker. Tu construis tes projets en public (Build in Public). Ton ton est direct, no-bullshit, sans jargon commercial. Ne vends pas Copyboost directement, raconte plutôt une galère technique ou un apprentissage marketing que le produit permet de résoudre."*
- **Interdiction d'emojis excessifs :** J'ai forcé l'utilisation d'un seul emoji maximum par post pour garder un aspect humain.

### Corriger le formatage des blocs avec Python

Pour le problème de **Notion** qui écrasait mes paragraphes, j'ai compris que l'API gère mal les blocs de texte brut trop longs contenant de simples caractères `\n`. J'ai donc ajouté une fonction spécifique dans mon script **Python** avant l'envoi :

- Le script découpe la réponse de l'IA bloc par bloc (en splitant sur `\n\n`).
- Il transforme chaque paragraphe en un bloc `paragraph` distinct formaté en JSON pour l'API Notion.
- Fini le mur de texte, je récupérais enfin des posts aérés et prêts à être relus.

## Ce que cette automatisation m'a appris

Automatiser la promotion d'un SaaS ne veut pas dire confier les clés du camion à une IA aveugle. C'est un travail de co-pilotage. La stack technique (**VPS Hetzner**, **Python**, **Notion**) est juste le tuyau. C'est le contexte (le prompt) qui définit la qualité du message.

Aujourd'hui, mon serveur me propose chaque matin des brouillons pertinents, ancrés dans la réalité de mon quotidien de maker, et bien formatés.

---
*D'ailleurs, si tu passes autant de temps à galérer sur l'écriture de tes textes de vente que j'en ai passé à déboguer ce script, tu devrais vraiment analyser ta copy. <a href="https://copyboost.io" target="_blank">Teste Copyboost gratuitement (3 analyses/jour)</a> sur tes propres textes marketing et vois pourquoi ils ne convertissent pas assez.*
