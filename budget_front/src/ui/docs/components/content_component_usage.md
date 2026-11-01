# Utilisation des Composants Content (`content_components_usage.md`)

Ce document décrit l'utilisation des composants de structure et d'affichage de contenu : **Accordion**, **Card**, **ListGroup**, **Table**, **EmptyState** et **StatCard**[cite: 114].

**Règle d'import :**
Importez ces composants directement depuis l'index central UI[cite: 114] :

```tsx
import {
  Accordion,
  Card,
  EmptyState,
  ListGroup,
  StatCard,
  Table,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  TRow,
} from '@/ui/components';
```

---

## 1. Accordion

Composant d'affichage repliable (accordéon / FAQ) gérant `aria-expanded` et la rotation du chevron[cite: 114].
* **Sous-composants** : `Accordion`, `Accordion.Item`, `Accordion.Trigger`, `Accordion.Content`[cite: 114].
* **Props de `Accordion`** : `multiple?: boolean` (`false` par défaut), `defaultActiveKeys?: string[]` (`[]` par défaut)[cite: 114].
* **Props de `Accordion.Item`** : `itemKey?: string` (généré via `useId` si omis)[cite: 114].

---

## 2. Card

Conteneur de surface polyvalent[cite: 114].
* **Sous-composants** : `Card`, `Card.Header`, `Card.Title`, `Card.Body`, `Card.Footer`[cite: 114].
* **Props de `Card`** : `elevation?: 'none' | 'sm' | 'base' | 'md' | 'lg'` (`'sm'` par défaut), `bordered?: boolean` (`true` par défaut)[cite: 114].

---

## 3. ListGroup

Liste groupée sous forme de panneau pour les menus ou flux d'éléments[cite: 114].
* **Sous-composants** : `ListGroup` (`flush?: boolean`), `ListGroup.Item` (`active?: boolean`, `action?: boolean`, `disabled?: boolean`)[cite: 114].

---

## 4. Table

Tableau de données HTML sémantique[cite: 114].
* **Composants** : `Table`, `Thead`, `Tbody`, `Tfoot`, `TRow`, `Th`, `Td`[cite: 114].
* **Props de `Table`** : `striped?: boolean`, `hoverable?: boolean`, `bordered?: boolean`, `dense?: boolean`[cite: 114].
* **Props de `TRow`** : `selected?: boolean`[cite: 114].
* **Props de `Th` et `Td`** : `align?: 'left' | 'center' | 'right'`, `width?: string | number`[cite: 114].

---

## 5. EmptyState (État vide)

Composant d'habillage visuel destiné aux tableaux sans résultats, aux recherches infructueuses ou à un article ne contenant encore aucun bloc de contenu.

### Props (`EmptyStateProps`)

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `icon` | `string` | `'folder-open-outline'` | Nom de l'icône MDI/BoxIcons affichée dans le médaillon central |
| `title` | `string` | — | Titre principal expliquant l'absence de contenu |
| `description` | `string` | `undefined` | Texte explicatif secondaire |
| `action` | `React.ReactNode` | `undefined` | Bouton d'action principal (ex. `<Button>Créer un article</Button>`) |

### Exemple d'utilisation

```tsx
import { Button, EmptyState, Icon } from '@/ui/components';

export const NoPostsFound = ({ onReset }: { onReset: () => void }) => (
  <EmptyState <Button action="{" description="Aucun article ne correspond à vos critères de filtrage actuels." icon="file-search-outline" onClick="{onReset}" title="Aucun article trouvé" variant="outline">
        <Icon name="refresh" size="{16}"/>
        Réinitialiser les filtres
      </Button>
    }
  />
);
```

---

## 6. StatCard (Carte d'indicateur KPI)

Carte préformatée basée sur `Card` pour afficher les métriques clés en haut du tableau de bord (nombre d'articles publiés, brouillons, commentaires en attente).

### Props (`StatCardProps`)

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | — | Intitulé de la statistique |
| `value` | `string \| number` | — | Valeur chiffrée mise en avant (`2xl`, gras) |
| `icon` | `string` | — | Nom de l'icône affichée dans le badge carré supérieur droit |
| `trend` | `string` | `undefined` | Texte d'évolution optionnel (ex. `'+12% ce mois'`) |
| `trendVariant` | `BadgeVariant` | `'success'` | Couleur du badge de tendance (`'success'`, `'warning'`, `'danger'`, etc.) |

### Exemple d'utilisation

```tsx
import { Grid, StatCard } from '@/ui/components';

export const DashboardKpiRow = () => (
  <Grid columns="{3}" gap="1.5rem">
    <StatCard icon="check-decagram-outline" label="Articles publiés" trend="+4 cette semaine" trendVariant="success" value="{42}"/>
    <StatCard icon="file-edit-outline" label="Brouillons en cours" trend="2 prêts à relire" trendVariant="info" value="{7}"/>
    <StatCard icon="comment-alert-outline" label="Commentaires à modérer" trend="Action requise" trendVariant="warning" value="{3}"/>
  </Grid>
);
```