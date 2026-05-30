# Dossier d’architecture

## Projet : Padel Booking App

## 1. Introduction

Ce projet est une application de gestion de réservations de terrains de padel.
L’objectif est de permettre à des membres de consulter les matchs publics, de créer des réservations, de rejoindre un match, de payer leur participation et de consulter leurs propres réservations.

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
├── frontend Angular
└── backend Spring Boot
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
├── layout
├── shared
└── app.routes.ts
```

Les composants Angular servent à afficher les différentes pages et parties de l’interface.
Les services Angular servent à centraliser les appels HTTP, l’état utilisateur et certaines règles d’affichage.

### 3.2 Routing Angular

L’application est une SPA. Le routing permet de naviguer entre les vues sans recharger toute l’application.

Exemples de routes :

```text
/login
/public-matches
/book-court
/my-reservations
/admin
```

La route `/login` permet de se connecter soit comme membre normal avec un matricule, soit comme administrateur avec un matricule et un mot de passe.

La route `/admin` correspond à l’interface administrateur. Elle est liée au login admin sécurisé par JWT.

### 3.3 Composants Angular

Les composants sont utilisés pour éviter la duplication de code et pour structurer l’affichage.

Exemples :

```text
ReservationCard
ReservationList
ReservationCreation
MyReservations
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
POST /reservations
POST /reservations/{id}/join
POST /reservations/{id}/pay
```

`UserService` gère l’utilisateur courant côté frontend. Par défaut, l’application démarre avec un membre libre afin de faciliter la démonstration.

`AdminAuthService` gère la connexion admin, le stockage du token JWT et l’état de connexion admin.

### 3.5 Formulaires

Les formulaires Angular sont utilisés pour créer une réservation et pour se connecter.

Les validations principales sont présentes :

* le matricule est obligatoire ;
* les champs site, terrain, date et heure sont obligatoires pour créer une réservation ;
* le mot de passe est requis uniquement pour une connexion administrateur.

### 3.6 Angular Material

Angular Material est utilisé pour les composants d’interface :

```text
mat-card
mat-toolbar
mat-form-field
mat-select
mat-button
mat-sidenav
```

Cette bibliothèque permet de construire rapidement une interface cohérente et ergonomique tout en conservant une apparence professionnelle.

---

## 4. Architecture backend

### 4.1 Structure générale

Le backend est développé avec Spring Boot et Java.
Il respecte une architecture en couches :

```text
controller
service
repository
model / entity
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
* la transformation entre entités et DTO.

### 4.2 Controllers

Les controllers exposent les endpoints REST.
Ils reçoivent les requêtes HTTP et délèguent le traitement aux services.

Exemple :

```text
ReservationController
MemberController
SiteController
CourtController
AuthController
AdminController
```

Le controller ne contient pas la logique métier principale. Il sert surtout de point d’entrée HTTP.

### 4.3 Services

Les services contiennent la logique métier.

Le service principal est `ReservationService`.
Il contient les règles liées aux réservations :

* création d’une réservation ;
* contrôle des délais selon le type de membre ;
* inscription à un match public ;
* paiement d’une participation ;
* blocage d’un membre sanctionné ;
* transformation automatique d’un match privé incomplet en match public ;
* calcul de l’état de participation de l’utilisateur courant.

Exemples de règles métier :

```text
GLOBAL : réservation jusqu’à 21 jours avant le match
SITE : réservation jusqu’à 14 jours avant le match et seulement sur son site
FREE : réservation jusqu’à 5 jours avant le match
PRIVATE incomplet la veille : transformation en PUBLIC et sanction de l’organisateur
```

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
```

### 4.5 DTO et mappers

Les DTO sont utilisés pour exposer uniquement les données nécessaires à l’API.

Exemple :

```text
ReservationDTO
ParticipationDTO
MemberDTO
AdminMemberDTO
```

Les mappers transforment les entités JPA en DTO, et inversement.
Cela évite d’exposer directement les entités de la base de données au frontend.

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
* un type public ou privé.

Une participation relie un membre à une réservation.

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
formulaires réactifs
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
```

Il permet d’avoir une interface cohérente et plus professionnelle.

### 12.3 Spring Boot

Spring Boot structure le backend et simplifie la configuration de l’application.

Modules utilisés :

```text
spring-boot-starter-webmvc
spring-boot-starter-data-jpa
spring-boot-starter-security
spring-boot-starter-test
spring-boot-starter-webmvc-test
spring-boot-starter-data-jpa-test
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

Spring Scheduling est utilisé pour appliquer automatiquement une règle métier : la sanction des matchs privés incomplets.

### 12.11 OpenAPI / Swagger

Springdoc OpenAPI est utilisé pour exposer la documentation de l’API REST.

Swagger est disponible lorsque l’application backend est lancée.

### 12.12 Maven

Maven est utilisé pour gérer les dépendances et compiler le backend.

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

---

## 14. Conclusion

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

Le projet met en œuvre les fonctionnalités principales du cahier des charges : gestion des réservations, membres, paiements, matchs publics et privés, sanctions, interface utilisateur et interface administrateur.
