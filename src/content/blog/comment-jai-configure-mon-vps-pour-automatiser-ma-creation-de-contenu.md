---
title: "Comment j'ai configuré mon VPS pour automatiser ma création de contenu"
description: "6h de debug, deux installations en conflit, un modèle Gemini inexistant — voici comment j'ai finalement buildé un pipeline de contenu automatisé sur VPS."
pubDate: 2026-04-15
slug: "comment-jai-configure-mon-vps"
---

Franchement, j'ai passé une bonne partie de ma journée à batailler avec un truc qui semblait pourtant simple : installer un outil IA sur mon serveur et le connecter à Notion pour automatiser ma création de contenu.

Résultat ? Des heures perdues, des erreurs incompréhensibles, et une bonne dose de frustration. Mais c'est comme ça qu'on apprend.

## Le contexte

Mon objectif était simple : créer un pipeline automatisé qui prend un sujet, génère un post LinkedIn ou un article de blog avec Gemini, et l'envoie directement dans Notion. Le tout tourne sur un VPS Hetzner Ubuntu 24.

Stack cible : VPS Hetzner, OpenClaw, Gemini 2.5 Flash-Lite via API Google AI Studio, Notion API, Python 3.

## Le problème concret

Dès le début, le service plantait en boucle avec cette erreur : 
EADDRINUSE port 18789
Cause : j'avais deux installations en conflit — une en root, une en utilisateur normal. Deux fichiers de config différents, deux services qui se battaient sur le même port.

Le bug le plus vicieux : j'avais configuré le modèle Gemini avec le nom `gemini-2.5-flash-lite-preview-06-17`. Sauf qu'on est en avril, pas en juin. Ce modèle n'existait pas encore.

## La solution

Nettoyage complet d'abord :

```bash
sudo npm uninstall -g openclaw
rm -rf ~/.openclaw
sudo rm -rf /root/.openclaw
```

Réinstallation propre depuis l'utilisateur standard, correction du service systemd qui pointait vers l'ancien chemin root.

Pour trouver le bon nom de modèle, j'ai listé les modèles disponibles directement via l'API :

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=MA_CLE" | jq '.models[].name' | grep flash
```

Résultat : `gemini-2.5-flash-lite` — sans le suffixe de date.

Ensuite j'ai écrit un script Python qui appelle Gemini et envoie le résultat dans Notion :

```python
python3 generate_post.py "mon sujet" "LinkedIn" "notes.txt"
```

## Ce que j'ai appris

Les APIs IA changent vite. Ne jamais hardcoder un nom de modèle sans vérifier sa disponibilité réelle. Un curl sur l'endpoint `/models` prend 5 secondes et évite des heures de debug.

La séparation root/utilisateur sur un VPS est critique. Tout installer en root puis migrer crée des conflits invisibles.

## Prochaine étape

Automatiser la recherche de sujets tendance avec un script qui scrape Hacker News et Reddit chaque matin, et envoie les idées directement dans Notion.