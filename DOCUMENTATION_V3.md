# 📖 Documentation Technique - Version 3.0 Premium

**Date** : 12 Novembre 2025  
**Version** : 3.0 - Premium Experience & Gamification Avancée  
**Auteur** : Gregory Mittelette

---

## 🎯 Nouveautés Version 3.0

### 1. Design System Premium

#### `/config/premiumTheme.ts`

Système de design complet et unifié pour garantir cohérence cross-platform.

**Contenu** :
```typescript
- colors: Palette sophistiquée (primary, success, warning, error, neutral)
- gradients: 10+ gradients premium avec 3+ couleurs
- shadows: Adaptatifs (boxShadow web, shadowColor mobile)
- typography: Hiérarchie 7 niveaux (xxs → xxxl)
- spacing: 8 niveaux (xxs → xxxl)
- borderRadius: 4 niveaux (sm → xl)
```

**Usage** :
```typescript
import { premiumTheme } from '../config/premiumTheme';

<LinearGradient 
  colors={premiumTheme.gradients.success}
  style={{ padding: premiumTheme.spacing.md }}
/>
```

---

### 2. Système de Badges Sophistiqués

#### `/config/badgeSystem.ts`

Architecture complète pour badges multi-niveaux avec progression.

**Structure** :
```typescript
interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  category: 'completion' | 'speed' | 'accuracy' | 'regularity' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  hasLevels?: boolean;
  maxLevel?: number;
  condition: (progress, sessions, streak) => boolean;
}
```

**Badges Implémentés** : 15+
- **Completion** : Premier Pas → Légende (5 badges)
- **Speed** : Speed Demon → Éclair Parfait (3 badges)
- **Accuracy** : Tireur d'Élite, Perfection (2 badges)
- **Regularity** : Étincelle → Éternel (5 badges)
- **Special** : Maître Speed Drill, Champion Maths (2+ badges)

**Gradients & Borders** :
```typescript
BADGE_GRADIENTS = {
  bronze: { colors: ['#CD7F32', '#B8782A'], glow: 'rgba(205, 127, 50, 0.3)' },
  silver: { colors: ['#C0C0C0', '#A8A8A8'], glow: 'rgba(192, 192, 192, 0.4)' },
  gold: { colors: ['#FFD700', '#FFA500'], glow: 'rgba(255, 215, 0, 0.5)' },
  platinum: { colors: ['#E5E4E2', '#B9F2FF'], glow: 'rgba(185, 242, 255, 0.6)' },
  diamond: { colors: ['#B9F2FF', '#00D4FF'], glow: 'rgba(0, 212, 255, 0.7)' }
};
```

---

### 3. Système de Streaks (Jours Consécutifs)

#### Architecture

**Table SQL** : `user_streaks`
```sql
CREATE TABLE user_streaks (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fonction PostgreSQL** : `update_user_streak(p_user_id TEXT)`
- Incrémente streak si activité quotidienne
- Reset à 1 si activité après pause
- Met à jour `longest_streak` si record battu

**Intégration** :
```typescript
// Appelé dans dataService.ts à chaque activité
const streak = await updateUserStreak(userId);

// Affichage compact dans Dashboard
<StreakDisplay 
  currentStreak={streak.current_streak}
  longestStreak={streak.longest_streak}
  compact={true}
/>
```

---

### 4. Mascotte Interactive

#### `/components/Mascot.tsx`

Composant dynamique avec messages contextuels.

**Props** :
```typescript
interface MascotProps {
  message: string;
  mood?: 'happy' | 'excited' | 'proud' | 'encouraging';
  duration?: number; // Durée affichage (ms)
}
```

**Layout** :
- Horizontal : 🦊 emoji (gauche) + bulle texte (droite)
- Animation : fadeIn + bounce
- Auto-dismiss après `duration`

#### `/utils/mascotMessages.ts`

Générateurs de messages contextuels :

```typescript
// Message selon heure
getMascotMessageForXP(xp: number): string

// Message selon performance Speed Drill
getMascotMessageForPerformance(score: number, time: number): string

// Message selon contexte
getMascotMessageForContext(context: 'setup' | 'complete' | 'badge'): string
```

**Déclencheurs** :
- Dashboard load : 6 secondes (message XP/heure)
- Speed Drill start : Encouragement
- Speed Drill results : Performance-based
- Badge unlock : Célébration (dans BadgeUnlockModal)

---

### 5. Composants Visuels Premium

#### `/components/Badge3D.tsx`

Badge avec effets 3D avancés.

**Features** :
- Gradients par tier (Bronze → Diamond)
- Glow animé au tap
- Reflets lumineux (LinearGradient overlay)
- Bordures personnalisées
- Indicateur de niveau (si badge évolutif)
- Animation scale + rotation au press

**Structure** :
```typescript
<TouchableOpacity onPress={onPress}>
  <LinearGradient colors={tierGradient}>
    <Text style={iconStyle}>{badge.icon}</Text>
    {badge.hasLevels && <LevelIndicator level={badge.currentLevel} />}
  </LinearGradient>
  {isUnlocked && <GlowEffect color={tierGlow} />}
</TouchableOpacity>
```

#### `/components/BadgeUnlockModal.tsx`

Modal full-screen spectaculaire pour célébration.

**Features** :
- Animation fade + scale
- Confettis Lottie (arrière-plan)
- Badge 3D central (scale 2x)
- Haptic feedback (iOS/Android)
- XP gained display
- Progression vers prochain badge
- Auto-fermeture après 4s (optionnel)

**Usage** :
```typescript
const { unlockedBadge, triggerBadgeUnlock, closeBadgeModal } = useBadgeUnlock();

// Lors de nouveau badge
if (newBadges.length > 0) {
  triggerBadgeUnlock(newBadges[0]);
}

// Dans render
<BadgeUnlockModal
  badge={unlockedBadge}
  isVisible={!!unlockedBadge}
  onClose={closeBadgeModal}
/>
```

#### `/components/CircularTimer.tsx`

Timer circulaire animé (Speed Drill).

**Props** :
```typescript
interface CircularTimerProps {
  duration: number;      // Durée totale (secondes)
  remainingTime: number; // Temps restant
  size?: number;        // Diamètre cercle
  strokeWidth?: number; // Épaisseur trait
}
```

**Technologie** :
- `react-native-svg` : Circle, Text
- Animation : Progress arc (0° → 360°)
- Couleur dynamique : Vert → Orange → Rouge

#### `/components/StreakDisplay.tsx`

Affichage streaks compact ou détaillé.

**Modes** :
```typescript
// Compact (Dashboard header)
<StreakDisplay currentStreak={7} longestStreak={14} compact />
// Output: "🔥 7 jours • 🏆 14"

// Détaillé (Section dédiée)
<StreakDisplay currentStreak={7} longestStreak={14} />
// Output: Card avec titre, icônes, progression
```

---

### 6. Animations & Transitions

#### Transitions Écrans (`App.tsx`)

```typescript
<Stack.Navigator
  screenOptions={{
    animation: 'slide_from_right',
    animationDuration: 300,
    presentation: 'card',
    gestureEnabled: true,
    gestureDirection: 'horizontal'
  }}
>
  <Stack.Screen name="Auth" options={{ animation: 'fade' }} />
  <Stack.Screen name="Explorer" options={{ animation: 'slide_from_bottom' }} />
  <Stack.Screen name="SpeedDrill" options={{ 
    animation: 'slide_from_bottom',
    presentation: 'modal' 
  }} />
</Stack.Navigator>
```

#### Composants Animés

**react-native-animatable** :
```typescript
import * as Animatable from 'react-native-animatable';

<Animatable.View animation="fadeIn" duration={800}>
  <Text>Contenu</Text>
</Animatable.View>
```

**Animations disponibles** :
- `fadeIn`, `fadeOut`, `fadeInUp`, `fadeInDown`
- `bounceIn`, `bounceInDown`, `bounceInUp`
- `zoomIn`, `zoomOut`
- `slideInRight`, `slideInLeft`, `slideInUp`, `slideInDown`

**Lottie (Confettis)** :
```typescript
import LottieView from 'lottie-react-native';

<LottieView
  source={require('../assets/confetti.json')}
  autoPlay
  loop={false}
  style={{ position: 'absolute', width: '100%', height: '100%' }}
/>
```

**Haptic Feedback** :
```typescript
import * as Haptics from 'expo-haptics';

// Au déblocage badge
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Au tap bouton
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

---

### 7. Calcul Automatique Badges

#### `/services/dataService.ts`

**Fonction principale** : `calculateAdvancedBadges(userId)`

```typescript
export async function calculateAdvancedBadges(
  userId: string
): Promise<EarnedBadge[]> {
  // 1. Récupérer progression utilisateur
  const progressItems = await getExplorerProgress(userId);
  const sessions = await getSpeedDrillSessions(userId);
  const streak = await getUserStreak(userId);
  
  // 2. Récupérer badges déjà gagnés
  const earnedBadgeIds = await getEarnedBadgeIds(userId);
  
  // 3. Parcourir BADGE_CATALOG
  const newBadges: EarnedBadge[] = [];
  for (const badge of BADGE_CATALOG) {
    if (earnedBadgeIds.has(badge.id)) continue; // Déjà gagné
    
    // 4. Tester condition
    if (badge.condition(progressItems, sessions, streak)) {
      // 5. Sauvegarder nouveau badge
      await saveEarnedBadge(userId, badge.id);
      newBadges.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        tier: badge.tier,
        category: badge.category,
        rarity: badge.rarity,
        xpReward: badge.xpReward,
        earnedAt: new Date().toISOString()
      });
    }
  }
  
  return newBadges;
}
```

**Intégration Dashboard** :
```typescript
const loadModules = async () => {
  // ... chargement modules ...
  
  // Calcul badges
  const newBadges = await calculateAdvancedBadges(userId);
  if (newBadges.length > 0) {
    triggerBadgeUnlock(newBadges[0]); // Modal spectaculaire
  }
  
  // Update streak
  const streak = await updateUserStreak(userId);
  setStreak(streak);
};
```

---

### 8. Base de Données - Nouvelles Tables

#### `earned_badges`

```sql
CREATE TABLE earned_badges (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- RLS Permissive (validation app-side)
CREATE POLICY "Tous peuvent lire earned_badges"
  ON earned_badges FOR SELECT USING (true);

CREATE POLICY "Tous peuvent insérer earned_badges"
  ON earned_badges FOR INSERT WITH CHECK (true);
```

#### `user_streaks`

```sql
CREATE TABLE user_streaks (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fonction PostgreSQL
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id TEXT)
RETURNS TABLE(current_streak INT, longest_streak INT) AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INT;
  v_longest_streak INT;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Récupérer données existantes
  SELECT last_activity_date, user_streaks.current_streak, user_streaks.longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM user_streaks WHERE user_id = p_user_id;
  
  -- Si aucune entrée, créer
  IF v_last_date IS NULL THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 1, 1, v_today);
    RETURN QUERY SELECT 1, 1;
    RETURN;
  END IF;
  
  -- Si déjà actif aujourd'hui, ne rien faire
  IF v_last_date = v_today THEN
    RETURN QUERY SELECT v_current_streak, v_longest_streak;
    RETURN;
  END IF;
  
  -- Si activité hier, incrémenter streak
  IF v_last_date = v_today - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
  ELSE
    -- Sinon, reset à 1
    v_current_streak := 1;
  END IF;
  
  -- Mettre à jour record si nécessaire
  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;
  
  -- Sauvegarder
  UPDATE user_streaks
  SET current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_activity_date = v_today,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT v_current_streak, v_longest_streak;
END;
$$ LANGUAGE plpgsql;

-- RLS Permissive
CREATE POLICY "Tous peuvent lire user_streaks"
  ON user_streaks FOR SELECT USING (true);

CREATE POLICY "Tous peuvent gérer user_streaks"
  ON user_streaks FOR ALL USING (true) WITH CHECK (true);
```

**Migration** : `badges_and_streaks_migration.sql` + `fix_badges_rls.sql`

---

## 🎨 Conventions Cross-Platform

### Ombres (Shadows)

**Problème** : `shadowColor`, `shadowOffset` ne fonctionnent pas sur web.

**Solution** :
```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5 // Android
        }
    )
  }
});
```

### Gradients

**Library** : `expo-linear-gradient` (cross-platform)

```typescript
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#3B82F6', '#8B5CF6']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={styles.gradient}
/>
```

### Animations

**Recommandé** :
- Simple : `react-native-animatable` (cross-platform, stable)
- Complexe : `lottie-react-native` (JSON animations)
- **Éviter** : `react-native-reanimated` (overkill pour ce projet)

### Haptic Feedback

**Mobile uniquement** :
```typescript
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
```

---

## 🔒 Sécurité & RLS

### Philosophie

**Tables sensibles** (explorers, explorer_progress) :
- RLS stricte avec JWT (`auth.uid()`)

**Tables gamification** (earned_badges, user_streaks, speed_drill_sessions) :
- RLS permissive (`USING (true)`)
- Validation côté application dans `dataService.ts`
- Filtrage systématique par `user_id`

### Justification

**Contexte** :
- Usage familial (mentor + ses enfants)
- Explorateurs authentifiés par PIN (pas JWT)
- Données peu sensibles (scores, badges)

**Risque** :
- Attaque nécessiterait : extraction clé anon + reverse engineering app + connaissance structure DB
- Impact limité : modification de scores de jeu

**Sécurité Applicative** :
```typescript
// dataService.ts - Toutes les requêtes filtrent par userId
const { data, error } = await supabase
  .from('earned_badges')
  .select('*')
  .eq('user_id', userId); // Filtrage systématique
```

---

## 📦 Dépendances Clés

### UI/Animations
```json
{
  "expo-linear-gradient": "~13.0.2",
  "react-native-animatable": "^1.4.0",
  "lottie-react-native": "^6.7.2",
  "expo-haptics": "~13.0.1",
  "react-native-svg": "^15.2.0"
}
```

### Navigation/State
```json
{
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "react-native-screens": "~3.31.1",
  "react-native-gesture-handler": "~2.16.1"
}
```

### Backend
```json
{
  "@supabase/supabase-js": "^2.39.0"
}
```

### i18n
```json
{
  "react-i18next": "^13.5.0",
  "i18next": "^23.7.11"
}
```

---

## 🧪 Tests Recommandés

### Unit Tests
```bash
npm install --save-dev jest @testing-library/react-native
```

**Fichiers à tester** :
- `/services/dataService.ts` (calcul badges, streaks)
- `/config/badgeSystem.ts` (conditions badges)
- `/utils/mascotMessages.ts` (génération messages)

### E2E Tests
```bash
npm install --save-dev detox
```

**Scénarios critiques** :
1. Cycle complet défi → badge unlock → modal
2. Speed Drill → calcul stats → badge speed
3. Streak : activité quotidienne → incrémentation
4. Mascotte : apparition → auto-dismiss après 6s

---

## 🚀 Déploiement

### Checklist

1. **Code** :
   - ✅ Tests unitaires passent
   - ✅ Pas d'erreurs linter
   - ✅ i18n FR + EN complet
   - ✅ Animations fluides sur toutes plateformes

2. **Base de données** :
   - ✅ Migrations SQL appliquées (7 fichiers)
   - ✅ RLS configurées correctement
   - ✅ Index sur colonnes fréquentes

3. **Assets** :
   - ⏳ Lottie animations (confetti.json)
   - ⏳ Icône app (1024x1024)
   - ⏳ Splash screen

4. **Build** :
```bash
# Configuration EAS
eas build:configure

# Build Android
eas build --platform android --profile production

# Build iOS
eas build --platform ios --profile production
```

---

## 📞 Support Technique

### Logs & Debug

**Console logs** :
```typescript
// Dans dataService.ts, screens, etc.
console.log('[Badge] Calcul badges:', newBadges);
console.error('[Streak] Erreur update:', error);
```

**React Native Debugger** :
```bash
# Installer
brew install --cask react-native-debugger

# Lancer
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### Base de Données

**Supabase Dashboard** : https://supabase.com/dashboard
- SQL Editor : Requêtes ad-hoc
- Table Editor : Modifications rapides
- Logs : Erreurs RLS

### Common Issues

**Badge non débloqué** :
```sql
-- Vérifier condition
SELECT * FROM explorer_progress WHERE user_id = 'EXPLORER_UUID';

-- Forcer déblocage (test)
INSERT INTO earned_badges (user_id, badge_id) VALUES ('EXPLORER_UUID', 'completion_explorer');
```

**Streak reset** :
```sql
-- Reset streak utilisateur
UPDATE user_streaks SET current_streak = 0, last_activity_date = NULL WHERE user_id = 'EXPLORER_UUID';
```

**Mascotte ne s'affiche pas** :
- Vérifier `showMascot` state
- Vérifier timer (6 secondes)
- Vérifier z-index (doit être au-dessus)

---

## 📚 Ressources

### Documentation
- [React Native](https://reactnative.dev/)
- [Expo](https://docs.expo.dev/)
- [Supabase](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [Lottie React Native](https://github.com/lottie-react-native/lottie-react-native)

### Assets
- [Lottie Files](https://lottiefiles.com/) - Animations JSON
- [Heroicons](https://heroicons.com/) - Icônes (si nécessaire)
- [Coolors](https://coolors.co/) - Palettes de couleurs

### Communauté
- [Expo Discord](https://chat.expo.dev/)
- [Supabase Discord](https://discord.supabase.com/)
- [React Native Community](https://github.com/react-native-community)

---

**🎉 Version 3.0 - Production Ready ! 🚀**

