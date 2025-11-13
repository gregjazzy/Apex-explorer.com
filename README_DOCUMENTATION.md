# 📚 GUIDE DE LA DOCUMENTATION APEX

Ce projet contient plusieurs documents. Voici comment naviguer dans la documentation.

---

## 🎯 PAR OÙ COMMENCER ?

### 👨‍💻 Vous êtes un nouveau développeur ?
1. Lisez **`HANDOVER.md`** (vue d'ensemble)
2. Lisez **`⚠️_ARCHITECTURE_MODULES_CRITIQUE_⚠️.md`** (architecture critique)
3. Parcourez **`DOCUMENTATION_V3.md`** (fonctionnalités)

### 🔧 Vous devez modifier les modules ?
1. **LISEZ D'ABORD** `⚠️_ARCHITECTURE_MODULES_CRITIQUE_⚠️.md`
2. Ne touchez JAMAIS aux IDs techniques (`m1`, `m2`, etc.)
3. Modifiez uniquement `MODULE_DISPLAY_ORDER`

### 📝 Vous devez modifier le contenu pédagogique ?
1. Lisez `HANDOVER_REVISION_PEDAGOGIQUE.md`
2. Éditez `translations/fr.json` et `translations/en.json`
3. Testez dans l'application

---

## 📄 INDEX DES DOCUMENTS

### **HANDOVER.md** 📘
**Quoi** : Vue d'ensemble complète du projet  
**Quand le lire** : Premier contact avec le projet  
**Contenu** :
- Architecture générale
- Système d'authentification
- Structure base de données
- Cycle feedback mentor-explorateur
- Speed Drills
- Gamification (badges, streaks, mascotte)
- Déploiement

---

### **⚠️_ARCHITECTURE_MODULES_CRITIQUE_⚠️.md** 🚨 CRITIQUE
**Quoi** : Architecture des modules (IDs vs affichage)  
**Quand le lire** : AVANT toute modification des modules  
**Contenu** :
- Séparation IDs techniques / ordre d'affichage
- MODULE_DISPLAY_ORDER
- Erreurs à éviter
- Checklist ajout module
- Tableau des 19 modules actuels

**🚨 Document le plus important pour éviter de casser le projet**

---

### **DOCUMENTATION_V3.md** 🎨
**Quoi** : Documentation technique v3.0 (gamification)  
**Quand le lire** : Pour comprendre badges, streaks, mascotte  
**Contenu** :
- Design system premium
- Système de badges sophistiqué
- Streaks
- Mascotte interactive
- Animations
- Calcul automatique badges

---

### **HANDOVER_REVISION_PEDAGOGIQUE.md** 📚
**Quoi** : Stratégie pédagogique et contenu  
**Quand le lire** : Pour modifier le contenu des défis  
**Contenu** :
- Analyse des modules M1-M11 (problèmes)
- Nouvelle stratégie marketing
- Hiérarchie des modules
- Bloc IA et compétences "AI-proof"

---

### **IMPLEMENTATION_FEEDBACK_CYCLE.md** 🔄
**Quoi** : Cycle feedback mentor-explorateur  
**Quand le lire** : Pour modifier le système d'évaluation  
**Contenu** :
- Schéma de base de données
- Logique de soumission/validation
- Statuts d'évaluation
- Interface mentor

---

### **SUBSCRIPTION_GUIDE.md** 💳
**Quoi** : Infrastructure d'abonnement (préparée, non active)  
**Quand le lire** : Si vous activez les abonnements  
**Contenu** :
- Tables Supabase
- Logique freemium/premium
- RLS policies
- Intégration future

---

## 🗂️ FICHIERS SQL

| Fichier | Description |
|---------|-------------|
| `supabase_schema_PRODUCTION.sql` | Schéma complet production |
| `badges_and_streaks_migration.sql` | Migration badges v3.0 |
| `speed_drill_rls_final_production.sql` | RLS Speed Drills |
| `subscription_migration.sql` | Infrastructure abonnement |

---

## 📁 STRUCTURE DU CODE

```
/Apex
├── App.tsx                      # Point d'entrée, navigation
├── screens/
│   ├── AuthScreen.tsx          # Connexion mentor/explorateur
│   ├── ExplorerDashboardScreen.tsx  # Dashboard explorateur (MODULES AFFICHÉS ICI)
│   ├── MentorDashboardScreen.tsx    # Dashboard mentor
│   ├── DefiScreen.tsx          # Écran de défi (quiz/texte)
│   ├── DefiListScreen.tsx      # Liste des défis d'un module
│   └── SpeedDrillScreen.tsx    # Jeu de calcul rapide
├── services/
│   ├── dataService.ts          # ⚠️ LOGIQUE MODULES, XP, BADGES (CRITIQUE)
│   └── subscriptionService.ts  # Gestion abonnements
├── components/
│   ├── Badge3D.tsx             # Badge 3D animé
│   ├── BadgeList.tsx           # Liste des badges
│   ├── BadgeUnlockModal.tsx    # Modal déblocage badge
│   ├── Mascot.tsx              # Mascotte animée
│   ├── StreakDisplay.tsx       # Affichage streak
│   └── [autres composants...]
├── config/
│   ├── badgeSystem.ts          # ⚠️ CATALOGUE BADGES (CRITIQUE)
│   ├── premiumTheme.ts         # Design system
│   ├── i18n.ts                 # Configuration i18n
│   └── supabase.ts             # Client Supabase
├── translations/
│   ├── fr.json                 # ⚠️ CONTENU PÉDAGOGIQUE FR (CRITIQUE)
│   └── en.json                 # ⚠️ CONTENU PÉDAGOGIQUE EN (CRITIQUE)
└── hooks/
    ├── useAuth.tsx             # Hook authentification
    └── useBadgeUnlock.tsx      # Hook badges
```

---

## ⚠️ FICHIERS CRITIQUES (NE PAS MODIFIER SANS LIRE LA DOC)

1. **`services/dataService.ts`**
   - MODULE_DISPLAY_ORDER
   - BASE_MODULE_DATA_SIM
   - BASE_DEFIS_SIM
   - Logique badges
   
2. **`config/badgeSystem.ts`**
   - BADGE_CATALOG
   
3. **`translations/fr.json` et `translations/en.json`**
   - Contenu complet des défis
   
4. **`screens/ExplorerDashboardScreen.tsx`**
   - Affichage des modules

---

## 🚀 WORKFLOW DE MODIFICATION

### Ajouter un nouveau module (M20)
1. Lire `⚠️_ARCHITECTURE_MODULES_CRITIQUE_⚠️.md` section "Checklist"
2. Modifier 6 fichiers dans l'ordre documenté
3. Tester en mode solo ET avec mentor
4. Vérifier badges et XP

### Modifier l'ordre des modules
1. Ouvrir `services/dataService.ts`
2. Modifier UNIQUEMENT `MODULE_DISPLAY_ORDER`
3. Redémarrer l'app
4. Vérifier l'affichage

### Modifier le contenu d'un défi
1. Ouvrir `translations/fr.json`
2. Chercher `"m12": { "defi1": { ... } }`
3. Modifier le contenu
4. Traduire dans `translations/en.json`
5. Tester dans l'app

---

## 🆘 EN CAS DE PROBLÈME

### "Les modules ne s'affichent pas dans le bon ordre"
→ Vérifiez `MODULE_DISPLAY_ORDER` dans `dataService.ts`  
→ Consultez `⚠️_ARCHITECTURE_MODULES_CRITIQUE_⚠️.md`

### "Les badges ne se déclenchent pas"
→ Vérifiez la logique dans `calculateAdvancedBadges()` dans `dataService.ts`

### "Le contenu est en anglais/français"
→ Vérifiez `translations/fr.json` et `translations/en.json`

### "Les XP ne sont pas attribués"
→ Vérifiez `BASE_DEFIS_SIM` (xpValue) et `saveDefiProgress()`

### "J'ai cassé quelque chose"
→ Consultez l'historique Git, revenez à un commit stable

---

## 📞 SUPPORT

En cas de doute :
1. Lisez `⚠️_ARCHITECTURE_MODULES_CRITIQUE_⚠️.md` en entier
2. Cherchez dans ce README
3. Consultez le code avec les commentaires

---

**Version** : 3.1  
**Dernière mise à jour** : 13 Novembre 2025

