# Instructions pour compléter le fichier en.json

## 📋 Contexte
Le fichier `translations/fr.json` contient les 42 défis complets avec toutes les Fiches de Travail Guidées (FTG).
Le fichier `translations/en.json` a été créé mais nécessite le remplacement du contenu français par le contenu anglais.

## ✅ Ce qui est déjà fait
- ✅ Structure du fichier `en.json` créée
- ✅ Sections `global`, `modules`, `defi`, `mentor`, `dashboard`, `auth` traduites
- ❌ Sections M1-M11 : contiennent encore le texte français

## 🔧 Comment compléter

### Méthode 1 : Remplacement manuel via éditeur
1. Ouvrir `translations/en.json`
2. Chercher la section `"m1": {`
3. Remplacer tout le contenu de M1 jusqu'à la section M2
4. Répéter pour M2-M11

### Méthode 2 : Script Python automatique
Si vous avez le contenu anglais dans un fichier JSON séparé :

```python
import json

# Charger le contenu anglais source
with open('en_source.json', 'r', encoding='utf-8') as f:
    en_source = json.load(f)

# Charger le fichier actuel
with open('translations/en.json', 'r', encoding='utf-8') as f:
    en_current = json.load(f)

# Remplacer les modules M1-M11
for module in ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11']:
    if module in en_source:
        en_current[module] = en_source[module]

# Sauvegarder
with open('translations/en.json', 'w', encoding='utf-8') as f:
    json.dump(en_current, f, ensure_ascii=False, indent=2)

print("✅ Fichier en.json complété!")
```

### Méthode 3 : Copier-coller depuis le message original
Le contenu anglais complet M1-M11 a été fourni dans le message utilisateur.
Il suffit de :
1. Copier le JSON anglais de M1 à M11
2. Ouvrir `translations/en.json`  
3. Remplacer le contenu entre `"m1": {` et `"mentor": {`
4. Sauvegarder

## 📝 Format attendu

Chaque module doit suivre cette structure :

```json
"m1": {
  "defi1": {
    "titre": "Challenge: ...",
    "scenario": "...",
    "instruction": "...",
    "leconStrategique": "...",
    "referenceCroisee": "...",
    "briefing": {
      "etape1": { ... },
      "etape2": { ... }
    }
  },
  "defi2": { ... }
}
```

## ⚠️ Important
- Garder la structure JSON valide (virgules, accolades)
- `None` en Python = `null` en JSON
- Les guillemets doubles uniquement
- Pas de virgule après le dernier élément d'un objet

## 🚀 Après complétion
Une fois le fichier `en.json` complété, faire un commit :
```bash
git add translations/en.json
git commit -m "v2.0.1 - Ajout traductions anglaises (42 défis + FTG)"
```

