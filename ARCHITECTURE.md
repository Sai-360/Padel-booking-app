# Dossier d’architecture

## Projet : Padel Booking App

## 1. Introduction

Ce projet est une application de gestion de réservations de terrains de padel.

L’objectif est de permettre à des membres de consulter les matchs publics, de créer des réservations, de rejoindre un match, de payer leur participation, d’ajouter des joueurs dans un match privé et de consulter leurs propres réservations.

Le projet respecte une séparation claire entre le frontend et le backend :

* le frontend est développé avec Angular ;
* le backend est développé avec Java et Spring Boot ;
* la communication entre les deux parties se fait via une API HTTP REST ;
* la base de données est relationnelle et gérée avec JPA/Hibernate ;
* une base H2 en mémoire est utilisée pour faciliter le démarrage et les tests du projet.

Le cahier des charges prévoit également une interface utilisateur et une interface administrateur. L’application contient donc une partie utilisateur classique et une partie admin sécurisée par JWT.

---

## 2. Vue générale de l’architecture

L’application est organisée en deux grandes parties :

```text
Padel-booking-app
├── frontend/app     → application Angular
└── backend          → API REST Spring Boot
```

Le frontend ne contient pas directement la logique de persistance. Il affiche les données, gère les formulaires et appelle le backend via `HttpClient`.

Le backend expose les ressources principales sous forme d’API REST :

```text
/members
/sites
/courts
/reservations
/auth/admin/login
/admin
```

L’architecture suit le principe vu au cours : chaque couche a une responsabilité précise.

```text
Frontend Angular
    ↓ HTTP
Controller REST
    ↓
Service métier
    ↓
Repository JPA
    ↓
Base de données H2
```

Cette séparation permet de garder un code plus lisible, plus testable et plus facile à faire évoluer.

---

## 3. Architecture frontend

### 3.1 Structure générale

Le frontend est développé avec Angular. Il utilise une architecture basée sur des composants, des services et du routing.

Les principales parties sont :

```text
src/app
├── model
├── views
├── shared
└── app.routes.ts
```

Le frontend réel se trouve dans le dossier :

```text
frontend/app
```

Les composants Angular servent à afficher les différentes pages et parties de l’interface.

Les services Angular servent à centraliser les appels HTTP, l’état utilisateur et certaines règles d’affichage.

### 3.2 Routing Angular

L’application est une SPA. Le routing permet de naviguer entre les vues sans recharger toute l’application.

Exemples de routes :

```text
/login
/home
/public-matches
/book-court
/my-reservations
/admin
```

La route `/login` permet de se connecter soit comme membre normal avec un matricule, soit comme administrateur avec un matricule et un mot de passe.

La route `/admin` correspond à l’interface administrateur. Elle est liée au login admin sécurisé par JWT.

La route `/my-reservations` permet à un utilisateur de voir les réservations qu’il a créées ou rejointes. Elle permet aussi à l’organisateur d’un match privé d’ajouter les joueurs invités.

### 3.3 Composants Angular

Les composants sont utilisés pour éviter la duplication de code et pour structurer l’affichage.

Exemples :

```text
Home
ReservationCard
ReservationList
ReservationCreation
MyReservations
PublicMatches
Login
Admin
Header
Menu
Footer
```

Le composant `ReservationCard` est réutilisé pour afficher une réservation dans plusieurs pages. Cela évite de recopier le même HTML et la même logique d’affichage.

Le layout est également découpé :

```text
Header
Menu
Content
Footer
```

Cela permet d’avoir une structure commune à toute l’application.

La page `Home` a été enrichie pour présenter l’application, les règles principales, les jours de fermeture et les accès rapides vers la création de réservation et les matchs publics.

### 3.4 Services Angular

Les services Angular sont utilisés pour gérer les données et les appels HTTP.

Exemples :

```text
ReservationsService
MemberApiService
UserService
AdminAuthService
```

`ReservationsService` centralise les appels vers l’API des réservations :

```text
GET /reservations
GET /reservations/public
GET /reservations/member/{memberId}
POST /reservations
POST /reservations/{id}/join
POST /reservations/{id}/pay
POST /reservations/{id}/private-players
```

L’endpoint :

```text
POST /reservations/{id}/private-players
```

permet à l’organisateur d’un match privé d’ajouter manuellement les joueurs invités. Côté frontend, cette fonctionnalité est utilisée depuis la page `MyReservations`. L’organisateur peut ajouter les joueurs un par un grâce à leur matricule.

`MemberApiService` centralise les appels liés aux membres. Il permet notamment de récupérer un membre via son matricule et de payer un solde dû.

Exemples :

```text
GET /members/{matricule}
POST /members/{id}/pay-balance
```

`UserService` gère l’utilisateur courant côté frontend. Par défaut, l’application démarre avec un membre libre afin de faciliter la démonstration.

`AdminAuthService` gère la connexion admin, le stockage du token JWT et l’état de connexion admin.

### 3.5 Formulaires

Les formulaires Angular sont utilisés pour créer une réservation, se connecter et ajouter des joueurs dans un match privé.

Les validations principales sont présentes :

* le matricule est obligatoire ;
* les champs site, terrain, date, heure et type de match sont obligatoires pour créer une réservation ;
* le mot de passe est requis uniquement pour une connexion administrateur ;
* l’ajout manuel d’un joueur privé se fait par matricule ;
* un message d’erreur est affiché si le backend refuse l’action.

### 3.6 Angular Material

Angular Material est utilisé pour les composants d’interface :

```text
mat-card
mat-toolbar
mat-form-field
mat-select
mat-button
mat-sidenav
mat-icon
```

Cette bibliothèque permet de construire rapidement une interface cohérente et ergonomique tout en conservant une apparence professionnelle.

### 3.7 Gestion de l’état utilisateur

Le frontend conserve l’utilisateur courant afin de savoir :

* qui est connecté ;
* s’il s’agit d’un admin ;
* si le membre possède un solde dû ;
* si le bouton Login, Logout, Admin ou Pay Balance doit être affiché.

Le header affiche le nom de l’utilisateur connecté. Si le membre possède un solde dû, celui-ci peut être affiché dans le header et payé via le bouton `Pay balance`.

Lors d’un rafraîchissement navigateur, le frontend recharge le membre courant depuis le backend afin de récupérer les données à jour, notamment le solde dû.

---

## 4. Architecture backend

### 4.1 Structure générale

Le backend est développé avec Spring Boot et Java.

Il respecte une architecture en couches :

```text
controller
service
repository
entity / model
DTO
mapper
config
exception
```

Exemple pour les réservations :

```text
reservation
├── Reservation.java
├── ReservationDTO.java
├── ReservationController.java
├── ReservationService.java
├── ReservationRepository.java
├── ReservationMapper.java
├── Participation.java
├── ParticipationDTO.java
├── ParticipationRepository.java
└── ParticipationMapper.java
```

Cette structure permet de séparer :

* les endpoints HTTP ;
* la logique métier ;
* l’accès aux données ;
* la transformation entre entités et DTO ;
* la gestion des erreurs.

### 4.2 Controllers

Les controllers exposent les endpoints REST.

Ils reçoivent les requêtes HTTP et délèguent le traitement aux services.

Exemples :

```text
ReservationController
MemberController
MemberBalanceController
SiteController
CourtController
AuthController
AdminController
```

Le controller ne contient pas la logique métier principale. Il sert surtout de point d’entrée HTTP.

`ReservationController` expose notamment les endpoints suivants :

```text
GET /reservations
GET /reservations/{id}
GET /reservations/public
GET /reservations/organizer/{organizerId}
GET /reservations/member/{memberId}
POST /reservations
POST /reservations/{id}/join
POST /reservations/{id}/pay
POST /reservations/{id}/private-players
POST /reservations/{id}/apply-penalty
```

L’endpoint :

```text
POST /reservations/{id}/private-players
```

permet de respecter la règle métier selon laquelle l’organisateur d’un match privé ajoute lui-même les autres joueurs.

`MemberBalanceController` expose l’endpoint :

```text
POST /members/{id}/pay-balance
```

Cet endpoint remet le solde dû du membre à zéro après paiement.

### 4.3 Services

Les services contiennent la logique métier.

Le service principal est `ReservationService`.

Il contient les règles liées aux réservations :

* création d’une réservation ;
* contrôle des délais selon le type de membre ;
* contrôle des jours de fermeture globaux et par site ;
* inscription à un match public ;
* paiement d’une participation ;
* ajout manuel des joueurs invités dans un match privé ;
* blocage d’un membre qui possède un solde dû ;
* transformation automatique d’un match privé incomplet en match public ;
* calcul automatique du solde dû pour l’organisateur d’un match public incomplet ;
* calcul de l’état de participation de l’utilisateur courant.

Exemples de règles métier :

```text
GLOBAL : réservation jusqu’à 21 jours avant le match
SITE : réservation jusqu’à 14 jours avant le match et seulement sur son site
FREE : réservation jusqu’à 5 jours avant le match
Jours fermés : réservation interdite sur les dates de fermeture globales ou liées à un site
PRIVATE : l’organisateur ajoute lui-même les joueurs invités
PRIVATE incomplet la veille : transformation en PUBLIC et sanction de l’organisateur
PUBLIC incomplet la veille : le solde manquant est ajouté à l’organisateur
Solde dû > 0 : le membre ne peut plus créer de réservation tant que le solde n’est pas payé
```

Pour les matchs privés, l’organisateur peut ajouter les joueurs un par un via leur matricule. Le backend vérifie :

* que la réservation existe ;
* que la réservation est bien privée ;
* que l’utilisateur est bien l’organisateur ;
* que le joueur existe ;
* que le même joueur n’est pas ajouté deux fois ;
* que l’organisateur n’est pas ajouté comme joueur invité ;
* que le nombre total de joueurs ne dépasse pas quatre.

Pour les matchs publics, le backend applique automatiquement la règle du solde dû. Si un match public prévu le lendemain n’est pas complet ou pas complètement payé, le montant restant est ajouté au solde de l’organisateur. Tant que ce solde est supérieur à zéro, l’organisateur ne peut plus créer de nouvelle réservation.

### 4.4 Repositories

Les repositories utilisent Spring Data JPA.

Exemples :

```text
ReservationRepository
MemberRepository
SiteRepository
CourtRepository
ParticipationRepository
```

Ils permettent d’accéder à la base de données sans écrire manuellement tout le SQL.

Exemples de méthodes :

```java
findByType(ReservationType type)
findByOrganizerId(UUID organizerId)
findByTypeAndReservationDate(ReservationType type, LocalDate reservationDate)
findByMatricule(String matricule)
findByReservationId(UUID reservationId)
existsByReservationIdAndMemberId(UUID reservationId, UUID memberId)
```

### 4.5 DTO et mappers

Les DTO sont utilisés pour exposer uniquement les données nécessaires à l’API.

Exemples :

```text
ReservationDTO
ParticipationDTO
MemberDTO
AdminMemberDTO
```

Les mappers transforment les entités JPA en DTO, et inversement.

Cela évite d’exposer directement les entités de la base de données au frontend.

Les DTO permettent aussi d’ajouter des champs utiles pour le frontend, par exemple :

```text
currentUserJoined
currentUserPaid
participantsCount
```

---

## 5. Base de données

La base de données est une base relationnelle H2 en mémoire.

Elle est configurée dans :

```text
application.properties
```

Exemple :

```properties
spring.datasource.url=jdbc:h2:mem:padeldb
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=create-drop
```

Le choix de H2 permet de démarrer rapidement le projet sans installation manuelle d’une base externe.

Les données de test sont créées automatiquement au démarrage via `DataSeeder`.

### 5.1 Entités principales

Les entités principales sont :

```text
Member
Site
Court
Reservation
Participation
```

### 5.2 Relations métier

Un site possède plusieurs terrains.

Une réservation concerne :

* un site ;
* un terrain ;
* un organisateur ;
* une date ;
* une heure ;
* un type public ou privé ;
* un statut ;
* un prix.

Une participation relie un membre à une réservation.

### 5.3 Champs utilisés pour les règles métier

La base contient également les informations nécessaires aux règles métier :

```text
Member.unpaidBalance
Member.blockedUntil
Reservation.balanceApplied
Participation.status
Participation.paid
```

`Member.unpaidBalance` permet de stocker le solde dû d’un membre.

`Member.blockedUntil` permet de bloquer temporairement un membre sanctionné.

`Reservation.balanceApplied` permet d’éviter d’appliquer plusieurs fois le calcul automatique du solde dû pour une même réservation.

`Participation.paid` permet de savoir quels joueurs ont payé leur participation.

Les jours de fermeture sont validés au niveau du service métier. Dans cette version du projet, ils sont définis directement dans `ReservationService` pour démontrer la règle. Dans une version plus complète, ils pourraient être stockés dans une entité dédiée, par exemple `ClosedDay`, liée à un site ou globale.

---

## 6. Sécurité

### 6.1 Connexion membre

Les membres classiques se connectent avec leur matricule.

Exemples :

```text
L0001
G0002
S0001
```

Les préfixes représentent le type de membre :

```text
G = Global member
S = Site member
L = Free member
```

Les membres classiques n’utilisent pas de mot de passe dans cette version, car le cahier des charges prévoit une identification par matricule.

### 6.2 Connexion administrateur

Les administrateurs se connectent avec :

```text
matricule + mot de passe
```

Exemples :

```text
G0001 / admin123
S0001 / site123
```

Le backend génère un token JWT après une connexion admin réussie.

### 6.3 Spring Security

Spring Security est utilisé pour protéger l’interface administrateur.

La configuration autorise les routes publiques nécessaires au fonctionnement des utilisateurs, et protège les routes admin.

Exemples de routes publiques :

```text
/members/**
/reservations/**
/sites/**
/courts/**
/auth/admin/login
/swagger-ui/**
/v3/api-docs/**
```

Exemples de routes protégées :

```text
/admin/**
```

### 6.4 JWT

JWT est utilisé pour l’authentification admin.

Le token contient notamment :

```text
memberId
matricule
adminRole
type
expiration
```

Le frontend stocke le token admin et l’envoie ensuite avec le header :

```text
Authorization: Bearer <token>
```

Cela permet au backend d’identifier l’administrateur et son rôle sans utiliser de session serveur.

---

## 7. Gestion des erreurs

Les erreurs métier sont centralisées avec des exceptions personnalisées.

Exemples :

```text
BusinessException
ResourceNotFoundException
```

Cela permet de renvoyer des messages clairs au frontend.

Exemples d’erreurs métier :

```text
Member cannot create a reservation because he has an unpaid balance.
Reservations are not allowed on a closed day for this site.
Only public reservations can be joined.
Only the organizer can add players to this private reservation.
Private reservation already has 4 players.
```

Le frontend affiche ces messages dans les pages concernées.

---

## 8. Règles métier principales

### 8.1 Délais de réservation

Les délais dépendent du type de membre :

```text
GLOBAL : jusqu’à 21 jours avant le match
SITE : jusqu’à 14 jours avant le match et uniquement sur son site
FREE : jusqu’à 5 jours avant le match
```

Ces règles sont vérifiées dans `ReservationService`.

### 8.2 Match public

Un match public peut être rejoint par d’autres membres.

Un membre ne peut pas rejoindre deux fois la même réservation.

Un match public ne peut pas dépasser quatre joueurs.

Chaque joueur peut payer sa participation.

### 8.3 Match privé

Un match privé est créé par un organisateur.

L’organisateur ajoute ensuite les joueurs invités un par un via leur matricule.

Le backend vérifie que :

```text
la réservation est privée
l’utilisateur est l’organisateur
le matricule existe
le joueur n’est pas déjà ajouté
l’organisateur n’est pas ajouté comme invité
le match ne dépasse pas quatre joueurs
```

### 8.4 Sanction des matchs privés incomplets

Un traitement automatique vérifie les matchs privés prévus le lendemain.

Si un match privé est incomplet, il est transformé en match public et l’organisateur est bloqué temporairement.

Cette règle est automatisée avec Spring Scheduling.

### 8.5 Solde dû pour match public incomplet

Un autre traitement automatique vérifie les matchs publics prévus le lendemain.

Si le match public n’est pas complet ou pas entièrement payé, le solde manquant est ajouté à l’organisateur.

Le calcul se base sur le prix fixe du match :

```text
60 € par match
15 € par joueur
```

Exemple :

```text
0 joueur payé → 4 joueurs manquants → 60 € de solde dû
2 joueurs payés → 2 joueurs manquants → 30 € de solde dû
```

Tant que le membre possède un solde dû, il ne peut pas créer de nouvelle réservation.

### 8.6 Paiement du solde dû

Le membre peut payer son solde dû avec l’endpoint :

```text
POST /members/{id}/pay-balance
```

Après paiement, le champ `unpaidBalance` est remis à zéro.

Le frontend met ensuite à jour l’utilisateur courant.

### 8.7 Jours de fermeture

Le backend empêche la création de réservations sur les jours de fermeture.

Il y a deux types de fermeture :

```text
fermeture globale
fermeture liée à un site
```

Exemples :

```text
01/01/2026 : fermeture globale
25/12/2026 : fermeture globale
20/06/2026 : fermeture du site Brussels
15/06/2026 : fermeture du site Namur
```

Dans cette version du projet, ces dates sont définies dans le service métier. Une amélioration possible serait de créer une table `ClosedDay` pour gérer ces dates depuis l’interface admin.

---

## 9. Interface administrateur

L’interface admin permet de consulter les informations importantes du projet.

Elle permet notamment de voir :

```text
réservations
membres
statistiques
membres bloqués
```

Deux types d’administrateurs existent :

```text
GLOBAL_ADMIN
SITE_ADMIN
```

L’administrateur global peut voir l’ensemble des données.

L’administrateur de site est limité aux informations liées à son site.

Cette distinction permet de respecter la séparation entre un administrateur général et un administrateur local.

---

## 10. Swagger / OpenAPI

L’API REST est documentée avec Springdoc OpenAPI.

Swagger est disponible lorsque le backend est lancé :

```text
http://localhost:8080/swagger-ui.html
```

ou :

```text
http://localhost:8080/swagger-ui/index.html
```

La définition OpenAPI est disponible ici :

```text
http://localhost:8080/v3/api-docs
```

Swagger permet de tester rapidement les endpoints backend sans passer par le frontend.

Il est utile pour démontrer :

```text
création de réservation
ajout de joueurs privés
paiement
connexion admin
consultation des membres
consultation des réservations
```

---

## 11. Tests

Le projet contient des tests backend.

Les tests couvrent principalement :

```text
controllers
services
repositories
contexte Spring Boot
```

Exemples :

```text
ReservationServiceTest
ReservationControllerTest
ReservationRepositoryTest
BackendApplicationTests
```

L’objectif est de vérifier les couches principales du backend :

```text
Controller → Service → Repository
```

Les tests permettent aussi de vérifier que l’application démarre correctement.

---

## 12. Librairies, outils et frameworks structurants

### 12.1 Angular

Angular est utilisé pour créer une SPA structurée en composants, services et routes.

Utilisation dans le projet :

```text
routing
composants standalone
services injectables
HttpClient
formulaires
liaison avec le backend REST
```

### 12.2 Angular Material

Angular Material est utilisé pour l’interface :

```text
mat-card
mat-toolbar
mat-button
mat-form-field
mat-select
mat-sidenav
mat-icon
```

Il permet d’avoir une interface cohérente et plus professionnelle.

### 12.3 Spring Boot

Spring Boot structure le backend et simplifie la configuration de l’application.

Modules utilisés :

```text
spring-boot-starter-web
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-test
```

### 12.4 Spring Web / REST

Spring Web permet d’exposer les controllers REST.

Les endpoints sont consommés par Angular via HTTP.

### 12.5 Spring Data JPA

Spring Data JPA est utilisé pour la couche repository.

Il permet de manipuler les entités relationnelles avec des interfaces Java.

### 12.6 H2

H2 est utilisé comme base de données en mémoire.

Cela permet de démarrer le projet facilement sans installation externe.

### 12.7 Lombok

Lombok réduit le code répétitif dans les entités :

```text
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
```

Cela rend les classes plus courtes et plus lisibles.

### 12.8 Spring Security

Spring Security est utilisé pour protéger l’interface administrateur.

La configuration autorise les routes publiques nécessaires au fonctionnement des utilisateurs, et protège les routes `/admin/**`.

### 12.9 JWT

JWT est utilisé pour l’authentification admin.

Le token permet d’identifier l’administrateur et son rôle sans utiliser de session serveur.

### 12.10 Spring Scheduling

Spring Scheduling est utilisé pour appliquer automatiquement des règles métier dans le temps.

Deux traitements automatiques sont présents :

```text
1. Les matchs privés incomplets prévus le lendemain deviennent publics et l’organisateur est sanctionné.
2. Les matchs publics incomplets ou non totalement payés prévus le lendemain génèrent un solde dû pour l’organisateur.
```

Ces traitements permettent d’automatiser les règles du cahier des charges sans intervention manuelle de l’administrateur.

### 12.11 OpenAPI / Swagger

Springdoc OpenAPI est utilisé pour exposer la documentation de l’API REST.

Swagger est disponible lorsque l’application backend est lancée.

### 12.12 Maven

Maven est utilisé pour gérer les dépendances et compiler le backend.

Le projet utilise aussi le Maven Wrapper afin de faciliter le lancement du backend sans installation manuelle de Maven.

### 12.13 Git

Git est utilisé pour versionner le projet.

Le frontend et le backend sont présents dans un seul dépôt afin de faciliter la remise et l’examen.

---

## 13. Choix techniques importants

### 13.1 Pourquoi séparer frontend et backend ?

La séparation frontend/backend permet de respecter une architecture moderne :

```text
Angular = interface utilisateur
Spring Boot = logique métier + API + base de données
```

Cela permet aussi de faire évoluer le frontend sans modifier directement la logique backend.

### 13.2 Pourquoi utiliser des DTO ?

Les DTO évitent d’exposer directement les entités JPA.

Ils permettent aussi d’ajouter des champs utiles pour le frontend, par exemple :

```text
participantsCount
currentUserJoined
currentUserPaid
```

### 13.3 Pourquoi sécuriser seulement l’admin par JWT ?

Le cahier des charges demande une identification par matricule pour les utilisateurs.

Pour respecter ce besoin, les membres classiques utilisent le matricule.

Par contre, l’interface admin donne accès à des informations plus sensibles.

Elle est donc protégée par JWT avec un mot de passe admin.

### 13.4 Pourquoi utiliser H2 ?

H2 permet de démarrer l’application rapidement.

Le seeding est automatique grâce à `DataSeeder`, ce qui permet de tester directement l’application sans script SQL manuel.

### 13.5 Pourquoi centraliser les règles métier dans le backend ?

Les règles importantes doivent être vérifiées côté backend, même si le frontend affiche déjà des informations.

Par exemple :

```text
interdiction de réserver avec un solde dû
contrôle des jours de fermeture
ajout manuel des joueurs privés
contrôle du nombre maximum de joueurs
calcul automatique des dettes
```

Cela évite qu’un utilisateur contourne les règles en appelant directement l’API.

---

## 14. Limites et améliorations possibles

Certaines parties pourraient être améliorées dans une version plus complète :

```text
stocker les jours de fermeture dans une table dédiée
ajouter une interface admin complète pour gérer les sites et jours fermés
gérer des horaires différents par année civile
ajouter plus de tests frontend
ajouter une vraie base externe pour la production
```

Ces limites sont connues, mais le projet montre déjà les mécanismes principaux du cahier des charges.

---

## 15. Conclusion

L’architecture du projet respecte les principes vus au cours :

```text
séparation frontend/backend
API REST
architecture Angular en composants et services
architecture backend en controller/service/repository/entity
base relationnelle avec JPA
DTO et mappers
gestion des erreurs
sécurité avec JWT pour l’admin
tests backend sur les couches principales
documentation OpenAPI avec Swagger
```

Le projet met en œuvre les fonctionnalités principales du cahier des charges :

```text
gestion des réservations
membres GLOBAL / SITE / FREE
matchs publics et privés
paiements
ajout manuel des joueurs privés
jours de fermeture
solde dû automatique
blocage en cas de dette
sanctions automatiques
interface utilisateur
interface administrateur
Swagger
```

Les règles métier sont centralisées côté backend dans les services, tandis que le frontend se limite à l’affichage, aux formulaires et aux appels HTTP.
