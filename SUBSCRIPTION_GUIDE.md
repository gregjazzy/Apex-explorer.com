# 🔒 Guide d'Implémentation du Système d'Abonnement

## ✅ Ce qui a été créé :

1. **`/services/subscriptionService.ts`** - Logique d'abonnement
2. **`/screens/PaywallScreen.tsx`** - Écran de paiement

---

## 🎯 Comment ça fonctionne :

### **3 niveaux d'accès** :

| Statut | Modules Accessibles | Speed Drills | Prix |
|--------|-------------------|--------------|------|
| `free` | M1, M2 seulement | ❌ | Gratuit |
| `trial` | Tous (7 jours) | ✅ | Gratuit |
| `premium` | Tous (illimité) | ✅ | 4,99€/mois |

---

## 📋 Étapes pour Activer :

### **1. Ajouter colonnes dans Supabase** :

```sql
ALTER TABLE explorers 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_subscription_status 
ON explorers(subscription_status);
```

### **2. Ajouter la route Paywall dans App.tsx** :

```typescript
import PaywallScreen from './screens/PaywallScreen';

// Dans le Stack.Navigator (zone explorateur) :
<Stack.Screen 
  name="Paywall" 
  component={PaywallScreen}
  options={{ headerTitle: 'Passer Premium' }}
/>
```

### **3. Protéger l'accès aux modules** :

Dans `ExplorerDashboardScreen.tsx`, modifier `loadModules` :

```typescript
import { checkSubscription } from '../services/subscriptionService';

const loadModules = async () => {
  const userId = user?.id;
  const subInfo = await checkSubscription(userId);
  
  const fetchedModules = await fetchModulesWithProgress(userId);
  
  // Verrouiller les modules selon l'abonnement
  const accessibleModules = fetchedModules.map(module => ({
    ...module,
    isLocked: !subInfo.canAccessModule(module.id)  
  }));
  
  setModules(accessibleModules);
};
```

### **4. Afficher un cadenas sur les modules verrouillés** :

Dans `ModuleItem` (composant de module) :

```typescript
const ModuleItem = ({ module, navigation }) => {
  const handlePress = () => {
    if (module.isLocked) {
      // Rediriger vers paywall
      navigation.navigate('Paywall', { reason: 'module_locked' });
    } else {
      // Ouvrir le module normalement
      navigation.navigate('DefiList', { moduleId: module.id });
    }
  };
  
  return (
    <TouchableOpacity onPress={handlePress}>
      {module.isLocked && <Text>🔒 Premium</Text>}
      <Text>{module.title}</Text>
    </TouchableOpacity>
  );
};
```

### **5. Protéger Speed Drills** :

Dans `ExplorerDashboardScreen.tsx` :

```typescript
const handleGoToSpeedDrills = () => {
  if (!subscriptionInfo?.canAccessSpeedDrills) {
    navigation.navigate('Paywall', { reason: 'speed_drill_locked' });
  } else {
    navigation.navigate('SpeedDrill');
  }
};
```

---

## 💳 Intégration du Paiement (Étape 2)

### **Option A : Google Play In-App Purchase** :

```bash
npm install react-native-iap
```

```typescript
// Dans PaywallScreen.tsx
import * as RNIap from 'react-native-iap';

const handleSubscribe = async () => {
  try {
    await RNIap.requestSubscription({ sku: 'apex_premium_monthly' });
    
    // Écouter l'achat
    const purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
      async (purchase) => {
        const receipt = purchase.transactionReceipt;
        
        // Activer premium dans Supabase
        await activatePremium(userId);
        
        Alert.alert('Bienvenue Premium !', 'Tous les modules sont débloqués');
        navigation.goBack();
      }
    );
  } catch (err) {
    console.error('Erreur paiement:', err);
  }
};
```

### **Option B : Code d'Activation (Plus Simple)** :

```typescript
// Dans PaywallScreen.tsx
const [activationCode, setActivationCode] = useState('');

const handleActivateCode = async () => {
  // Vérifier le code dans une table Supabase
  const { data } = await supabase
    .from('activation_codes')
    .select('*')
    .eq('code', activationCode)
    .eq('is_used', false)
    .single();
  
  if (data) {
    // Activer premium
    await activatePremium(userId);
    
    // Marquer code comme utilisé
    await supabase
      .from('activation_codes')
      .update({ is_used: true, used_by: userId })
      .eq('code', activationCode);
    
    Alert.alert('Succès !', 'Votre compte est maintenant Premium');
  } else {
    Alert.alert('Erreur', 'Code invalide ou déjà utilisé');
  }
};
```

---

## 🎁 Activer Trial 7 jours automatiquement :

Dans `AuthScreen.tsx` (après création compte explorateur) :

```typescript
import { activateTrial } from '../services/subscriptionService';

const handleExplorerCreation = async (name, pin) => {
  // Créer le compte...
  const newExplorerId = ...;
  
  // Activer trial automatiquement
  await activateTrial(newExplorerId);
  
  Alert.alert(
    'Bienvenue !',
    '🎉 Vous avez 7 jours gratuits pour tester tout le programme !'
  );
};
```

---

## 📊 Afficher le Statut d'Abonnement :

Dans `ExplorerDashboardScreen.tsx` :

```tsx
{subscriptionInfo?.status === 'trial' && (
  <View style={styles.trialBanner}>
    <Text>⏰ Trial : {daysLeft} jours restants</Text>
    <TouchableOpacity onPress={() => navigation.navigate('Paywall')}>
      <Text>Passer Premium</Text>
    </TouchableOpacity>
  </View>
)}

{subscriptionInfo?.status === 'free' && (
  <View style={styles.freeBanner}>
    <Text>📦 Version Gratuite (M1-M2)</Text>
    <TouchableOpacity onPress={() => navigation.navigate('Paywall')}>
      <Text>🚀 Débloquer tout</Text>
    </TouchableOpacity>
  </View>
)}
```

---

## ✅ Résumé :

1. ✅ Fichiers créés : `subscriptionService.ts` + `PaywallScreen.tsx`
2. ⚠️ À faire : 
   - Ajouter colonnes SQL
   - Intégrer dans App.tsx
   - Modifier Dashboard pour vérifier abonnement
   - Implémenter paiement (IAP ou codes)

**Veux-tu que je t'aide à implémenter une partie spécifique ?** 🚀

