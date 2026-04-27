---
title: "Erreur EADDRINUSE sur Node.js : pourquoi ça arrive et comment la corriger en trois commandes"
description: "EADDRINUSE signifie qu'un port est déjà occupé. Découvre comment identifier le process coupable, le tuer et éviter la récidive sur un VPS Ubuntu."
pubDate: 2026-04-27
author: "Samwane ABDALLAH"
slug: "erreur-eaddrinuse-nodejs-port-deja-utilise"
heroImage: "../../assets/erreur-eaddrinuse-nodejs.webp"
heroImageAlt: "Terminal affichant l'erreur EADDRINUSE listen address already in use sur un serveur Node.js"
tags: ["Node.js", "VPS", "Ubuntu", "Debug", "systemd"]
categories: ["Stack Technique"]
readingTime: "5 min"
faq:
  - question: "Comment savoir quel process utilise un port sur Linux ?"
    answer: "La commande sudo lsof -i :NUMERO_DU_PORT est la plus lisible. Elle retourne le nom du process, son PID, l'utilisateur sous lequel il tourne et le type de connexion. Si lsof n'est pas disponible, sudo ss -tlnp | grep NUMERO_DU_PORT donne les mêmes informations."
  - question: "Peut-on changer le port d'un service Node.js pour éviter le conflit ?"
    answer: "Oui, si tu contrôles la configuration. La plupart des outils Node.js exposent le port via config ou variable d'environnement. C'est une solution rapide, mais il vaut mieux identifier et supprimer l'installation en double pour régler la cause racine."
  - question: "L'erreur EADDRINUSE apparaît au démarrage du VPS : que faire ?"
    answer: "Le process est probablement lancé par systemd. Liste les services avec sudo systemctl list-units --type=service. Vérifie ensuite les fichiers avec sudo systemctl cat nom-du-service pour t'assurer qu'ils pointent vers le bon chemin."
  - question: "La commande kill -9 est-elle dangereuse ?"
    answer: "Elle coupe le process brutalement sans lui laisser le temps de se fermer proprement. Pour un serveur Node.js en dev ou sur VPS perso, c'est acceptable. En production, préfère kill sans option et attends quelques secondes avant de forcer."
  - question: "Comment vérifier que le port est bien libéré après avoir tué le process ?"
    answer: "Relance sudo lsof -i :NUMERO_DU_PORT immédiatement. Si la commande ne retourne aucun résultat, le port est libre. Si elle retourne encore un process, attends une seconde ou vérifie si un autre process occupe aussi ce port."
---

**TL;DR :** EADDRINUSE signifie qu'un autre process utilise déjà le port que ton service essaie d'occuper. Pour le corriger : `lsof -i :PORT` pour identifier le process coupable, `kill -9 PID` pour le tuer, et une vérification de ton fichier de service systemd pour éviter que ça se reproduise au prochain démarrage. Si tu as deux installations du même outil (une en root, une en utilisateur normal), c'est probablement là que vient le conflit.

Tu lances ton service, tu regardes les logs, et tu tombes sur ça :

```text
Error: listen EADDRINUSE: address already in use :::18789
    at Server.setupListenHandle [as _listen2] (node:net:1432:16)
    at listenInCluster (node:net:1480:12)
```

Le service plante. Tu le relances. Il plante à nouveau. Tu cherches sur Google, tu trouves des fils Stack Overflow en anglais qui te disent de "kill the process" sans expliquer lequel ni pourquoi ça arrive.

Ce guide répond aux deux questions : ce que signifie EADDRINUSE concrètement, et comment le corriger de manière définitive sur un VPS Ubuntu.

## Ce que signifie EADDRINUSE concrètement

EADDRINUSE est un code d'erreur système Linux. Il signifie littéralement "address already in use" : l'adresse réseau (ici, la combinaison IP + port) que ton process essaie d'occuper est déjà prise par un autre process.

Quand Node.js démarre un serveur sur un port donné, le système d'exploitation lui attribue l'exclusivité de ce port. Aucun autre process ne peut écouter sur le même port en même temps. Si tu essaies de démarrer un deuxième process sur ce même port, le système refuse et renvoie EADDRINUSE.

Ce n'est pas un bug Node.js. C'est le comportement normal du noyau Linux. Node.js se contente de propager l'erreur.

## Les deux causes principales sur un VPS Ubuntu

### Deux instances du même service en cours d'exécution

La cause la plus fréquente : le service tourne déjà quelque part, et tu essaies d'en lancer une deuxième instance sur le même port.

Ça arrive plus souvent qu'on ne le pense sur un VPS. Tu as peut-être lancé le service à la main en SSH, oublié de le couper, et systemd essaie de le relancer automatiquement. Ou tu as deux fichiers de service systemd qui pointent vers le même outil.

Dans mon cas, décrit dans l'article sur la configuration de mon VPS pour automatiser la création de contenu, j'avais installé OpenClaw deux fois : une fois en root lors d'un premier essai, une fois depuis mon utilisateur normal. Deux installations, deux fichiers de configuration différents, deux services qui tentaient d'écouter sur le port 18789 au démarrage.

### Un service systemd qui pointe vers un chemin obsolète

Deuxième cause classique : tu as réinstallé ou déplacé un outil, mais le fichier de service systemd pointe encore vers l'ancienne installation. systemd démarre le vieux binaire, qui occupe le port. Quand le nouveau service essaie de démarrer à son tour, le port est déjà pris.

C'est plus difficile à diagnostiquer parce que les deux processus semblent identiques dans les logs.

## Identifier quel process occupe le port

Avant de tuer quoi que ce soit, il faut savoir ce qu'on tue.

### Avec lsof

`lsof` (list open files) est l'outil le plus lisible pour ce diagnostic. Il liste les fichiers et ports ouverts par chaque process.

```bash
sudo lsof -i :18789
```

Remplace 18789 par ton numéro de port. La sortie ressemble à ça :

```text
COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node     3847     root   23u  IPv6  42891      0t0  TCP *:18789 (LISTEN)
node     4102   samwane   23u  IPv6  43012      0t0  TCP *:18789 (LISTEN)
```

Ici, deux process Node.js écoutent sur le même port : un en root (PID 3847) et un sous l'utilisateur samwane (PID 4102). C'est exactement le cas de double installation décrit plus haut.

La colonne **PID** donne l'identifiant du process à éliminer. La colonne **USER** dit sous quel utilisateur il tourne, ce qui aide à comprendre d'où il vient.

### Avec ss ou netstat

Si `lsof` n'est pas installé sur ta machine, `ss` est disponible par défaut sur Ubuntu :

```bash
sudo ss -tlnp | grep 18789
```

La sortie est moins lisible mais contient les mêmes informations :

```text
LISTEN  0  511  *:18789  *:*  users:(("node",pid=3847,fd=23))
```

`netstat` fonctionne de la même façon mais est progressivement abandonné au profit de `ss` :

```bash
sudo netstat -tlnp | grep 18789
```

## Tuer le process et libérer le port

Une fois le PID identifié, deux options selon l'urgence.

**Arrêt propre (à préférer) :**

```bash
sudo kill PID
```

Le signal SIGTERM par défaut laisse au process le temps de se fermer proprement, de vider ses buffers et de libérer ses ressources. C'est ce qu'il faut utiliser en premier.

**Arrêt forcé si le process ne répond pas :**

```bash
sudo kill -9 PID
```

Le signal SIGKILL coupe le process immédiatement sans lui laisser le temps de faire quoi que ce soit. À utiliser uniquement si `kill` sans option ne répond pas après quelques secondes.

Pour tuer les deux process de l'exemple précédent :

```bash
sudo kill -9 3847
sudo kill -9 4102
```

Vérifie ensuite que le port est libre :

```bash
sudo lsof -i :18789
```

Si la commande ne renvoie rien, le port est libéré.

## Corriger le fichier de service systemd pour éviter la récidive

Tuer le process résout le problème immédiatement. Mais si la cause racine n'est pas traitée, l'erreur reviendra au prochain démarrage du VPS.

Le fichier de service systemd se trouve généralement dans `/etc/systemd/system/`. Pour lister les services actifs liés à ton outil :

```bash
sudo systemctl list-units --type=service | grep nom-du-service
```

Pour voir le contenu du fichier de service et vérifier vers quel chemin pointe `ExecStart` :

```bash
sudo systemctl cat nom-du-service
```

La sortie ressemble à ça :

```ini
[Unit]
Description=Mon service Node.js
After=network.target

[Service]
User=root
WorkingDirectory=/root/.openclaw
ExecStart=/root/.nvm/versions/node/v20.0.0/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Si `User=root` alors que tu as réinstallé l'outil depuis ton utilisateur normal, c'est là que vient le conflit. Le service systemd démarre le vieux binaire en root pendant que ton installation utilisateur tente de démarrer de son côté.

**Correction :** édite le fichier de service pour pointer vers le bon chemin et le bon utilisateur.

```bash
sudo nano /etc/systemd/system/nom-du-service.service
```

Après modification, recharge la configuration systemd et redémarre le service :

```bash
sudo systemctl daemon-reload
sudo systemctl restart nom-du-service
sudo systemctl status nom-du-service
```

## Mon cas concret : double installation OpenClaw root/utilisateur

Voici la séquence exacte de ce qui s'est passé dans mon cas, documentée dans l'article sur la configuration de mon VPS.

1. **Première installation en root** lors d'un premier test rapide :

   ```bash
   sudo npm install -g openclaw
   ```

2. **Quelques jours plus tard, réinstallation "propre"** depuis mon utilisateur normal sans avoir supprimé la première :

   ```bash
   npm install -g openclaw
   ```

Deux binaires, deux dossiers de configuration, deux services systemd dont l'un pointait encore vers `/root/.openclaw`. Au démarrage du VPS, les deux tentaient d'écouter sur le port 18789.

La correction complète passait par un nettoyage des deux installations avant de repartir proprement :

```bash
sudo npm uninstall -g openclaw
rm -rf ~/.openclaw
sudo rm -rf /root/.openclaw
```

Puis réinstallation unique depuis l'utilisateur normal, et correction du fichier de service systemd pour pointer vers le bon chemin. Plus d'EADDRINUSE depuis.

**La leçon retenue :** sur un VPS, toujours vérifier qu'une installation précédente n'existe pas avant d'en créer une nouvelle, notamment en distinguant les installations root des installations utilisateur. La commande `which nom-outil` et `sudo which nom-outil` permettent de vérifier les deux en dix secondes.

## Pour aller plus loin

Ces deux articles du blog traitent directement du contexte dans lequel j'ai rencontré cette erreur et de la stack autour :

* 📌 **[Comment j'ai configuré mon VPS pour automatiser ma création de contenu](/blog/comment-jai-configure-mon-vps)** — le récit complet du debug, dont cette erreur EADDRINUSE et le conflit de double installation.
* 📌 **[Comment j'ai automatisé la promotion de mon SaaS depuis mon VPS](/blog/automatiser-promotion-saas-vps-ia)** — la stack Python/Gemini/Notion qui tourne sur ce même VPS une fois les conflits résolus.
