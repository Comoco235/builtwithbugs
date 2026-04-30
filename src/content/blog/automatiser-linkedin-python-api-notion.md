---
title: "Automatiser sa Présence LinkedIn avec Python et l'API Notion"
description: "Automatise ta présence LinkedIn avec Python et l'API Notion : le pipeline complet, le code réel et les erreurs à éviter. Guide solopreneur sans bullshit."
pubDate: 2026-04-30
author: "Samwane ABDALLAH"
heroImage: "./assets/automatiser-linkedin-python-api-notion.webp"
slug: "automatiser-linkedin-python-api-notion"
tags: ["LinkedIn", "Python", "Notion", "Automatisation", "API"]
faq:
  - question: "L'API LinkedIn est-elle gratuite ?"
    answer: "Oui, l'accès à l'API LinkedIn pour la publication de posts via w_member_social est gratuit pour un usage personnel. Tu n'as pas besoin d'un compte LinkedIn Premium pour publier des posts sur ton propre profil."
  - question: "Peut-on automatiser les posts LinkedIn sans l'API officielle ?"
    answer: "Techniquement oui, via du scraping, mais c'est le meilleur moyen de se faire bannir. L'API officielle est la seule approche viable à long terme pour la sécurité de ton compte."
  - question: "Peut-on publier des posts avec images ou carrousels avec ce pipeline ?"
    answer: "Le code présenté ici gère uniquement les posts texte. Pour les images, il faut passer par l'endpoint /v2/assets pour uploader le fichier avant de référencer l'ID dans le post."
  - question: "Comment sécuriser mes tokens et credentials sur le VPS ?"
    answer: "Utilise un fichier .env avec des permissions restreintes (chmod 600 .env) pour que seul ton utilisateur puisse le lire. Ne commite jamais ces clés sur GitHub."
  - question: "Ce pipeline fonctionne-t-il pour une page entreprise LinkedIn ?"
    answer: "Oui, il suffit de remplacer l'URN person par l'URN organization dans le payload et d'avoir les droits admin sur la page."
  - question: "Combien de posts peut-on publier par jour avec l'API ?"
    answer: "LinkedIn est généreux pour un usage perso (1 à 3 posts/jour). Au-delà, tu risques des erreurs 429 (Too Many Requests). Espace tes publications pour rester sous les radars."
---

**TL;DR :** Un script Python de 150 lignes, l'API Notion et un VPS. C'est tout ce qu'il te faut pour ne plus jamais oublier de publier sur LinkedIn. Coût : 0€ (hors VPS), gain de temps : 3h/semaine.

Je vais te dire ce qui m'a vraiment déclenché ce projet. Un dimanche soir. J'ai une idée de post LinkedIn. Je l'écris dans un coin de Notion, je me dis "je le posterai demain matin". Le lendemain matin, j'ai oublié. Trois jours plus tard, je retrouve la note. Le moment est passé.

Ça s'est répété une dizaine de fois avant que je me pose la vraie question : est-ce que le problème c'est ma discipline, ou c'est mon process ? Spoiler : c'était le process.

## 1. La Logique du Pipeline

L'idée est simple : utiliser Notion comme hub de rédaction et Python comme bras armé pour la publication.

```text
[Notion DB] → [Script Python] → [LinkedIn API] → [Post publié]
      ↑                ↓
  [Tu rédiges]   [Cron job sur VPS]
```

1. Tu rédiges tes posts dans Notion avec une date et un statut "Prêt".
2. Un script Python interroge la base toutes les heures.
3. Si un post est mûr, il est envoyé sur LinkedIn.
4. Le statut passe à "Publié" dans Notion.

## 2. Prérequis et Setup

Il te faut :

- Un compte LinkedIn Developer.
- Un token d'intégration Notion.
- Un VPS (type Hetzner) pour faire tourner le script 24/7.

```bash
pip install notion-client requests python-dotenv
```

## 3. Le Script Python : Lire Notion

Voici le cœur du système pour extraire tes brouillons :

```python
def get_posts_to_publish():
    now = datetime.now(timezone.utc).isoformat()
    response = notion.databases.query(
        database_id=DATABASE_ID,
        filter={
            "and": [
                {"property": "Statut", "select": {"equals": "Prêt"}},
                {"property": "Date de publication", "date": {"on_or_before": now}}
            ]
        }
    )
    # ... extraction du contenu ...
    return posts
```

## 4. Poster sur LinkedIn via l'API

L'API LinkedIn utilise des URN (Uniform Resource Names). Voici comment envoyer ton texte :

```python
def publish_post(content: str):
    payload = {
        "author": f"urn:li:person:{PERSON_ID}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": content},
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
    }
    # ... envoi du POST ...
```

## 5. Déployer sur un VPS

Une fois ton script prêt, transfère-le sur ton VPS et configure un `crontab` :

```bash
crontab -e
# Lancer le script toutes les heures
0 * * * * cd /home/user/linkedin-automation && /usr/bin/python3 main.py >> logs/cron.log 2>&1
```

> Si tu débutes avec les serveurs, j'ai documenté [comment configurer un VPS Hetzner](/blog/comment-jai-configure-mon-vps) de A à Z.

## 6. Pourquoi Notion plutôt qu'un outil tiers ?

Le vrai bénéfice n'est pas l'automatisation en elle-même. C'est la discipline que le système crée :

- **Centralisation** : Tes idées, brouillons et posts publiés sont au même endroit.
- **Zéro friction** : Pas de dashboard complexe à apprendre. Tu écris, tu valides, le code fait le reste.
- **Propriété** : Tu possèdes ton pipeline. Pas d'abonnement SaaS à 50€/mois.

## Conclusion

Ce pipeline m'a probablement économisé 3 heures par semaine. Le setup prend une après-midi, mais la tranquillité d'esprit est immédiate.

Lance. Teste. Automatise.

*Cet article fait partie de ma série sur l'automatisation. Si tu veux voir comment j'utilise ces méthodes pour promouvoir mon SaaS, lis [comment j'automatise Copyboost avec un VPS](/blog/automatiser-promotion-saas-vps-ia).*
