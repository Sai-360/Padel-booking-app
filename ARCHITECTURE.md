# Dossier d’architecture

## Projet : Padel Booking App

## 1. Introduction

Padel Booking App est une application de réservation de terrains de padel.

L’application permet à des membres de :

- consulter les matchs publics ;
- créer une réservation publique ou privée ;
- rejoindre un match public ;
- payer leur participation ;
- ajouter des joueurs dans un match privé ;
- consulter leurs réservations ;
- payer un solde dû.

Le projet contient aussi une interface administrateur sécurisée.

L’application est séparée en deux parties :

- un frontend Angular ;
- un backend Java Spring Boot.

Le frontend communique avec le backend via une API REST.

---

## 2. Organisation générale du projet

Le projet est organisé en deux dossiers principaux :

```text
Padel-booking-app
├── backend        → API REST Spring Boot
└── frontend/app   → application Angular
```

L’architecture générale suit une séparation en couches :

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

Le frontend s’occupe de l’affichage, des formulaires et des appels HTTP.

Le backend contient la logique métier, la sécurité, les règles de réservation et l’accès à la base de données.

Cette séparation permet d’avoir un projet plus clair, plus testable et plus facile à faire évoluer.

---

## 3. Architecture frontend

Le frontend est développé avec Angular.

Il est structuré autour de :

- composants ;
- services ;
- routes ;
- modèles TypeScript ;
- éléments partagés.

Structure principale :

```text
src/app
├── model
├── views
├── shared
├── services
└── app.routes.ts
```

### 3.1 Routing

L’application est une SPA.

Les routes principales sont :

- `/home`
- `/login`
- `/public-matches`
- `/book`
- `/my-reservations`
- `/profile`
- `/admin`

La route `/admin` est protégée par un guard Angular.  
Un utilisateur non connecté comme administrateur ne peut pas accéder directement à cette page.

### 3.2 Composants Angular

Les composants permettent de découper l’interface en parties réutilisables.

Exemples de composants :

- `Home`
- `Login`
- `ReservationCreation`
- `ReservationCard`
- `PublicMatches`
- `MyReservations`
- `MyProfile`
- `Admin`
- `Header`
- `Menu`
- `Footer`

Le composant `ReservationCard` est réutilisé pour afficher une réservation dans plusieurs pages.  
Cela évite de dupliquer le même affichage.

### 3.3 Services Angular

Les services Angular centralisent les appels HTTP et certaines données de l’application.

Exemples :

- `ReservationsService`
- `MemberApiService`
- `UserService`
- `AdminAuthService`
- `AdminApiService`
- `BookingRuleApiService`

`ReservationsService` gère les appels liés aux réservations.

Exemples d’endpoints utilisés :

- `GET /reservations`
- `GET /reservations/public`
- `GET /reservations/member/{memberId}`
- `POST /reservations`
- `POST /reservations/{id}/join`
- `POST /reservations/{id}/pay`
- `POST /reservations/{id}/private-players`

`MemberApiService` récupère les membres depuis le backend.

Exemples :

- `GET /members`
- `GET /members/{matricule}`

La page de login utilise `GET /members` pour afficher les comptes disponibles.  
La page `MyReservations` utilise aussi les membres venant du backend pour proposer les joueurs à ajouter dans un match privé.

Cela évite de coder directement les matricules dans Angular.

`BookingRuleApiService` récupère les règles de réservation depuis le backend :

- prix ;
- nombre maximum de joueurs ;
- créneaux horaires ;
- jours de fermeture.

Cela évite de mettre ces règles directement en dur dans le frontend.

### 3.4 Formulaires

Les formulaires sont utilisés pour :

- la connexion membre ;
- la connexion administrateur ;
- la création d’une réservation ;
- l’ajout d’un joueur dans un match privé ;
- le paiement.

Les validations simples sont faites côté frontend pour améliorer l’expérience utilisateur.

Les règles importantes restent vérifiées côté backend.

### 3.5 Angular Material

Angular Material est utilisé pour construire une interface plus propre et cohérente.

Exemples :

- `mat-card`
- `mat-form-field`
- `mat-select`
- `mat-button`
- `mat-icon`
- `mat-toolbar`

---

## 4. Architecture backend

Le backend est développé avec Java et Spring Boot.

Il respecte une architecture en couches :

- controller ;
- service ;
- repository ;
- entity ;
- DTO ;
- mapper ;
- config ;
- exception.

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

### 4.1 Controllers

Les controllers exposent les endpoints REST.

Exemples :

- `ReservationController`
- `MemberController`
- `SiteController`
- `CourtController`
- `BookingRulesController`
- `AuthController`
- `AdminController`

Le controller reçoit la requête HTTP et délègue le traitement au service.

### 4.2 Services

Les services contiennent la logique métier.

Le service principal est `ReservationService`.

Il gère notamment :

- la création d’une réservation ;
- les délais selon le type de membre ;
- les jours fermés ;
- les créneaux horaires autorisés ;
- la vérification qu’un terrain n’est pas déjà réservé ;
- l’inscription à un match public ;
- le paiement d’une participation ;
- l’ajout de joueurs dans un match privé ;
- les sanctions automatiques ;
- le solde dû ;
- la libération des joueurs non payés.

Les règles importantes sont donc centralisées côté backend.

### 4.3 Repositories

Les repositories utilisent Spring Data JPA.

Exemples :

- `ReservationRepository`
- `MemberRepository`
- `SiteRepository`
- `CourtRepository`
- `ParticipationRepository`
- `BookingRuleRepository`
- `TimeSlotRepository`
- `ClosedDayRepository`

Ils permettent d’accéder à la base de données sans écrire manuellement tout le SQL.

### 4.4 DTO et mappers

Les DTO évitent d’exposer directement les entités JPA au frontend.

Exemples :

- `ReservationDTO`
- `ParticipationDTO`
- `MemberDTO`
- `AdminMemberDTO`

Les mappers transforment les entités en DTO et inversement.

Certains DTO contiennent aussi des champs utiles au frontend :

- `participantsCount`
- `currentUserJoined`
- `currentUserPaid`

Les DTO permettent aussi d’éviter d’exposer des informations sensibles, comme le mot de passe admin.

---

## 5. Base de données

La base utilisée est H2 en mémoire.

Elle permet de lancer facilement le projet sans installer de base externe.

Les données sont créées automatiquement au démarrage avec `DataSeeder`.

Entités principales :

- `Member`
- `Site`
- `Court`
- `Reservation`
- `Participation`
- `BookingRule`
- `TimeSlot`
- `ClosedDay`

### 5.1 Rôle des entités principales

`Member` représente un membre de l’application.

`Site` représente un club ou une implantation.

`Court` représente un terrain de padel lié à un site.

`Reservation` représente une réservation de terrain.

`Participation` relie un membre à une réservation.

`BookingRule` contient les règles principales de réservation.

`TimeSlot` contient les créneaux horaires autorisés.

`ClosedDay` contient les jours de fermeture globaux ou liés à un site.

### 5.2 Données de démarrage

Le `DataSeeder` crée automatiquement :

- des membres `GLOBAL`, `SITE` et `FREE` ;
- des administrateurs ;
- un membre avec une dette ;
- un membre bloqué ;
- plusieurs sites ;
- plusieurs terrains ;
- les règles de réservation ;
- des créneaux horaires ;
- des jours de fermeture ;
- des réservations publiques et privées ;
- des participations payées et non payées.

Ces données facilitent la démonstration du projet.

---

## 6. Règles métier principales

### 6.1 Types de membres

Il existe trois types de membres :

- `GLOBAL`
- `SITE`
- `FREE`

Les délais de réservation sont différents :

- `GLOBAL` : jusqu’à 21 jours avant le match ;
- `SITE` : jusqu’à 14 jours avant le match et uniquement sur son site ;
- `FREE` : jusqu’à 5 jours avant le match.

Ces règles sont vérifiées côté backend.

### 6.2 Match public

Un match public peut être rejoint par d’autres membres.

Le backend vérifie que :

- le match existe ;
- le match est actif ;
- le match est public ;
- le membre n’a pas déjà rejoint ;
- le match n’est pas complet ;
- le membre n’est pas bloqué.

Chaque joueur peut payer sa participation.

### 6.3 Match privé

Un match privé est créé par un organisateur.

L’organisateur ajoute les joueurs invités depuis ses réservations.

Le backend vérifie que :

- la réservation est privée ;
- l’utilisateur est bien l’organisateur ;
- le joueur existe ;
- le joueur n’est pas déjà ajouté ;
- l’organisateur n’est pas ajouté comme joueur invité ;
- le nombre maximum de joueurs n’est pas dépassé.

### 6.4 Jours fermés

Les jours fermés sont stockés dans l’entité `ClosedDay`.

Il existe deux types de fermeture :

- fermeture globale ;
- fermeture liée à un site.

Le backend empêche la création de réservations sur ces dates.

### 6.5 Paiement et solde dû

Chaque participation peut être payée.

Si un match public prévu le lendemain n’est pas complet ou pas entièrement payé, le solde manquant est ajouté à l’organisateur.

Les joueurs non payés sont retirés de la réservation afin de libérer leur place.

Tant qu’un membre possède un solde dû, il ne peut pas créer de nouvelle réservation.

### 6.6 Match privé incomplet

Un traitement automatique vérifie les matchs privés prévus le lendemain.

Si un match privé est incomplet :

- le match devient public ;
- l’organisateur est bloqué temporairement.

Cette règle est automatisée avec Spring Scheduling.

---

## 7. Sécurité

### 7.1 Connexion membre

Les membres classiques se connectent avec leur matricule.

Ils n’utilisent pas de mot de passe dans cette version.

### 7.2 Connexion administrateur

Les administrateurs se connectent avec :

- un matricule ;
- un mot de passe.

Après une connexion réussie, le backend génère un token JWT.

### 7.3 Spring Security et JWT

Spring Security protège les routes administrateur.

Routes publiques principales :

- `/members/**`
- `/sites/**`
- `/courts/**`
- `/reservations/**`
- `/booking-rules/**`
- `/auth/admin/login`
- `/swagger-ui/**`
- `/v3/api-docs/**`

Routes protégées :

- `/admin/**`

Les routes admin nécessitent un rôle :

- `GLOBAL_ADMIN`
- `SITE_ADMIN`

Le frontend envoie le token avec le header :

```text
Authorization: Bearer <token>
```

### 7.4 Sécurité côté Angular

Côté Angular :

- un guard protège la route `/admin` ;
- un interceptor ajoute le token JWT dans les requêtes protégées.

La sécurité réelle reste assurée côté backend.

---

## 8. Interface administrateur

L’interface admin permet de consulter :

- les réservations ;
- les membres ;
- les statistiques ;
- les membres bloqués ;
- les soldes dus.

Deux rôles existent :

- `GLOBAL_ADMIN`
- `SITE_ADMIN`

L’admin global peut voir toutes les données.

L’admin de site ne voit que les données liées à son site.

---

## 9. Swagger / OpenAPI

Le backend utilise Springdoc OpenAPI.

Swagger documente l’API REST et permet de tester les endpoints.

Il permet notamment de tester :

- les membres ;
- les sites ;
- les terrains ;
- les règles de réservation ;
- les réservations ;
- la connexion admin ;
- les routes admin.

---

## 10. Tests

Le projet contient des tests backend et frontend.

### 10.1 Tests backend

Exemples :

- `ReservationServiceTest`
- `ReservationControllerTest`
- `ReservationRepositoryTest`
- `AdminSecurityTest`
- `BackendApplicationTests`

Ils vérifient notamment :

- certaines règles métier ;
- les réservations ;
- le paiement ;
- l’ajout automatique de l’organisateur ;
- la libération des joueurs non payés ;
- la sécurité des routes admin.

### 10.2 Tests frontend

Les tests frontend couvrent surtout la partie admin :

- `AdminAuthService`
- `adminAuthGuard`
- `adminAuthInterceptor`

Ils vérifient :

- le stockage du token admin ;
- le logout admin ;
- la protection de la route `/admin` ;
- l’ajout du header `Authorization`.

---

## 11. Outils et frameworks structurants

Le projet utilise plusieurs outils structurants :

- Angular ;
- Angular Material ;
- Spring Boot ;
- Spring Web ;
- Spring Data JPA ;
- Spring Security ;
- JWT ;
- Spring Scheduling ;
- H2 ;
- Lombok ;
- Maven ;
- Swagger / OpenAPI ;
- Git.

Ces outils structurent le projet et correspondent aux notions vues au cours.

---

## 12. Choix techniques importants

### 12.1 Séparation frontend/backend

Angular est utilisé pour l’interface utilisateur.

Spring Boot est utilisé pour l’API, la logique métier et la base de données.

La communication se fait via HTTP REST.

### 12.2 Centralisation des règles métier côté backend

Les règles importantes restent côté backend.

Cela évite qu’un utilisateur contourne les règles depuis le navigateur.

### 12.3 Utilisation des DTO

Les DTO permettent de contrôler les données envoyées au frontend.

Ils évitent aussi d’exposer des informations sensibles, comme le mot de passe admin.

### 12.4 Chargement des données depuis le backend

Le frontend charge les membres, les règles, les créneaux et les jours fermés depuis le backend.

Cela évite de maintenir trop de valeurs en dur dans Angular.

---

## 13. Limites et améliorations possibles

Le projet pourrait être amélioré avec :

- une interface admin pour gérer les sites ;
- une interface admin pour gérer les jours fermés ;
- une vraie base de données externe ;
- plus de tests end-to-end ;
- un vrai système de paiement ;
- une gestion plus complète des rôles.

---

## 14. Conclusion

Le projet respecte les principes vus au cours :

- séparation frontend/backend ;
- API REST ;
- architecture Angular en composants et services ;
- architecture Spring Boot en couches ;
- base relationnelle avec JPA ;
- DTO et mappers ;
- sécurité admin avec JWT ;
- guard et interceptor Angular ;
- Swagger ;
- tests backend et frontend ;
- jeu de données automatique.

Les règles métier importantes sont centralisées côté backend.

Le frontend se concentre sur l’affichage, les formulaires et les appels HTTP.
