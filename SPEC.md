# Spécification — Mes tâches

## Présentation

Application web d'une seule page, en français, utilisable directement dans un navigateur. Elle permet de gérer une liste de tâches sur cet appareil, sans compte ni serveur.

## Cas d'utilisation

### Consulter la liste

- À l'ouverture, les tâches enregistrées sont chargées et affichées dans leur ordre d'ajout.
- Chaque tâche présente son texte, sa catégorie, son état, sa date d'échéance modifiable et un bouton de suppression.
- Le compteur indique le nombre de tâches **non terminées dans la liste affichée**.
- Si la liste est vide, un message invite à ajouter une tâche. Si seul le filtre est vide, un autre message invite à changer de catégorie ou à ajouter une tâche.

### Ajouter une tâche

- Saisir un texte de 200 caractères au maximum, choisir une catégorie et, éventuellement, une date d'échéance, puis cliquer sur « Ajouter ».
- Les espaces au début et à la fin sont retirés. Un texte vide ou composé uniquement d'espaces est refusé avec un message de validation.
- Les catégories proposées sont Travail, Perso et Urgent ; Travail est sélectionnée par défaut. Chacune possède une couleur et un libellé.
- Une nouvelle tâche est non terminée. La date est facultative.
- Après l'ajout, le formulaire est réinitialisé et le curseur revient dans le champ de texte.
- Si le filtre actif masque la catégorie de la nouvelle tâche, il revient sur « Toutes » pour la rendre visible.

### Terminer ou rouvrir une tâche

- Cocher la case d'une tâche la marque comme terminée ; son texte est barré et elle ne compte plus parmi les tâches restantes.
- Décocher la case la remet à faire. Le changement est sauvegardé.

### Supprimer une tâche

- Cliquer sur la croix d'une tâche la supprime immédiatement, sans confirmation.
- La suppression est sauvegardée et ne touche pas les autres tâches, même lorsqu'un filtre ou un tri est actif.

### Gérer une échéance

- Une date peut être choisie à la création, puis ajoutée, modifiée ou effacée directement sur la tâche.
- Les dates acceptées vont du 1er janvier 0001 au 31 décembre 9999.
- Une tâche non terminée dont la date est antérieure à la date locale du jour est affichée en rouge avec la mention « En retard ».
- Une tâche prévue aujourd'hui n'est pas en retard. Une tâche terminée ou sans date n'est jamais indiquée en retard.
- L'affichage du retard est actualisé au passage à minuit, selon l'horloge locale de l'appareil.

### Filtrer et trier

- Le filtre affiche toutes les catégories ou uniquement Travail, Perso, Urgent ou Sans catégorie.
- Le tri propose l'ordre d'ajout ou l'échéance la plus proche en premier. Les tâches sans date sont placées après celles qui ont une date ; les tâches de même date conservent leur ordre d'ajout.
- Le filtre et le tri peuvent être utilisés ensemble. Ils ne modifient pas les tâches et reviennent aux valeurs par défaut au rechargement de la page.

### Changer l'apparence

- Sans choix enregistré, l'application suit le mode clair ou sombre de l'appareil, y compris si celui-ci change pendant son utilisation.
- Le bouton « Mode sombre » permet de passer du mode clair au mode sombre et inversement. Le choix manuel est conservé dans le navigateur et prime sur le réglage de l'appareil.
- Si la préférence d'apparence ne peut pas être lue ou enregistrée, un avertissement est affiché. Une préférence non enregistrée ne sera pas conservée après actualisation.

### Retrouver ses tâches

- Les ajouts, suppressions, états et échéances sont enregistrés automatiquement dans le stockage local du navigateur (`localStorage`).
- Les données restent associées au navigateur et à l'origine de la page ; elles ne sont pas synchronisées entre appareils ou navigateurs. La conservation dépend des réglages du navigateur, notamment en navigation privée ou après effacement des données.
- Les anciennes tâches dépourvues de catégorie ou de date restent utilisables : elles apparaissent respectivement comme « Sans catégorie » et sans échéance. Une échéance peut ensuite leur être ajoutée.
- Le texte d'une tâche est affiché comme du texte, pas interprété comme du code HTML.

### Erreurs de stockage

- Si les données enregistrées sont illisibles, invalides ou inaccessibles au chargement, un avertissement est affiché et la sauvegarde est désactivée pour éviter de les écraser. Les modifications restent uniquement en mémoire pour cette ouverture.
- Si une écriture échoue, un avertissement indique que les modifications risquent d'être perdues à l'actualisation ou à la fermeture. Une écriture ultérieure réussie sauvegarde l'état courant et fait disparaître cet avertissement.

## Limites fonctionnelles

- Il n'y a pas de modification du texte ou de la catégorie d'une tâche existante, de recherche, de synchronisation ni de restauration après suppression.
- Il n'y a pas de notification en dehors de la page ouverte.

## Tests automatiques

Ouvrir [tests.html](./tests.html) dans le navigateur : les tests démarrent automatiquement. Le bouton « Relancer les tests » permet de les exécuter à nouveau. Le résultat indique le nombre de succès et détaille les éventuels échecs.

Les tests utilisent une copie de la page et un stockage simulé isolé : ils ne modifient pas les tâches enregistrées. Ils couvrent les principaux parcours, les échéances et le passage à minuit, la compatibilité avec les anciennes données et les erreurs de stockage. Les erreurs volontairement provoquées dans ces derniers tests peuvent apparaître dans la console du navigateur.
