---
title: "Comment j'ai configuré mon VPS pour automatiser ma création de contenu (6h de debug, vrais bugs)"
description: "Conflit de port, modèle Gemini inexistant, double installation en conflit : comment j'ai finalement monté un pipeline de contenu automatisé sur VPS Hetzner avec Python et Notion."
pubDate: 2026-04-15
slug: "comment-jai-configure-mon-vps"
heroImage: "../../assets/blog-placeholder-4.jpg"
tags: ["VPS", "Hetzner", "Python", "Gemini", "Automation"]
faq:
  - question: "Quel VPS choisir pour héberger un pipeline Python avec des APIs IA ?"
    answer: "Hetzner est le choix le plus courant dans la communauté Indie Hacker pour une raison simple : le rapport prix/performance est imbattable en Europe. Un serveur CX22 à 4 à 6 euros par mois suffit largement pour faire tourner des scripts Python qui appellent des APIs externes. La puissance de calcul nécessaire est faible puisque le travail lourd se passe côté API Gemini, pas côté serveur."
  - question: "Comment éviter les conflits lors de l'installation d'outils sur un VPS ?"
    answer: "La règle la plus simple : choisir un seul utilisateur pour gérer ses installations et ne jamais mélanger root et utilisateur standard pour le même outil. En pratique, cela signifie vérifier avant chaque installation si une version existe déjà avec which nom_outil et sudo which nom_outil. Un nettoyage complet avant réinstallation vaut toujours mieux qu'une tentative de correction à chaud."
  - question: "L'API Gemini est-elle gratuite pour ce type d'usage ?"
    answer: "Google AI Studio propose un tier gratuit généreux sur Gemini 2.5 Flash-Lite. Pour un usage solo, envoyer quelques requêtes par jour pour générer des posts ou des articles reste très en dessous des limites gratuites. Le coût devient pertinent seulement à partir d'un volume significatif de requêtes quotidiennes, ce qui est rarement le cas pour un solopreneur qui valide ses brouillons manuellement."
  - question: "Faut-il savoir coder pour monter ce type de pipeline ?"
    answer: "Non, à condition d'accepter d'itérer. Le script Python utilisé ici est relativement simple : il appelle une API, récupère une réponse, en appelle une autre. Ce genre de code peut être généré et adapté avec l'aide d'un assistant IA. Ce qui demande de la compréhension, c'est la partie débogage : lire les messages d'erreur, comprendre ce qu'ils signifient, savoir où chercher. C'est ça qui prend du temps au début."
  - question: "Comment vérifier qu'un modèle Gemini est disponible avant de l'utiliser ?"
    answer: "Un appel direct à l'endpoint de liste de modèles de l'API suffit. La commande est la suivante : curl \"https://generativelanguage.googleapis.com/v1beta/models?key=VOTRE_CLE\" | jq '.models[].name'. Cela retourne la liste exacte des modèles accessibles avec votre clé API à l'instant où vous lancez la commande, ce qui évite de travailler avec un nom de modèle périmé ou pas encore disponible."
---

<!-- markdownlint-disable MD033 -->

> **TL;DR :** VPS Hetzner Ubuntu 24 + Python 3 + API Gemini 2.5 Flash-Lite + API Notion. Le bug principal : un conflit de port `EADDRINUSE 18789` causé par une double installation d'OpenClaw une en root, une en utilisateur normal. Deuxième bug : un nom de modèle Gemini qui n'existait pas encore en avril. Voici comment j'ai réglé les deux.

Franchement, j'ai passé une bonne partie de ma journée à batailler avec un truc qui semblait pourtant simple. Installer un outil IA sur mon serveur, le connecter à Notion, et laisser le pipeline tourner tout seul.

Des heures perdues, des erreurs incompréhensibles, un terminal qui crache des messages d'erreur en boucle. C'est comme ça que ça se passe vraiment quand on déploie ce genre de stack sans background de dev.

## Le contexte : pourquoi automatiser la création de contenu sur un VPS

L'objectif était simple sur le papier. Donner un sujet au script, il génère un post LinkedIn ou un article de blog via Gemini, et envoie le résultat directement dans Notion pour relecture. Le tout tourne en autonome sur un VPS Hetzner Ubuntu 24, sans que j'aie à ouvrir mon laptop.

La stack cible :

- VPS Hetzner (Ubuntu 24)
- OpenClaw
- API Gemini 2.5 Flash-Lite via Google AI Studio
- API Notion
- Python 3

C'est ce que j'avais en tête. Voici ce qui s'est passé à l'exécution.

## Les deux bugs qui ont mangé ma journée

### Bug 1 : le conflit de port EADDRINUSE

Dès le premier lancement, le service plantait en boucle avec cette erreur :

```text
EADDRINUSE port 18789
```

Après investigation, la cause était bête : j'avais deux installations d'OpenClaw qui cohabitaient sur le même serveur. Une installée en `root`, une autre installée depuis mon utilisateur normal. Deux fichiers de configuration différents, deux services qui se battaient pour écouter sur le même port.

C'est le genre de conflit invisible qui ne produit aucun message d'erreur explicite. Juste un service qui refuse de démarrer, en boucle.

### Bug 2 : le modèle Gemini qui n'existait pas

Le bug le plus vicieux. J'avais configuré mon script avec ce nom de modèle :

```text
gemini-2.5-flash-lite-preview-06-17
```

Le suffixe `06-17` correspond à une date de sortie : juin 2026. On est en avril. Ce modèle n'existe tout simplement pas encore. L'API renvoyait une erreur 404 sur chaque requête, et j'ai perdu un temps inutile à chercher une erreur dans mon code Python alors que le problème était ailleurs.

## La solution technique, étape par étape

### Nettoyage complet du serveur

La première chose à faire était de repartir d'une base propre. J'ai supprimé les deux installations en conflit :

```bash
sudo npm uninstall -g openclaw
rm -rf ~/.openclaw
sudo rm -rf /root/.openclaw
```

Ensuite, réinstallation propre depuis l'utilisateur standard uniquement, et correction du fichier de service systemd qui pointait encore vers l'ancien chemin en root.

### Trouver le bon nom de modèle Gemini

Pour ne plus jamais hardcoder un nom de modèle à l'aveugle, j'ai listé les modèles réellement disponibles via l'API :

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=MA_CLE" | jq '.models[].name' | grep flash
```

Résultat : le bon nom était `gemini-2.5-flash-lite`, sans suffixe de date. Cinq secondes de vérification pour éviter des heures de debug.

### Le script Python final

Une fois la stack propre, le pipeline fonctionne avec une commande simple :

```bash
python3 generate_post.py "mon sujet" "LinkedIn" "notes.txt"
```

Le script appelle Gemini avec le sujet et les notes, récupère la réponse, et l'envoie formatée dans Notion via l'API.

## Ce que cette journée m'a appris sur le déploiement IA

Deux règles que j'applique maintenant systématiquement avant de déployer quoi que ce soit sur un VPS.

**Ne jamais hardcoder un nom de modèle IA.** Les APIs Gemini, OpenAI et consorts changent vite. Un modèle disponible aujourd'hui peut changer de nom ou disparaître demain. Un appel à l'endpoint `/models` avant de commencer prend trente secondes et évite ce genre de bug absurde.

**La séparation root/utilisateur sur un VPS est critique.** Tout installer en root puis migrer vers un utilisateur normal crée des conflits de configuration que systemd et les gestionnaires de paquets ne signalent pas toujours clairement. Choisir un mode d'installation dès le départ et s'y tenir.

## La suite : enrichir le pipeline avec des sujets automatiques

Le pipeline tourne. L'étape suivante est d'automatiser aussi la recherche de sujets. Un script Python qui scrape Hacker News et Reddit chaque matin, filtre les sujets pertinents pour ma niche, et envoie une liste d'idées directement dans Notion. Plus besoin de chercher quoi écrire, juste choisir parmi les propositions du script.

Un article à venir sur la mise en place de ce scraper.

## Pour aller plus loin sur ce sujet

Quelques ressources qui complètent ce que je décris ici :

- 📌 **[Comment j'ai automatisé la promotion de mon SaaS depuis mon VPS](/blog/automatiser-promotion-saas-vps-ia)** — la suite logique de cet article, avec le prompt engineering pour un ton authentique.
- 📌 **Choisir et configurer un VPS pour ses projets side-project** — le guide de départ si tu pars de zéro sur Hetzner.
- 📌 **Utiliser l'API Notion pour centraliser ses workflows makers** — aller plus loin dans l'intégration Notion comme hub de validation.
