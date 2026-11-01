# Documentation des Composants du Block Editor (`docs/features/editor_usage.md`)

Ce document détaille l'utilisation des composants dédiés à l'éditeur modulaire de contenu ("Block Editor" façon Notion) : **`BlockWrapper`** et **`BlockPicker`**.

Ces composants fournissent l'enveloppe ergonomique uniforme autour de chaque `ContentBlock` (poignée de tri, position, type, actions rapides) ainsi que le sélecteur d'insertion de nouveaux blocs.

**Règle d'import :**
Importez les composants depuis l'index central UI :

```tsx
import {
  BlockPicker,
  BlockWrapper,
  DEFAULT_CMS_BLOCKS,
  type BlockTypeDefinition,
} from '@/ui/components';
```

---

## 1. BlockWrapper (Coquille de bloc d'édition)

Enveloppe standardisée qui entoure le formulaire spécifique de chaque bloc (`Texte`, `Image`, `Code`, `Citation`, `FAQ`, etc.). Elle affiche une barre d'outils supérieure comprenant :
* Une poignée de glisser-déposer (`dragHandleProps`, compatible avec `@dnd-kit/sortable`).
* Le numéro d'ordre du bloc (`#position`) et un `Badge` indiquant son `blockType`.
* Les boutons rapides pour monter/descendre le bloc, ouvrir ses réglages (`Drawer`) ou le supprimer.

### Props (`BlockWrapperProps`)

Hérite de `BaseComponentProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `blockType` | `string` | — | Type du bloc (ex. `'text'`, `'code'`, `'image'`) affiché dans le badge |
| `position` | `number` | — | Ordre d'affichage du bloc dans l'article (ex. `1`, `2`, `3`) |
| `isFirst` | `boolean` | `false` | Désactive le bouton « Monter » si le bloc est en première position |
| `isLast` | `boolean` | `false` | Désactive le bouton « Descendre » si le bloc est en dernière position |
| `onMoveUp` | `() => void` | `undefined` | Action déclenchée au clic sur la flèche haute |
| `onMoveDown` | `() => void` | `undefined` | Action déclenchée au clic sur la flèche basse |
| `onOpenSettings` | `() => void` | `undefined` | Action déclenchée au clic sur l'engrenage (ex. ouverture d'un `Drawer`) |
| `onDelete` | `() => void` | `undefined` | Action déclenchée au clic sur la corbeille |
| `dragHandleProps` | `React.HTMLAttributes<HTMLSpanElement>` | `undefined` | Attributs et écouteurs fournis par la librairie de Drag & Drop |

### Exemple d'utilisation

```tsx
import { BlockWrapper, ChoiceField, TextareaField } from '@/ui/components';

export const CodeBlockEditor = ({
  position,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) => {
  return (
    <BlockWrapper blockType="code" isFirst="{isFirst}" isLast="{isLast}" onDelete="{onDelete}" onMoveDown="{onMoveDown}" onMoveUp="{onMoveUp}" position="{position}">
      <ChoiceField defaultValue="typescript" label="Langage">
        <option value="php">PHP</option>
        <option value="typescript">TypeScript</option>
        <option value="json">JSON</option>
      </ChoiceField>

      <TextareaField label="Extrait de code" placeholder="Collez votre code ici…" rows="{6}"/>
    </BlockWrapper>
  );
};
```

---

## 2. BlockPicker (Sélecteur d'ajout de bloc)

Bouton d'insertion qui déploie une grille visuelle de types de blocs disponibles (`DEFAULT_CMS_BLOCKS` par défaut : `text`, `image`, `code`, `quote`, `video`, `table`, `faq`, `cta`). Dès qu'un type est sélectionné, `onSelectBlock(type)` est appelé et la grille se referme automatiquement.

### Props (`BlockPickerProps`)

Hérite de `BaseComponentProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `onSelectBlock` | `(type: string) => void` | — | Callback recevant la clé du type de bloc choisi |
| `availableBlocks` | `BlockTypeDefinition[]` | `DEFAULT_CMS_BLOCKS` | Permet de restreindre ou personnaliser la liste des blocs proposés |

### Structure de `BlockTypeDefinition`

```ts
export interface BlockTypeDefinition {
  type: string;
  label: string;
  icon: string;
  description?: string;
}
```

---

## 3. Exemple d'Assemblage Complet dans l'Éditeur d'Article

Exemple illustrant la combinaison de `EmptyState`, `BlockWrapper` et `BlockPicker` pour gérer la liste dynamique des blocs d'un article :

```tsx
import { useState } from 'react';
import {
  BlockPicker,
  BlockWrapper,
  EmptyState,
  Flex,
  TextareaField,
} from '@/ui/components';

interface ContentBlockItem {
  id: string;
  type: string;
  content: string;
}

export const ArticleBlocksCanvas = () => {
  const [blocks, setBlocks] = useState<ContentBlockItem[]>([]);

  const handleAddBlock = (type: string) => {
    setBlocks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type, content: '' },
    ]);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const current = copy[index];
      const target = copy[targetIndex];
      if (current && target) {
        copy[index] = target;
        copy[targetIndex] = current;
      }
      return copy;
    });
  };

  const handleRemove = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <Flex direction="column" gap="1rem">
      {blocks.length === 0 ? (
        <EmptyState description="Utilisez le sélecteur ci-dessous pour ajouter votre premier bloc de texte, d'image ou de code." icon="view-dashboard-Variant-outline" title="Cet article ne contient encore aucun bloc"/>
      ) : (
        blocks.map((block, index) => (
          <BlockWrapper + - 0} 1} blockType="{block.type}" blocks.length isFirst="{index" isLast="{index" key="{block.id}" onMoveUp="{()" position="{index"> handleMove(index, -1)}
            onMoveDown={() => handleMove(index, 1)}
            onDelete={() => handleRemove(block.id)}
          >
            <TextareaField (${block.type})`} label="{`Contenu" placeholder="Saisissez votre contenu…" rows="{3}"/>
          </BlockWrapper>
        ))
      )}

      <BlockPicker onSelectBlock="{handleAddBlock}"/>
    </Flex>
  );
};
```