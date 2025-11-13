# 🏗️ ARCHITECTURE DES MODULES - DOCUMENTATION CRITIQUE

> ⚠️ **ATTENTION** : Cette documentation explique l'architecture fondamentale des modules d'Apex. Ne modifiez PAS les IDs techniques sans lire entièrement ce document.

---

## 🎯 PRINCIPE FONDAMENTAL

Apex utilise une **séparation stricte** entre :
1. **IDs techniques** (fixes, immuables) : `m1`, `m2`, `m3`, ..., `m19`
2. **Ordre d'affichage** (flexible, modifiable) : contrôlé par `MODULE_DISPLAY_ORDER`
3. **Numéros visuels** (dynamiques) : "MODULE 1", "MODULE 2", etc.

```
┌──────────────────────────────────────────────────────────┐
│  UTILISATEUR VOIT        │  CODE UTILISE               │
├──────────────────────────┼─────────────────────────────┤
│  MODULE 1                │  m12 (ID technique)         │
│  MODULE 2                │  m14 (ID technique)         │
│  MODULE 3                │  m15 (ID technique)         │
└──────────────────────────┴─────────────────────────────┘
```

---

## 🔐 IDs TECHNIQUES (NE JAMAIS MODIFIER)

### Localisation : `services/dataService.ts`

```typescript
const BASE_MODULE_DATA_SIM = [
  { id: 'm1', isUnlocked: true },
  { id: 'm2', isUnlocked: true },
  // ... jusqu'à m19
];

const BASE_DEFIS_SIM: Record<string, BaseDefi[]> = {
  m1: [ /* défis */ ],
  m2: [ /* défis */ ],
  // ... jusqu'à m19
};
```

### ⚠️ POURQUOI NE JAMAIS CHANGER CES IDs ?

Ces IDs sont des **clés primaires** utilisées dans **5 systèmes critiques** :

#### 1️⃣ **Base de données Supabase**
```sql
-- Table: explorer_progress
module_id VARCHAR (clé étrangère)
-- Contient: 'm1', 'm2', 'm12', etc.
```

**Impact si modifié** : 💥 PERTE TOTALE des progressions utilisateurs

#### 2️⃣ **Fichiers de traduction** (`translations/fr.json` et `translations/en.json`)
```json
{
  "m1": {
    "defi1": { "titre": "...", /* ... */ }
  },
  "m12": {
    "defi1": { "titre": "...", /* ... */ }
  }
}
```

**Impact si modifié** : 💥 Modules sans contenu, erreurs d'affichage

#### 3️⃣ **Système de badges** (`config/badgeSystem.ts` + `services/dataService.ts`)
```typescript
case 'module_m12':
  const m12Defis = progressItems.filter(p => p.moduleId === 'm12' ...);
```

**Impact si modifié** : 💥 Badges ne se déclenchent plus

#### 4️⃣ **Références croisées dans le contenu pédagogique**
```json
{
  "referenceCroisee": "M14",
  "leconStrategique": "Voir aussi M16 pour..."
}
```

**Impact si modifié** : 💥 Liens brisés entre modules

#### 5️⃣ **Logique de calcul XP et progression**
```typescript
const key = `${module.id}-${baseDefi.id}`;
// Génère: "m12-defi1", "m14-defi2", etc.
```

**Impact si modifié** : 💥 XP non attribués, progression cassée

---

## 🎨 ORDRE D'AFFICHAGE (MODIFIABLE)

### Localisation : `services/dataService.ts`

```typescript
// Ligne ~79
const MODULE_DISPLAY_ORDER = [
  'm12', // MODULE 1 (affiché en premier) - MODULE GRATUIT
  'm14', 'm15', 'm16', 'm17', 'm18', 'm19', // MODULES 2-7 - BLOC IA
  'm13', 'm5', 'm10', 'm7',  // MODULES 8-11 - Leadership
  'm1', 'm4', 'm2',          // MODULES 12-14 - Stratégie
  'm3', 'm8', 'm6',          // MODULES 15-17 - Exécution
  'm9', 'm11'                // MODULES 18-19 - Excellence
];
```

### ✅ COMMENT MODIFIER L'ORDRE D'AFFICHAGE ?

**Exemple** : Vous voulez mettre M13 (Money Smart) en premier

```typescript
// AVANT
const MODULE_DISPLAY_ORDER = [
  'm12',  // MODULE 1
  'm14', 'm15', /* ... */
];

// APRÈS
const MODULE_DISPLAY_ORDER = [
  'm13',  // MODULE 1 (nouveau)
  'm12',  // MODULE 2 (déplacé)
  'm14', 'm15', /* ... */
];
```

**Résultat** :
- L'utilisateur voit maintenant "MODULE 1 : Money Smart"
- Les IDs techniques restent inchangés (`m13` reste `m13`)
- Aucune migration de données nécessaire

### ⚠️ RÈGLES À RESPECTER

1. ✅ Tous les IDs de `BASE_MODULE_DATA_SIM` doivent être présents
2. ✅ Pas de doublons
3. ✅ Pas de modules manquants
4. ✅ Utiliser les IDs existants (`m1`-`m19`)

---

## 🔢 NUMÉROS VISUELS (AUTOMATIQUES)

### Localisation : `screens/ExplorerDashboardScreen.tsx`

```typescript
// Ligne ~76
<Text style={styles.moduleId}>MODULE {index + 1}</Text>
```

### Comment ça fonctionne ?

```typescript
modules.map((module, index) => {
  // index = position dans MODULE_DISPLAY_ORDER
  // MODULE_DISPLAY_ORDER[0] = 'm12' → affiché comme "MODULE 1"
  // MODULE_DISPLAY_ORDER[1] = 'm14' → affiché comme "MODULE 2"
  // etc.
  
  return <ModuleItem module={module} index={index} />;
});
```

**Résultat pour l'utilisateur** :
```
MODULE 1  L'Art de Connecter     (ID technique: m12)
MODULE 2  Comprendre l'IA        (ID technique: m14)
MODULE 3  Collaborer avec l'IA   (ID technique: m15)
```

---

## 📋 CHECKLIST : AJOUTER UN NOUVEAU MODULE

Si vous devez ajouter M20 à l'avenir :

### 1️⃣ **dataService.ts**
```typescript
// Ajouter à BASE_MODULE_DATA_SIM
{ id: 'm20', isUnlocked: true }

// Ajouter à BASE_DEFIS_SIM
m20: [
  { id: 'defi1', xpValue: 100, requires: [] },
  { id: 'defi2', xpValue: 100, requires: [] },
  { id: 'defi3', xpValue: 100, requires: [] },
  { id: 'defi4', xpValue: 100, requires: [] },
]

// Ajouter à MODULE_DISPLAY_ORDER (à la position souhaitée)
const MODULE_DISPLAY_ORDER = [
  'm12', 'm14', /* ... */, 'm20'  // ← Position d'affichage
];
```

### 2️⃣ **translations/fr.json**
```json
{
  "modules": {
    "m20": "Titre du Module",
    "m20_desc": "Description du module"
  },
  "m20": {
    "defi1": { /* contenu complet */ },
    "defi2": { /* contenu complet */ },
    "defi3": { /* contenu complet */ },
    "defi4": { /* contenu complet */ }
  }
}
```

### 3️⃣ **translations/en.json**
```json
// Même structure que fr.json
```

### 4️⃣ **badgeSystem.ts**
```typescript
{
  id: 'module_m20',
  tier: 'gold',
  category: 'completion',
  icon: '🎯',
  title: 'Nom du Badge',
  description: 'Module M20 complété !',
  requirement: 'Terminer M20',
  xpReward: 200,
  rarity: 'rare',
}
```

### 5️⃣ **dataService.ts - Logique badges**
```typescript
case 'module_m20':
  const m20Defis = progressItems.filter(p => p.moduleId === 'm20' && p.status === 'completed');
  earned = m20Defis.length >= 4;
  badgeProgress = Math.min(100, (m20Defis.length / 4) * 100);
  break;
```

### 6️⃣ **Mettre à jour les compteurs globaux**
```typescript
// Badge "all_modules"
case 'all_modules':
  earned = completedModules >= 20;  // ← Changer de 19 à 20
  badgeProgress = Math.min(100, (completedModules / 20) * 100);
  break;

// Badge "perfectionist"
case 'perfectionist':
  const allModuleIds = ['m1', 'm2', /* ... */, 'm19', 'm20'];  // ← Ajouter m20
  // ...
  earned = perfectModules.length === 20;  // ← Changer de 19 à 20
  break;
```

---

## 🚨 ERREURS COURANTES À ÉVITER

### ❌ ERREUR 1 : Renommer un ID technique
```typescript
// ❌ JAMAIS FAIRE ÇA
const BASE_MODULE_DATA_SIM = [
  { id: 'm1_renamed', isUnlocked: true },  // 💥 CASSERA TOUT
];
```

**Conséquence** : Perte de données, liens brisés, badges cassés

---

### ❌ ERREUR 2 : Oublier un module dans MODULE_DISPLAY_ORDER
```typescript
// ❌ PROBLÈME : m19 manquant
const MODULE_DISPLAY_ORDER = [
  'm12', 'm14', 'm15', /* ... */, 'm18'  // m19 oublié !
];
```

**Conséquence** : M19 invisible pour les utilisateurs

---

### ❌ ERREUR 3 : Doublons dans MODULE_DISPLAY_ORDER
```typescript
// ❌ PROBLÈME : m12 en double
const MODULE_DISPLAY_ORDER = [
  'm12', 'm14', 'm12', /* ... */  // m12 deux fois !
];
```

**Conséquence** : Affichage dupliqué, compteurs faussés

---

### ❌ ERREUR 4 : Modifier xpValue après déploiement
```typescript
// ❌ PROBLÈME : Changer rétroactivement les XP
m1: [
  { id: 'defi1', xpValue: 200, requires: [] },  // Était 100 avant
]
```

**Conséquence** : Utilisateurs existants ont 100 XP, nouveaux ont 200 XP (inéquitable)

---

## 🔧 OUTILS DE VÉRIFICATION

### Script de validation (à exécuter avant chaque commit)

```bash
# Vérifier que tous les modules sont dans MODULE_DISPLAY_ORDER
# Vérifier qu'il n'y a pas de doublons
# Vérifier que les badges correspondent
```

### Checklist manuelle
- [ ] Tous les modules de `BASE_MODULE_DATA_SIM` sont dans `MODULE_DISPLAY_ORDER`
- [ ] Tous les modules ont un badge dans `badgeSystem.ts`
- [ ] Tous les modules ont une logique dans `calculateAdvancedBadges`
- [ ] Tous les modules ont des traductions FR et EN
- [ ] Les compteurs globaux sont à jour (`all_modules`, `perfectionist`)

---

## 📊 ÉTAT ACTUEL (Version 3.x)

### Modules disponibles : **19**

| ID Technique | Position Affichée | Titre | Catégorie |
|--------------|-------------------|-------|-----------|
| m12 | MODULE 1 | L'Art de Connecter | 🎁 Gratuit |
| m14 | MODULE 2 | Comprendre l'IA | 🤖 IA |
| m15 | MODULE 3 | Collaborer avec l'IA | 🤖 IA |
| m16 | MODULE 4 | Dépasser l'IA | 🤖 IA |
| m17 | MODULE 5 | Penser Autrement | 🤖 IA |
| m18 | MODULE 6 | L'Art de Désobéir | 🤖 IA |
| m19 | MODULE 7 | Maîtriser les Dépendances | 🤖 IA |
| m13 | MODULE 8 | Money Smart | 💼 Leadership |
| m5 | MODULE 9 | Moteur d'Influence | 💼 Leadership |
| m10 | MODULE 10 | Code du Leader | 💼 Leadership |
| m7 | MODULE 11 | Créativité Stratégique | 💼 Leadership |
| m1 | MODULE 12 | Boîte à Outils Math | 🧠 Stratégie |
| m4 | MODULE 13 | Carte au Trésor | 🧠 Stratégie |
| m2 | MODULE 14 | Les Enjeux du Temps | 🧠 Stratégie |
| m3 | MODULE 15 | Cadre de l'Action | ⚙️ Exécution |
| m8 | MODULE 16 | Audit de Ressources | ⚙️ Exécution |
| m6 | MODULE 17 | Art de l'Échec | ⚙️ Exécution |
| m9 | MODULE 18 | Économie | 🏆 Excellence |
| m11 | MODULE 19 | Projet Capital | 🏆 Excellence |

### XP Total Possible : **7600 XP** (19 modules × 400 XP)

---

## 📞 SUPPORT

En cas de doute, référez-vous à :
- Ce document (`ARCHITECTURE_MODULES.md`)
- `HANDOVER.md` pour l'architecture globale
- `DOCUMENTATION_V3.md` pour les détails techniques

---

## 🔄 HISTORIQUE DES MODIFICATIONS

| Date | Version | Changement | Auteur |
|------|---------|------------|--------|
| 2025-01-XX | v3.0 | Architecture initiale avec séparation IDs/affichage | Assistant |
| 2025-01-XX | v3.0 | Ajout M12-M19 (8 nouveaux modules) | Assistant |
| 2025-01-XX | v3.0 | Numérotation dynamique implémentée | Assistant |

---

**⚠️ RÈGLE D'OR : En cas de doute, NE MODIFIEZ PAS les IDs techniques. Modifiez uniquement MODULE_DISPLAY_ORDER.**

