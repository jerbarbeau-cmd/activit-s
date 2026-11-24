# Mes tâches

Une application de suivi de tâches en français, utilisable sur ordinateur et sur mobile. Elle fonctionne entièrement dans le navigateur : aucune installation ni compilation n'est nécessaire.

## Utilisation

Ouvrez `index.html` dans un navigateur récent. Vous pouvez ajouter, terminer, supprimer, catégoriser et filtrer des tâches, gérer leurs échéances et changer l'apparence. Les détails sont dans [SPEC.md](./SPEC.md).

Les tâches et la préférence d'apparence sont enregistrées dans le navigateur, pas dans GitHub. Elles ne sont pas synchronisées entre appareils.

## Tests

Ouvrez `tests.html` dans le navigateur. Les tests se lancent automatiquement ; le bouton permet de les relancer. Leur stockage simulé ne modifie pas vos tâches.

## Publier sur GitHub Pages

1. Sur GitHub, créez un dépôt, par exemple `mes-taches`. Un dépôt public est utilisable avec GitHub Pages sur GitHub Free ; la disponibilité pour les dépôts privés dépend de l'offre.
2. À la racine du dépôt, ajoutez tous les fichiers de ce dossier : `index.html`, `style.css`, `script.js`, `tests.html`, `tests.js`, `SPEC.md` et `README.md`. Depuis le site GitHub, utilisez **Add file → Upload files**, puis validez avec **Commit changes** sur la branche `main`.
3. Dans le dépôt, ouvrez **Settings → Pages**. Sous **Build and deployment**, choisissez **Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`. Enregistrez avec **Save**.
4. Attendez la publication et ouvrez l'adresse indiquée dans **Settings → Pages**. Pour un dépôt ordinaire, elle ressemble à `https://UTILISATEUR.github.io/mes-taches/`. Pour un dépôt nommé `UTILISATEUR.github.io`, l'adresse est `https://UTILISATEUR.github.io/`.
5. Vérifiez le site publié et, si souhaité, ouvrez `tests.html` à la suite de son adresse pour relancer les tests.

Les chemins des fichiers sont relatifs : le site fonctionne aussi dans le sous-chemin d'un dépôt. Les tâches créées en ouvrant le fichier localement ne sont pas automatiquement transférées sur le site publié : le stockage dépend de l'origine de la page. Les sites de dépôts hébergés sur un même domaine `UTILISATEUR.github.io` partagent cette origine ; évitez d'y publier une autre application utilisant les mêmes clés de stockage.

**Attention :** GitHub Pages rend les fichiers publiés accessibles aux visiteurs. N'ajoutez pas de mots de passe, de données personnelles ou d'autres informations confidentielles au dépôt.
