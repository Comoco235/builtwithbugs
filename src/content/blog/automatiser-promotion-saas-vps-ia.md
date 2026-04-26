---
title: "Comment j'ai automatisé la promotion de mon SaaS depuis mon VPS (Stack IA, bugs inclus)"
description: "VPS Hetzner + Python + API Gemini : comment j'automatise mes posts LinkedIn Build in Public pour Copyboost, les bugs rencontrés et comment je les ai corrigés."
pubDate: 2026-04-21
slug: "automatiser-promotion-saas-vps-ia"
heroImage: "../../assets/blog-placeholder-2.jpg"
tags: ["SaaS", "VPS", "Automatisation", "IA", "Python"]
faq:
  - question: "Peut-on vraiment automatiser ses posts LinkedIn sans paraître robotique ?"
    answer: "Oui, à condition de soigner le System Prompt de ton modèle IA. L'erreur classique est de demander à l'IA de \"promouvoir ton produit\" sans lui donner de personnalité ni de contraintes de ton. Avec les bonnes instructions ton direct, interdiction de jargon commercial, format \"Build in Public\", le résultat est indiscernable d'un post rédigé manuellement."
  - question: "Quel est le coût de cette stack d'automatisation ?"
    answer: "La stack décrite ici est pensée pour être économique : un VPS Hetzner de base coûte entre 4 et 6 € / mois. L'API Gemini dispose d'un généreux tier gratuit (plus que suffisant pour quelques posts par jour). Notion est gratuit pour un usage solo. Le coût total peut donc être proche de zéro selon ton volume."
  - question: "Faut-il savoir coder pour mettre en place ce type d'automatisation ?"
    answer: "Pas nécessairement. J'ai démarré ce projet sans background de développeur. Les scripts Python utilisés ici sont simples et peuvent être générés ou adaptés avec l'aide d'un assistant IA (ChatGPT, Gemini, Claude). L'essentiel est de comprendre la logique du pipeline : un script collecte un contexte, l'envoie à une API, formate la réponse, et l'envoie vers un outil de validation."
  - question: "Quelle est la différence entre automatiser du contenu et du spam ?"
    answer: "La différence est dans la validation humaine. Ce pipeline ne publie rien automatiquement : chaque brouillon passe par Notion pour relecture. L'humain reste la dernière décision. Automatiser la génération, pas la publication — c'est la règle d'or pour rester authentique."
  - question: "Peut-on adapter ce pipeline à d'autres réseaux sociaux que LinkedIn ?"
    answer: "Absolument. La logique du pipeline (VPS + Python + API Gemini + outil de validation) est agnostique au canal. Il suffit d'adapter le System Prompt au format et au ton propre à chaque réseau : plus court et visuel pour X/Twitter, plus long et structuré pour un newsletter, etc."
---

<!-- markdownlint-disable MD033 -->
<img src="/images/builtwithbusg_article.webp" alt="Pipeline automatisation IA promotion SaaS VPS Hetzner Python Gemini" style="width:100%; border-radius:12px; margin:1.5rem 0;" />

**TL;DR :** VPS Hetzner + Python + API Gemini = des brouillons LinkedIn "Build in Public" générés chaque matin, envoyés automatiquement dans Notion pour relecture. Deux bugs majeurs à corriger en chemin : une IA trop commerciale corrigée via le System Prompt et des sauts de ligne écrasés dans Notion corrigés avec un script Python de formatage. Voici exactement comment j'ai fait.

## Le point de départ : promouvoir Copyboost sans y passer mes journées

J'avais lancé Copyboost sans savoir coder. Mon infrastructure d'automatisation de contenu tournait déjà sur mon VPS. La prochaine étape logique ? Brancher la promotion de mon SaaS dessus.

Parce que faire connaître un produit, c'est souvent le truc le plus dur et le plus chronophage. Rédiger un post LinkedIn pertinent chaque jour à la main, trouver un angle, formater le texte… ça prend facilement 30 à 45 minutes.

Mon plan : modifier mon pipeline Python existant pour qu'il génère automatiquement des posts LinkedIn "Build in Public" pour Copyboost, en autonome, chaque matin.

Ma stack technique était déjà en place :

- **VPS Hetzner (Ubuntu)** : le serveur qui fait tourner tout ça 24/7
- **Python** : la colle entre les services
- **API Gemini** : le moteur de génération de texte
- **Notion** : le tableau de bord de validation avant publication

Sur le papier, 2h de travail. Dans la réalité ? J'ai passé deux jours à debugger.

## Les deux bugs qui ont tout cassé (et comment je les ai réglés)

### Bug #1 : L'IA en mode "vendeur de tapis"

Dès les premiers tests, l'API Gemini me sortait des posts LinkedIn du genre :
> *"Révolutionnez votre marketing digital dès aujourd'hui avec Copyboost ! Notre outil IA va transformer votre stratégie de contenu !"*

Sur LinkedIn, c'est le meilleur moyen d'être ignoré. L'audience — et notamment les Indie Hackers et les makers — veut de l'authenticité, pas une pub générique. Le problème n'était pas l'API, c'était mon System Prompt : je ne lui avais donné aucun contexte sur le ton attendu.

### Bug #2 : Les sauts de ligne qui disparaissent dans Notion

Le texte généré partait vers l'API Notion. Sauf qu'à l'arrivée, tous les `\n` sautaient. Résultat : un pavé de texte massif, illisible, impossible à publier tel quel.

La cause : l'API Notion ne gère pas les blocs de texte brut longs avec des `\n` simples. Il faut transformer chaque paragraphe en un bloc `paragraph` JSON distinct.

## La solution technique, étape par étape

### Étape 1 : Réécrire le System Prompt pour forcer un ton "maker"

C'est le levier le plus puissant du prompt engineering : définir précisément l'identité de l'IA avant de lui demander quoi que ce soit.

Voici l'instruction clé que j'ai intégrée dans mon script Python :

```python
system_prompt = """
Tu es un Solopreneur Indie Hacker qui construit ses projets en public (Build in Public).
Ton ton est direct, no-bullshit, sans jargon commercial.
Ne vends pas Copyboost directement.
Raconte plutôt une galère technique ou un apprentissage concret que le produit permet de résoudre.
Utilise un seul emoji maximum par post. Jamais de points d'exclamation excessifs.
"""
```

**Résultat immédiat :** les posts sont passés de publicités génériques à des récits authentiques sur le quotidien d'un maker. C'est exactement ce qui performe sur LinkedIn dans la niche Build in Public.

> **À retenir :** La qualité du contenu généré par une IA est presque entièrement déterminée par la qualité de son contexte de départ. Le modèle n'est que l'exécutant.

### Étape 2 : Corriger le formatage Notion avec Python

Pour régler le problème des sauts de ligne, j'ai ajouté une fonction de formatage dans mon script, avant l'envoi vers l'API Notion :

```python
def format_for_notion(text):
    paragraphs = text.split("\n\n")
    blocks = []
    for para in paragraphs:
        if para.strip():
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{
                        "type": "text",
                        "text": {"content": para.strip()}
                    }]
                }
            })
    return blocks
```

Ce que fait ce script :

1. Découpe la réponse de l'IA paragraphe par paragraphe (split sur `\n\n`)
2. Transforme chaque paragraphe en un bloc `paragraph` JSON compatible avec l'API Notion
3. Envoie une liste de blocs propres et aérés, prêts à relire

Fini le mur de texte. Je récupère maintenant des posts structurés directement dans ma base Notion.

## Ce que cette automatisation m'a vraiment appris

L'automatisation de la promotion d'un SaaS, ce n'est pas "mettre une IA aux commandes et partir en vacances". C'est du co-pilotage.

La stack technique (VPS, Python, Notion) est juste le tuyau. Ce qui définit la qualité du message, c'est le contexte que tu donnes à l'IA : le prompt, les contraintes, le ton. Et ça, ça demande de l'itération.

Aujourd'hui, mon serveur me propose chaque matin 3 à 5 brouillons pertinents, ancrés dans mon quotidien de maker, bien formatés et prêts à relire dans Notion. Je valide, j'ajuste si besoin, je publie. Ce qui me prenait 30 à 45 minutes prend maintenant 5 minutes.

## Aller plus loin : ressources et maillage

Si cet article t'a été utile, voici d'autres ressources qui complètent ce sujet :

- 📌 **[Comment j'ai monté mon VPS Hetzner de zéro sans savoir coder](/blog/comment-jai-configure-mon-vps-pour-automatiser-ma-creation-de-contenu)**. Le point de départ de toute cette stack.
- 📌 **Prompt Engineering pour Makers : les 5 instructions qui changent tout**. Aller plus loin dans l'optimisation des System Prompts.
- 📌 **Automatiser sa présence LinkedIn avec Python et l'API Notion**. Le détail complet du pipeline de contenu.

Tu utilises une stack similaire ou tu as des questions sur un point précis ? Dis-le en commentaire — ou retrouve-moi sur LinkedIn pour qu'on en parle directement.
