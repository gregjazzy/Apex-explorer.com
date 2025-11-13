# 📘 HANDOVER - Apex Junior Explorer

**Date de mise à jour** : 13 Novembre 2025  
**Statut** : ✅ Production Ready  
**Version** : 3.1 - 19 Modules avec Bloc IA + Architecture Modulaire

---

## 📚 DOCUMENTATION CRITIQUE

**⚠️ AVANT TOUTE MODIFICATION, CONSULTEZ :**
- **`⚠️_ARCHITECTURE_MODULES_CRITIQUE_⚠️.md`** : Architecture des modules (IDs techniques vs affichage) - **À LIRE ABSOLUMENT**
- **`DOCUMENTATION_V3.md`** : Système de badges, streaks, mascotte
- **`HANDOVER_REVISION_PEDAGOGIQUE.md`** : Stratégie pédagogique et contenu

---

## 🎯 Vue d'Ensemble

**Apex Junior Explorer** est une application mobile éducative React Native pour développer l'esprit stratégique et entrepreneurial des enfants (8-12 ans) via un système de **défis** et **jeux rapides**.

**Particularité** : Préparer les enfants à l'ère de l'IA avec des compétences "IA-proof" (communication, pensée critique, créativité, liberté numérique).

### Architecture
- **Frontend** : React Native (Expo) - Cross-platform (iOS, Android, Web)
- **Backend** : Supabase (PostgreSQL + Auth)
- **i18n** : React-i18next (FR/EN)
- **État** : React Hooks (pas de Redux)
- **Design System** : Theme premium unifié (`premiumTheme.ts`)
- **Animations** : `react-native-animatable`, `lottie-react-native`, haptic feedback

---

## 👥 Système d'Authentification Hybride

### 1. **Mentors** (Parents/Enseignants)
- **Auth** : Email + Mot de passe (Supabase Auth)
- **Table** : `auth.users` (géré par Supabase)
- **Permissions** : Créer des explorateurs, évaluer défis, voir stats

### 2. **Explorateurs** (Enfants)
- **Auth** : Nom + PIN (4 chiffres, custom)
- **Table** : `explorers` (custom)
- **Lien** : `mentor_id` → `auth.users.id`
- **Permissions** : Compléter défis, jouer Speed Drills

**Fichier clé** : `/hooks/useAuth.tsx`

---

## 🗄️ Structure Base de Données

### Tables Principales

#### `explorers`
```sql
- explorer_uuid (TEXT, PK)
- name (TEXT)
- pin_code (TEXT, 4 chiffres)
- mentor_id (UUID, FK → auth.users)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- subscription_status (TEXT) -- 'free' | 'trial' | 'premium' (préparé, non activé)
- subscription_expires_at (TIMESTAMP)
```

#### `explorer_progress`
```sql
- id (SERIAL, PK)
- user_id (TEXT) -- explorer_uuid
- module_id (TEXT) -- 'm1', 'm2'...
- defi_id (TEXT) -- 'defi1', 'defi2'...
- status (TEXT) -- 'completed'
- xp_earned (INTEGER)
- completed_at (TIMESTAMP)
- response_text (TEXT) -- Réponse explorateur (défis texte)
- mentor_comment (TEXT) -- Feedback mentor
- evaluation_status (TEXT) -- 'SOUMIS' | 'REVISION_DEMANDEE' | 'VALIDE' | 'COMPLETION_IMMEDIATE'
- attempt_count (INTEGER) -- Nombre de soumissions
```

#### `speed_drill_sessions`
```sql
- id (SERIAL, PK)
- user_id (TEXT) -- explorer_uuid
- operation_type (TEXT) -- 'Multiplication', 'Division', 'Addition', 'Subtraction'
- difficulty (TEXT) -- 'Facile', 'Moyen', 'Difficile'
- score (INTEGER) -- /10
- total_questions (INTEGER) -- 10
- accuracy (FLOAT) -- %
- time_seconds (INTEGER)
- created_at (TIMESTAMP)
```

#### `earned_badges` ⭐ **NOUVEAU**
```sql
- id (SERIAL, PK)
- user_id (TEXT) -- explorer_uuid
- badge_id (TEXT) -- 'completion_explorer', 'speed_demon', etc.
- earned_at (TIMESTAMP)
- UNIQUE (user_id, badge_id)
```

#### `user_streaks` 🔥 **NOUVEAU**
```sql
- id (SERIAL, PK)
- user_id (TEXT) -- explorer_uuid
- current_streak (INTEGER) -- Jours consécutifs actuels
- longest_streak (INTEGER) -- Record de jours consécutifs
- last_activity_date (DATE)
- updated_at (TIMESTAMP)
```

### Row Level Security (RLS)

**Explorateurs** :
- Lecture/Écriture de leurs propres données (`user_id = explorer_uuid`)

**Mentors** :
- Lecture des données de **leurs explorateurs uniquement**
- Mise à jour de `explorer_progress` pour évaluation

**Speed Drills / Badges / Streaks** :
- RLS permissive (`USING (true)`) avec **validation côté application**
- Justification : Usage familial, données peu sensibles, filtrage dans `dataService.ts`

---

## 📚 Contenu Pédagogique

### 11 Modules - 42 Défis
- **M1-M10** : 4 défis chacun
- **M11** : 2 défis

### Types de Défis
1. **Quizz (QCM)** : Validation temps réel, feedback immédiat, retry illimité, auto-soumission
2. **Texte Ouvert** : Soumission au mentor, cycle feedback/révision

### Système XP
- 100 XP par défi complété
- Affiché sur Dashboard Explorateur
- Utilisé pour calcul badges

### Contenus i18n (FR/EN)
Chaque défi contient :
- `titre` : Nom du défi
- `scenario` : Contexte narratif
- `instruction` : Consigne
- `leconStrategique` : Leçon à retenir
- `briefing` : Fiche de Travail Guidée (FTG) - Aide étape par étape
- `quiz` : Questions QCM avec feedback (si applicable)
- `mentorGoal` : But pédagogique (pour mentor)
- `evaluationCriteria` : Critères d'évaluation (pour mentor)

**Fichiers** : `/translations/fr.json`, `/translations/en.json`

---

## 🔄 Cycle Feedback Mentor-Explorateur

### Flux Complet

1. **Explorateur complète défi**
   - Quiz → Validation temps réel → Auto-soumission si correct → XP immédiat
   - Texte → Soumission manuelle → `evaluation_status = 'SOUMIS'`

2. **Mentor voit alerte**
   - Onglet "À Évaluer" (badge avec nombre de soumissions)
   - Bouton "📝 Réponse" pour ouvrir modal

3. **Mentor évalue** (`MentorEvaluationModal`)
   - Voir réponse + Guide pédagogique (but, critères)
   - Action : "✅ Valider" (`VALIDE`) ou "🔄 Demander Révision" (`REVISION_DEMANDEE`)
   - Commentaire obligatoire pour révision

4. **Explorateur reçoit feedback**
   - Status alert sur écran défi (couleur + message)
   - Affichage commentaire mentor
   - Si révision → Bouton "Renvoyer au Mentor" réapparaît
   - `attempt_count` incrémenté

5. **Boucle jusqu'à validation finale**

### États de Défi
- `SOUMIS` : En attente évaluation mentor
- `REVISION_DEMANDEE` : Mentor demande corrections
- `VALIDE` : Mentor accepte (XP attribué)
- `COMPLETION_IMMEDIATE` : Quiz auto-validé (XP immédiat)

**Fichiers clés** :
- `/screens/DefiScreen.tsx` (Explorateur)
- `/screens/MentorDashboardScreen.tsx` (Mentor)
- `/components/MentorEvaluationModal.tsx` (Évaluation)

---

## ⚡ Speed Drills (Jeu Rapide)

### Principe
- 10 questions de calcul mental
- 60 secondes chrono
- Feedback temps réel (✅ Correct / ❌ Incorrect)
- Revue pédagogique post-session (astuces de calcul)

### Configuration
- **Opération** : Multiplication, Division, Addition, Soustraction
- **Difficulté** : Facile, Moyen, Difficile

### Système de Stats

#### **Global** :
- Meilleur score (priorité : score max → temps min)
- Sessions totales
- Précision moyenne

#### **Par Catégorie** (Opération × Difficulté) :
- Meilleur score par type
- Temps du meilleur score
- Nombre de sessions

### Affichage

**Dashboard Explorateur** :
```
⚡ Défis de Vitesse
🏆 Meilleur: 9/10 en 47s

[▼ Voir tous mes records] ← Accordéon pliable

--- Détails (si déplié) ---
Mes records par type :
✖️ Multiplication (Moyen): 9/10 en 47s • 1 session
➕ Addition (Facile): 8/10 en 35s • 2 sessions
```

**Dashboard Mentor (Onglet "📊 Drill Stats")** :
```
Benoit
🏆 Meilleur Global: 9/10 en 47s
(Multiplication / Moyen)
📊 Sessions Totales: 5

Statistiques par Catégorie
├ Multiplication (Moyen): 9/10 en 47s • 2 sessions
├ Multiplication (Facile): 7/10 en 50s • 2 sessions
└ Addition (Facile): 8/10 en 35s • 1 session
```

**Fichiers clés** :
- `/screens/SpeedDrillScreen.tsx` (Jeu)
- `/services/dataService.ts` (Fonctions stats)
- SQL : `speed_drill_stats_migration.sql`

---

## 🎖️ Système de Badges & Gamification (Version 3.0)

### 🆕 Système Sophistiqué de Badges

#### Architecture
Le nouveau système de badges utilise :
- **Tiers** : Bronze → Silver → Gold → Platinum → Diamond
- **Catégories** : Completion, Speed, Accuracy, Regularity, Special
- **Rareté** : Common, Rare, Epic, Legendary
- **Niveaux** : Certains badges évolutifs (niveau 1-3)

#### Badges Disponibles (15+)

**🏆 Completion**
- **Premier Pas** (Bronze) : Compléter 1er défi
- **Explorateur** (Silver) : 10 défis complétés
- **Aventurier** (Gold) : 20 défis complétés
- **Maître** (Platinum) : 30 défis complétés
- **Légende** (Diamond) : Tous les 42 défis complétés

**⚡ Speed (Speed Drills)**
- **Speed Demon** (Silver) : 10/10 en moins de 45s
- **Flash** (Gold) : 10/10 en moins de 30s
- **Éclair Parfait** (Diamond) : 10/10 en moins de 20s

**🎯 Accuracy**
- **Tireur d'Élite** (Silver) : 100% de précision (10/10)
- **Perfection** (Gold) : 3 sessions parfaites consécutives

**🔥 Regularity (Streaks)**
- **Étincelle** (Bronze) : 3 jours consécutifs
- **Flamme** (Silver) : 7 jours consécutifs
- **Brasier** (Gold) : 14 jours consécutifs
- **Inferno** (Platinum) : 30 jours consécutifs
- **Éternel** (Diamond) : 100 jours consécutifs

**⭐ Special**
- **Maître Speed Drill** (Epic) : 50 sessions Speed Drill
- **Champion Mathématiques** (Legendary) : 10/10 dans toutes catégories

### 🏅 Système de Streaks (Jours Consécutifs)

**Principe** :
- Chaque activité (défi complété, Speed Drill) incrémente le streak
- Affichage ultra-compact dans header Dashboard
- Format : "🔥 X jours • Record: Y"
- Fonction PostgreSQL `update_user_streak` pour gestion automatique

**Récompenses** :
- Badges de régularité débloqués selon progression
- Motivation pour activité quotidienne

### 🎨 Affichage Premium

**Badge 3D Component** :
- Effets visuels avancés (gradients, glows, reflets)
- Animations au tap
- Différenciation visuelle par tier (couleurs, intensité)
- Indicateurs de niveau pour badges évolutifs

**Modal de Déblocage** :
- Animation full-screen spectaculaire
- Confettis (`lottie-react-native`)
- Haptic feedback (iOS/Android)
- Affichage XP gagnés
- Progression vers prochain badge

**Dashboard Integration** :
- Badges récents affichés en compact
- Tap pour ouvrir liste complète
- Badges verrouillés affichés avec progression

### 🦊 Mascotte Interactive **NOUVEAU**

**Principe** :
- Renard emoji (🦊) avec bulles de message contextuelles
- Apparition dynamique lors de moments clés
- Layout horizontal (mascotte gauche, texte droite)

**Déclencheurs** :
- Dashboard load (message selon XP/heure/streak) - 6 secondes
- Speed Drill : Start (encouragement), Results (performance)
- Badge unlock (célébration)

**Messages Contextuels** :
- Basés sur heure de journée (matin, après-midi, soir)
- Basés sur performance (excellent, bon, encouragement)
- Basés sur milestones XP (100, 500, 1000+)
- Spécifiques aux événements (nouveau badge, streak cassé)

**Fichier** : `/utils/mascotMessages.ts`

### 🎬 Animations & Transitions

**Transitions Écrans** :
- `slide_from_right` : Navigation standard
- `slide_from_bottom` : Dashboards, Speed Drill (modal)
- `fade` : Auth screen
- Durée : 300ms, gestures activés

**Composants Animés** :
- `react-native-animatable` : Fade, bounce, zoom
- `lottie-react-native` : Confettis, célébrations
- `expo-haptics` : Feedback tactile mobile

**Fichiers clés** :
- `/components/Badge3D.tsx`
- `/components/BadgeUnlockModal.tsx`
- `/components/Mascot.tsx`
- `/components/ConfettiAnimation.tsx`
- `/components/CircularTimer.tsx`
- `/components/StreakDisplay.tsx`
- `/hooks/useBadgeUnlock.tsx`

### 📊 Calcul Automatique

**Fichier** : `/services/dataService.ts`
- `calculateAdvancedBadges()` : Analyse progression + sessions
- Exécuté à chaque chargement Dashboard
- Compare avec badges déjà gagnés
- Trigger modal si nouveaux badges débloqués
- Sauvegarde dans `earned_badges` table

**Fonctions Clés** :
- `saveEarnedBadge(userId, badgeId)`
- `getEarnedBadgeIds(userId)`
- `calculateStreakBadges(streak)`
- `updateUserStreak(userId)`
- `getUserStreak(userId)`

**Configuration** : `/config/badgeSystem.ts`
- `BADGE_CATALOG` : Définitions de tous les badges
- `BADGE_GRADIENTS` : Couleurs et glows par tier
- `BADGE_BORDERS` : Bordures par tier
- `getNextBadgeToUnlock()` : Suggestions progression
- `getBadgeCompletionPercentage()` : Calcul % progression

---

## 🔐 Infrastructure Abonnement (Préparée, NON Activée)

### État Actuel
⚠️ **Tout est accessible gratuitement** (pas de paywall actif)

### Niveaux Préparés

| Statut | Modules | Speed Drills | Prix |
|--------|---------|-------------|------|
| `free` | M1-M2 | ❌ | Gratuit |
| `trial` | Tous (7j) | ✅ | Gratuit |
| `premium` | Tous | ✅ | 4,99€/mois |

### Fichiers Créés (Non Intégrés)
- `/services/subscriptionService.ts` : Logique abonnement
- `/screens/PaywallScreen.tsx` : Écran de paiement
- `subscription_migration.sql` : Colonnes + table activation codes
- `SUBSCRIPTION_GUIDE.md` : Documentation complète

### Activation Future
1. Exécuter `subscription_migration.sql` dans Supabase
2. Intégrer route Paywall dans `App.tsx`
3. Modifier `ExplorerDashboardScreen` pour vérifier abonnement
4. Implémenter paiement (Google Play IAP ou codes)

---

## 📁 Structure de Fichiers

```
/Users/gregorymittelette/Documents/Apex/
├── App.tsx                          # Navigation principale + Transitions
├── app.json                         # Config Expo
├── package.json                     # Dépendances
├── tsconfig.json                    # Config TypeScript
│
├── config/
│   ├── supabase.ts                  # Client Supabase (clé anon)
│   ├── i18n.ts                      # Config i18next
│   ├── premiumTheme.ts              # 🆕 Design System Premium
│   └── badgeSystem.ts               # 🆕 Système Badges Sophistiqués
│
├── hooks/
│   ├── useAuth.tsx                  # Auth context (Mentor + Explorateur)
│   └── useBadgeUnlock.tsx           # 🆕 Gestion modal badge unlock
│
├── services/
│   ├── dataService.ts               # CRUD principal (modules, défis, stats, badges, streaks)
│   └── subscriptionService.ts       # Abonnement (non activé)
│
├── screens/
│   ├── AuthScreen.tsx               # Login Mentor/Explorateur
│   ├── ExplorerDashboardScreen.tsx  # 🎨 Dashboard Explorateur Premium
│   ├── DefiListScreen.tsx           # 🎨 Liste défis Premium
│   ├── DefiScreen.tsx               # 🎨 Écran de défi Premium
│   ├── MentorDashboardScreen.tsx    # 🎨 Dashboard Mentor Premium (3 onglets)
│   ├── SpeedDrillScreen.tsx         # 🎨 Jeu Speed Drill Premium + Timer
│   └── PaywallScreen.tsx            # Abonnement (non activé)
│
├── components/
│   ├── ProgressBar.tsx              # Barre de progression module
│   ├── BadgeList.tsx                # 🎨 Affichage badges premium
│   ├── Badge3D.tsx                  # 🆕 Badge 3D avec effets visuels
│   ├── BadgeUnlockModal.tsx         # 🆕 Modal spectaculaire déblocage
│   ├── Mascot.tsx                   # 🆕 Mascotte interactive (renard)
│   ├── StreakDisplay.tsx            # 🆕 Affichage streaks compact
│   ├── CircularTimer.tsx            # 🆕 Timer circulaire Speed Drill
│   ├── ConfettiAnimation.tsx        # 🆕 Animation confettis
│   ├── XPCounter.tsx                # 🆕 Compteur XP animé
│   ├── BriefingModal.tsx            # FTG (Fiche Travail Guidée)
│   ├── DiscussionModal.tsx          # Guide discussion mentor
│   ├── MentorEvaluationModal.tsx    # Évaluation réponse explorateur
│   ├── ExplorerCreationModal.tsx    # Créer un explorateur
│   └── LanguageSwitcher.tsx         # FR/EN
│
├── utils/
│   └── mascotMessages.ts            # 🆕 Messages contextuels mascotte
│
├── translations/
│   ├── fr.json                      # 42 défis FR + UI
│   └── en.json                      # 42 défis EN + UI
│
├── *.sql                            # Migrations Supabase
│   ├── supabase_schema_PRODUCTION.sql
│   ├── migration_add_feedback_columns.sql
│   ├── speed_drill_stats_migration.sql
│   ├── speed_drill_fix_rls.sql
│   ├── badges_and_streaks_migration.sql  # 🆕 Tables badges + streaks
│   ├── fix_badges_rls.sql           # 🆕 RLS permissive badges/streaks
│   └── subscription_migration.sql   # (non exécuté)
│
└── HANDOVER.md                      # Ce document
```

---

## 🚀 Démarrage Développement

### Prérequis
```bash
node >= 18
npm >= 9
expo-cli
```

### Installation
```bash
cd /Users/gregorymittelette/Documents/Apex
npm install
```

### Lancement
```bash
# Web
npx expo start --web

# iOS/Android
npx expo start
# Puis scanner le QR code avec Expo Go
```

### Build Production
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

---

## 🔧 Configuration Supabase

### Variables d'Environnement
**Fichier** : `/config/supabase.ts`

```typescript
const supabaseUrl = 'https://wbnhtuktxccnxqqonryg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

⚠️ **Clé `anon`** (publique) : Normal qu'elle soit dans le code, sécurisée par RLS.

### Migrations Appliquées
1. ✅ `supabase_schema_PRODUCTION.sql` : Tables de base
2. ✅ `migration_add_feedback_columns.sql` : Cycle feedback
3. ✅ `speed_drill_stats_migration.sql` : Speed Drills
4. ✅ `speed_drill_fix_rls.sql` : RLS Speed Drills
5. ✅ `badges_and_streaks_migration.sql` : Tables badges + streaks (v3.0)
6. ✅ `fix_badges_rls.sql` : RLS permissive pour badges/streaks
7. ⏳ `subscription_migration.sql` : Abonnement (à activer plus tard)

---

## 🎨 Design & UX

### 🎯 Public Cible Ultra Premium

**Design Principles** :
- **Pour les parents milliardaires** : Minimalisme, efficacité, métriques claires
- **Pour les enfants (8-12 ans)** : Engagement, gamification subtile, feedback positif
- **Cross-platform** : iOS, Android, Desktop - Expérience identique

### 🎨 Premium Theme System

**Fichier** : `/config/premiumTheme.ts`

**Composants** :
- **Colors** : Palette sophistiquée (primaire, succès, warning, neutral)
- **Gradients** : 10+ gradients premium (success, info, premium, sunset, ocean, etc.)
- **Shadows** : Adaptatifs web (`boxShadow`) + mobile (`shadowColor`)
- **Typography** : Hiérarchie claire (xxs → xxxl)
- **Spacing** : Système cohérent (xxs → xxxl)
- **Border Radius** : 4 niveaux (sm → xl)

**Caractéristiques** :
- Gradients subtils mais sophistiqués
- Ombres adaptées par plateforme
- Pas de surcharge visuelle
- Focus sur lisibilité et données

### Palette de Couleurs

**Primaire** :
- `#3B82F6` (Bleu) : Actions principales
- `#10B981` (Vert) : Succès, validation
- `#F59E0B` (Orange) : Speed Drills, XP, attention
- `#EF4444` (Rouge) : Erreur, révision

**Gradients Signature** :
- `success` : Turquoise → Vert
- `premium` : Violet → Indigo
- `sunset` : Orange → Rose
- `ocean` : Bleu → Cyan

### Composants Réutilisables

**Animations** :
- `fadeIn`, `bounceIn`, `zoomIn` via `react-native-animatable`
- Confettis via `lottie-react-native`
- Haptic feedback via `expo-haptics`
- Transitions écrans via React Navigation animations

**UI Elements** :
- `TouchableOpacity` avec effets hover (web)
- `LinearGradient` pour tous les headers/cards
- `ScrollView` optimisé pour chaque plateforme
- Desktop-First : `MAX_WIDTH = 900px` pour web

### Navigation

- **React Navigation v6** (Stack Navigator)
- **Animations configurées** :
  - `slide_from_right` : Standard
  - `slide_from_bottom` : Dashboards, modales
  - `fade` : Transitions douces
- **Gestures activés** : Swipe back iOS/Android
- `useFocusEffect` pour refresh automatique

---

## 🐛 Problèmes Résolus

### 1. Scroll iOS
**Problème** : Contenu coupé, scroll impossible  
**Solution** : `ScrollView` avec `style={{ flex: 1 }}` + `contentContainerStyle={{ flexGrow: 1 }}`

### 2. Boutons iOS
**Problème** : Boutons apparaissent comme liens bleus  
**Solution** : Remplacer `<Button>` par `<TouchableOpacity>` + styles custom

### 3. Titres Modules
**Problème** : Affichage "Défi X" au lieu du vrai titre  
**Solution** : `i18n.t(defiKey)` dans `dataService.ts`

### 4. Mentor Comment Non Visible
**Problème** : Commentaire mentor pas affiché à l'explorateur  
**Solution** : `getStatusInfo()` dans `DefiScreen.tsx` affiche `mentorComment` explicitement

### 5. Quiz Re-soumission
**Problème** : Impossible de retry après mauvaise réponse  
**Solution** : Reset `validated: false` + `selectedOption: null` dans callback Alert

### 6. Speed Drill RLS
**Problème** : Explorateurs (PIN) ne peuvent pas insérer sessions  
**Solution** : RLS permissive (`USING (true)`) avec filtrage app-side

### 7. Dashboard Stats Caching
**Problème** : Stats pas à jour après nouvelle session  
**Solution** : `useFocusEffect` pour reload data

### 8. Badge System TypeScript Errors
**Problème** : Type mismatch entre array `progress` et variable `progress`  
**Solution** : Renommage `progress` → `progressItems` et variable locale → `badgeProgress`

### 9. SQL Type Mismatch (UUID vs TEXT)
**Problème** : `ERROR: 42883: operator does not exist: uuid = text` dans RLS policies  
**Solution** : Cast explicite `::TEXT` sur colonnes UUID dans requêtes RLS

### 10. RLS Too Strict for Explorer PIN Auth
**Problème** : Explorateurs (PIN custom) ne peuvent pas insérer dans `earned_badges`/`user_streaks`  
**Solution** : RLS permissive (`USING (true)`) avec validation côté application (`dataService.ts`)

### 11. Mascotte Trop Grande
**Problème** : Mascotte statique prend trop d'espace, bloque scroll  
**Solution** : Mascotte dynamique (6 secondes), layout horizontal, apparition temporaire

### 12. Platform-Specific Shadows
**Problème** : Ombres non visibles sur web (shadow props iOS/Android uniquement)  
**Solution** : `Platform.OS === 'web'` avec `boxShadow` pour web, `shadowColor` pour mobile

---

## 📊 Métriques & Performance

### Base de Données
- **Explorateurs actifs** : ~5-10 (test)
- **Défis totaux** : 42
- **Speed Drill sessions** : ~50-100 (test)
- **Requêtes** : <100ms en moyenne (Supabase edge cache)

### Application
- **Bundle Size** : ~3-5 MB (Expo optimisé)
- **Temps de chargement** : <2s (Dashboard)
- **FPS** : 60 (animations fluides)

---

## 🔒 Sécurité

### Niveau Actuel : ⭐⭐⭐⭐ (4/5)

**Points Forts** :
✅ RLS stricte pour mentors (JWT)  
✅ Filtrage `user_id` dans toutes les queries  
✅ Clé `anon` (pas `service_role`)  
✅ Validation côté app + côté DB  

**Points d'Amélioration (Si Commercial)** :
- [ ] Rate limiting Supabase
- [ ] Rotation clés tous les 6 mois
- [ ] Monitoring requêtes suspectes
- [ ] Edge Functions pour operations sensibles (si scale)

**Justification RLS Permissive (Speed Drills)** :
- Usage familial (mentor + ses enfants)
- Données peu sensibles (scores de jeu)
- Filtrage garantit isolation fonctionnelle
- Attaque nécessiterait : extraction clé + bypass app + connaissance structure DB

---

## 🚢 Déploiement Production

### Checklist Pre-Launch

#### Code
- [x] Tous les modules (M1-M11) testés
- [x] Cycle feedback Mentor-Explorateur validé
- [x] Speed Drills fonctionnels
- [x] Stats par catégorie opérationnelles
- [x] Système badges sophistiqués (15+ badges, 5 tiers)
- [x] Système streaks (jours consécutifs)
- [x] Mascotte interactive avec messages contextuels
- [x] Animations premium (confettis, transitions, 3D)
- [x] i18n FR/EN complet
- [x] Gestion erreurs (try/catch + Alerts)
- [ ] Tests E2E (Detox/Appium) - Recommandé
- [ ] Analytics (Sentry/Mixpanel) - Optionnel

#### Base de Données
- [x] RLS activées sur toutes les tables
- [x] Index sur colonnes fréquentes
- [x] Backup automatique Supabase
- [ ] Monitoring performances (Supabase Dashboard)

#### UX/UI
- [x] Design Premium responsive (mobile + web)
- [x] Système de badges sophistiqués avec animations
- [x] Mascotte interactive avec messages contextuels
- [x] Streaks (jours consécutifs) avec affichage compact
- [x] Transitions écrans fluides (300ms)
- [x] Gestion offline (partiellement - Supabase cache)
- [x] Feedback utilisateur (Alerts, status colors, haptics)
- [x] Confettis et célébrations (Lottie)
- [ ] Sons subtils feedback (optionnel)
- [ ] Dark mode (optionnel)

#### Legal/Commercial
- [ ] Politique de confidentialité
- [ ] CGU/CGV
- [ ] Conformité RGPD (si EU)
- [ ] Store Assets (icônes, screenshots, descriptions)
- [ ] Système paiement (IAP ou codes) - Si monétisation

---

## 📞 Support & Maintenance

### Logs & Debugging
```typescript
// Dans dataService.ts et screens
console.error("Message d'erreur:", error);

// Activer React Native Debugger
// Ou Expo DevTools pour inspecter state/props
```

### Base de Données Admin
- **Supabase Dashboard** : https://supabase.com/dashboard
- SQL Editor pour requêtes ad-hoc
- Table Editor pour modifications rapides

### Common Commands
```bash
# Reset cache
npx expo start --clear

# Reset explorateur progress (SQL)
DELETE FROM explorer_progress WHERE user_id = 'explorer_uuid_ici';

# Activer Premium pour test (SQL)
UPDATE explorers SET subscription_status = 'premium' WHERE name = 'NomExplorateur';
```

---

## 🔮 Roadmap Futur (Suggestions)

### Court Terme (1-2 mois)
- [ ] Activer système abonnement (si commercial)
- [ ] Implémenter Google Play IAP
- [ ] Ajouter analytics (tracking progression)
- [ ] Mode offline amélioré (React Query cache)
- [ ] Sons subtils pour feedback (badges, XP, confettis)

### Moyen Terme (3-6 mois)
- [ ] Nouveaux modules (M12-M15)
- [ ] Leaderboard Speed Drills (entre explorateurs d'un mentor)
- [ ] Notifications push (rappels mentor + streaks)
- [ ] Export PDF des progressions
- [ ] Badges avec niveaux avancés (évolution)

### Long Terme (6-12 mois)
- [ ] Version Web Progressive (PWA)
- [ ] Multi-mentor (partage explorateur)
- [ ] IA - Génération défis adaptatifs
- [ ] Mode compétition (entre écoles)
- [ ] Mascotte animée avancée (animations Lottie)

---

## 🤝 Contributeurs & Contacts

**Développeur Principal** : Gregory Mittelette  
**Date Création Projet** : 2024  
**Dernière Mise à Jour** : 12 Novembre 2025  

---

## 📝 Notes Importantes

### ⚠️ Avant Toute Modification
1. **Commit régulièrement** (pas de `--force push` sur main)
2. **Tester sur iOS + Android** (comportements différents)
3. **Vérifier i18n FR + EN** (ne pas oublier traductions)
4. **Lire linter errors** avant de commit

### 🎯 Philosophie du Projet
- **Simplicité** > Complexité (pas de sur-ingénierie)
- **Performance** > Features (app doit être fluide)
- **Pédagogie** > Gamification (contenu avant bling-bling)
- **Accessibilité** > Design (utilisable par enfants 8-12 ans)

---

## 📚 Ressources Utiles

### Documentation
- [React Native](https://reactnative.dev/docs/getting-started)
- [Expo](https://docs.expo.dev/)
- [Supabase](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [i18next](https://react.i18next.com/)

### Communauté
- [Expo Discord](https://chat.expo.dev/)
- [Supabase Discord](https://discord.supabase.com/)
- [React Native Community](https://github.com/react-native-community)

---

**🎉 Bon développement ! L'app est prête pour l'aventure ! 🚀**
