# Documentation des Composants Formulaires (`forms_components_usage.md`)

Ce document détaille l'utilisation des composants atomiques de formulaire (`Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Toggle`, `Label`, `HelperText`), des champs composés (`TextField`, `TextareaField`, `ChoiceField`, `CheckField`, `ToggleField`) et des contrôles enrichis (`InputGroup`, `TagInput`, `FileDropzone`)[cite: 113, 116].

Tous les composants s'importent directement depuis l'index central :

```tsx
import {
  // Champs de haut niveau
  CheckField,
  ChoiceField,
  TextareaField,
  TextField,
  ToggleField,
  // Contrôles enrichis (CMS)
  FileDropzone,
  InputAddon,
  InputGroup,
  TagInput,
  // Éléments atomiques
  Checkbox,
  HelperText,
  Input,
  Label,
  Radio,
  Select,
  Textarea,
  Toggle,
} from '@/ui/components';
```

---

## 1. Types et Contrats de Base (`form.types.ts`)

* **`ValidationState`** : `'default' | 'valid' | 'invalid'` — Définit l'état visuel du composant[cite: 113].
* **`FieldBaseProps`** : Contrat socle des champs composés (`label`, `error`, `hint`, `required`, `id`)[cite: 113].

---

## 2. Les Composants « Field » (Haut Niveau)

Ces composants intègrent automatiquement `Label`, le champ de saisie et `HelperText`, et supportent `React.forwardRef` pour `react-hook-form`[cite: 113] :

* **`TextField`** : Encapsule `Input` avec `label`, `error`, `hint`, `required`[cite: 113].
* **`TextareaField`** : Encapsule `Textarea` (`rows = 3` par défaut)[cite: 113].
* **`ChoiceField`** : Encapsule `Select` (les `<option>` sont passées en `children`)[cite: 113].
* **`CheckField`** : Case à cocher (`type="checkbox"`) ou bouton radio (`type="radio"`) avec libellé aligné[cite: 113].
* **`ToggleField`** : Interrupteur `Toggle` avec libellé cliquable et message d'erreur[cite: 113].

---

## 3. Contrôles Enrichis pour le CMS

### 3.1. InputGroup & InputAddon

Permet d'accoler un préfixe (`leftAddon`) ou un suffixe (`rightAddon`) directement à un composant `<Input />` (ex. domaine d'URL avant un slug, icône de recherche).

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `leftAddon` | `React.ReactNode` | `undefined` | Élément affiché à gauche du champ dans un `InputAddon` |
| `rightAddon` | `React.ReactNode` | `undefined` | Élément affiché à droite du champ dans un `InputAddon` |

```tsx
import { Icon, Input, InputGroup, Label } from '@/ui/components';

export const SlugField = () => (
  <div>
    <Label htmlFor="post-slug">URL de l'article</Label>
    <InputGroup leftAddon="[https://blog.fr/posts/](https://blog.fr/posts/)" name="link" rightAddon="{<Icon" size="{16}"/>}>
      <Input id="post-slug" placeholder="mon-article-symfony"/>
    </InputGroup>
  </div>
);
```

### 3.2. TagInput (Sélecteur de tags avec pastilles colorées)

Champ multi-sélection permettant d'associer des tags configurables avec pastille de couleur (`Badge` pill)[cite: 116]. Supporte l'autocomplétion via `suggestions`, l'ajout à la volée avec la touche `Enter` (`allowCreate`) et la suppression du dernier tag avec `Backspace`[cite: 116].

#### Type `TagOption`
```ts
export interface TagOption {
  id: string;
  label: string;
  color?: string; // Code hexadécimal ex: '#3b82f6'
}
```

#### Props (`TagInputProps`)

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | `undefined` | Libellé du champ[cite: 116] |
| `value` | `TagOption[]` | — | Liste des tags actuellement sélectionnés[cite: 116] |
| `onChange` | `(tags: TagOption[]) => void` | — | Callback déclenché à l'ajout ou au retrait d'un tag[cite: 116] |
| `suggestions` | `TagOption[]` | `[]` | Catalogue de tags existants filtré lors de la saisie[cite: 116] |
| `placeholder` | `string` | `'Ajouter un tag…'` | Texte indicatif lorsque aucun tag n'est sélectionné[cite: 116] |
| `allowCreate` | `boolean` | `true` | Autorise la création d'un nouveau tag avec `Enter`[cite: 116] |
| `error` | `string` | `undefined` | Message d'erreur de validation[cite: 116] |
| `hint` | `string` | `undefined` | Texte d'aide sous le champ[cite: 116] |

```tsx
import { useState } from 'react';
import { TagInput, TagOption } from '@/ui/components';

const AVAILABLE_TAGS: TagOption[] = [
  { id: 'sf', label: 'Symfony', color: '#000000' },
  { id: 'react', label: 'React', color: '#0ea5e9' },
  { id: 'archi', label: 'Architecture', color: '#16a34a' },
];

export const PostTagsSelector = () => {
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([AVAILABLE_TAGS[0]!]);

  return (
    <TagInput hint="Appuyez sur Entrée pour valider un tag." label="Tags de l'article" onChange="{setSelectedTags}" suggestions="{AVAILABLE_TAGS}" value="{selectedTags}"/>
  );
};
```

### 3.3. FileDropzone (Téléversement Drag & Drop)

Zone de glisser-déposer et de sélection de fichiers pour la médiathèque et les blocs d'images/vidéos, avec vérification automatique du poids maximal (`maxSizeMb`).

#### Props (`FileDropzoneProps`)

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | `undefined` | Libellé affiché au-dessus de la zone |
| `accept` | `string` | `'image/*,video/*'` | Types MIME acceptés par l'input fichier |
| `multiple` | `boolean` | `false` | Autorise la sélection de plusieurs fichiers simultanément |
| `maxSizeMb` | `number` | `10` | Taille maximale par fichier en mégaoctets |
| `disabled` | `boolean` | `false` | Désactive le glisser-déposer et l'ouverture de l'explorateur |
| `error` | `string` | `undefined` | Message d'erreur externe |
| `hint` | `string` | `undefined` | Message d'aide sous la zone |
| `onFilesSelected` | `(files: File[]) => void` | — | Callback recevant le tableau des fichiers valides |

```tsx
import { FileDropzone } from '@/ui/components';

export const CoverUploader = () => (
  <FileDropzone accept="image/png,image/jpeg,image/webp" hint="Formats recommandés : WebP ou PNG (ratio 16:9)." label="Image de couverture" maxSizeMb="{5}" onFilesSelected="{(files)"> console.log('Fichier prêt à être envoyé :', files[0])}
  />
);
```

---

## 4. Les Composants Atomiques (Bas Niveau)

À utiliser pour les barres de filtres ou les cellules de tableaux : `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Toggle`, `Label`, `HelperText`[cite: 113].