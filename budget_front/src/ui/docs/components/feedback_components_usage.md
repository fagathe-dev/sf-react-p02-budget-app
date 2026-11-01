# Documentation des Composants Feedback (`feedback_components_usage.md`)

Ce document détaille l'utilisation des composants de rétroaction visuelle (`Alert`, `Loading`, `Progress`, `Skeleton`, `Modal`, `Dialog`, `ConfirmDialog`, `Toast`, `Drawer`, `Tooltip`) dans l'application React[cite: 112, 117, 118, 120].

Conformément à l'architecture du projet, chaque sous-dossier expose ses modules via un fichier `index.ts`[cite: 112]. Tous les composants présentés s'importent directement depuis l'index central :

```tsx
import {
  Alert,
  ConfirmDialog,
  Dialog,
  Drawer,
  Loading,
  Modal,
  Progress,
  Skeleton,
  Toast,
  ToastContainer,
  Tooltip,
  useToast,
} from '@/ui/components';
```

---

## 1. Alert

Affiche des messages contextuels statiques d'information, de succès, d'avertissement ou d'erreur[cite: 112].

### Props

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'info'` | Variante sémantique déterminant les couleurs et l'icône par défaut[cite: 112] |
| `title` | `string` | `undefined` | Titre optionnel mis en avant en gras[cite: 112] |
| `onClose` | `() => void` | `undefined` | Déclenche l'affichage d'un bouton de fermeture (`IconButton`)[cite: 112] |
| `showIcon` | `boolean` | `true` | Affiche ou masque l'icône associée à la variante[cite: 112] |
| `children` | `React.ReactNode` | — | Corps du message[cite: 112] |

### Exemple d'utilisation

```tsx
import { Alert } from '@/ui/components';

export const PostFeedback = () => (
  <Alert onClose="{()" title="Publication réussie" variant="success"> {}}>
    Le post a bien été mis en ligne et synchronisé avec le front-office.
  </Alert>
);
```

---

## 2. Loading

Indicateur d'attente animé sous forme de SVG vectoriel rotatif[cite: 112].

### Props

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `size` | `'sm' \| 'base' \| 'lg'` | `'base'` | Taille du spinner (`sm: 16px`, `base: 24px`, `lg: 36px`)[cite: 112] |
| `color` | `string` | `theme.colors.primary.base` | Couleur CSS personnalisée[cite: 112] |
| `label` | `string` | `'Chargement en cours…'` | Texte alternatif pour l'accessibilité (`aria-label`)[cite: 112] |

---

## 3. Progress

Barre de progression linéaire horizontale avec animation fluide des changements d'état[cite: 112].

### Props

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `value` | `number` | — | Valeur courante exprimée en pourcentage (`0` à `100`)[cite: 112] |
| `height` | `string` | `'6px'` | Épaisseur personnalisée de la piste[cite: 112] |
| `variant` | `'primary' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | Couleur sémantique de la barre active[cite: 112] |

---

## 4. Skeleton

Bloc temporaire animé simulant la forme des contenus avant leur chargement effectif[cite: 112].

### Props

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `'text' \| 'circular' \| 'rectangular'` | `'text'` | Forme géométrique et rayon de courbure[cite: 112] |
| `width` | `string \| number` | `'100%'` | Largeur du conteneur (nombre en pixels ou chaîne CSS)[cite: 112] |
| `height` | `string \| number` | Auto selon variante | Hauteur du conteneur (`1rem` par défaut pour `'text'`)[cite: 112] |

---

## 5. Modal, Dialog & ConfirmDialog

Boîtes de dialogue modales isolées dans un portail React (`createPortal`) au niveau du `document.body`, bloquant le scroll parent et écoutant la touche `Escape`[cite: 112].

### 5.1. Modal (Composant composé)
* `Modal` : Conteneur racine (`isOpen`, `onClose`, `maxWidth = '520px'`, `closeOnBackdrop = true`)[cite: 112].
* `Modal.Header` : En-tête avec `title?: string` et `onClose?: () => void`[cite: 112].
* `Modal.Body` : Corps avec défilement interne automatique[cite: 112].
* `Modal.Footer` : Pied de modale aligné à droite pour les boutons d'action[cite: 112].

### 5.2. Dialog
Variante centrée et compacte de `Modal` (`maxWidth = '420px'`)[cite: 112].

### 5.3. ConfirmDialog
Modale de confirmation préconfigurée pour les actions sensibles (ex. suppression)[cite: 112].

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `isOpen` | `boolean` | — | Contrôle la visibilité[cite: 112] |
| `onClose` | `() => void` | — | Action d'annulation/fermeture[cite: 112] |
| `onConfirm` | `() => void` | — | Action de validation[cite: 112] |
| `title` | `string` | — | Titre de l'en-tête[cite: 112] |
| `message` | `string` | — | Message d'avertissement[cite: 112] |
| `confirmLabel` | `string` | `'Confirmer'` | Libellé du bouton de confirmation[cite: 112] |
| `cancelLabel` | `string` | `'Annuler'` | Libellé du bouton d'annulation[cite: 112] |
| `variant` | `'danger' \| 'primary' \| 'warning'` | `'danger'` | Style sémantique de l'icône et du bouton[cite: 112] |
| `loading` | `boolean` | `false` | État de chargement sur les boutons[cite: 112] |

---

## 6. Toast & useToast (Notifications flottantes)

Système de notifications éphémères non bloquantes piloté par un store Zustand (`useToastStore`) et rendu dans un portail en bas à droite de l'écran via `<ToastContainer />`[cite: 118, 120].

### 6.1. Initialisation
Placez `<ToastContainer />` une seule fois à la racine de l'application (ex. dans `App.tsx`)[cite: 118].

### 6.2. Déclenchement via le hook `useToast`
Le hook expose des méthodes rapides qui génèrent automatiquement un identifiant et suppriment la notification au bout de `4000ms` (par défaut)[cite: 120] :
* `toast.success(message: string, title?: string)`[cite: 120]
* `toast.error(message: string, title?: string)`[cite: 120]
* `toast.warning(message: string, title?: string)`[cite: 120]
* `toast.info(message: string, title?: string)`[cite: 120]
* `toast.toast({ message, title, variant, duration })` : Permet de personnaliser la durée (`duration: 0` pour désactiver la fermeture automatique)[cite: 120].
* `toast.dismiss(id: string)` : Ferme manuellement une notification[cite: 120].

### Exemple d'utilisation

```tsx
import { Button, useToast } from '@/ui/components';

export const SavePostButton = () => {
  const { success, error } = useToast();

  const handleSave = async () => {
    try {
      // Appel API
      success('Les blocs ont été enregistrés.', 'Brouillon sauvegardé');
    } catch {
      error('Impossible de joindre le serveur API.', 'Erreur de sauvegarde');
    }
  };

  return <Button onClick="{handleSave}">Enregistrer (Ctrl+S)</Button>;
};
```

---

## 7. Drawer (Panneau latéral coulissant)

Tiroir latéral superposé rendu dans un portail (`createPortal`), idéal pour éditer les métadonnées SEO d'un article ou les paramètres avancés d'un bloc sans quitter l'éditeur des yeux.

### Sous-composants
* `Drawer` : Conteneur racine gérant le `Backdrop`, le blocage du scroll et la touche `Escape`.
* `Drawer.Header` : En-tête acceptant `title?: string` et `onClose?: () => void`.
* `Drawer.Body` : Zone centrale extensible (`flex: 1`) avec défilement vertical automatique.
* `Drawer.Footer` : Pied de panneau aligné à droite pour les boutons d'action.

### Props de `Drawer`

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `isOpen` | `boolean` | — | Contrôle l'ouverture du tiroir |
| `onClose` | `() => void` | — | Callback déclenché à la fermeture |
| `placement` | `'right' \| 'left'` | `'right'` | Côté d'apparition de l'écran |
| `width` | `string` | `'420px'` | Largeur maximale du panneau |
| `closeOnBackdrop` | `boolean` | `true` | Autorise la fermeture au clic sur le fond |

### Exemple d'utilisation

```tsx
import { useState } from 'react';
import { Button, Drawer, TextField, TextareaField } from '@/ui/components';

export const SeoSettingsDrawer = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick="{()" variant="outline"> setOpen(true)}>
        Paramètres SEO
      </Button>

      <Drawer isOpen="{open}" onClose="{()"> setOpen(false)} placement="right" width="440px">
        <Drawer.Header onClose="{()" title="Optimisation SEO"> setOpen(false)} />
        <Drawer.Body>
          <TextField label="Meta Title" placeholder="Titre pour Google…"/>
          <TextareaField label="Meta Description" rows="{4}"/>
        </Drawer.Body>
        <Drawer.Footer>
          <Button onClick="{()" variant="ghost"> setOpen(false)}>Fermer</Button>
          <Button onClick="{()" variant="primary"> setOpen(false)}>Appliquer</Button>
        </Drawer.Footer>
      </Drawer>
    </>
  );
};
```

---

## 8. Tooltip

Infobulle légère s'affichant au survol (`:hover`) ou au focus (`:focus-within`) autour d'un élément déclencheur (particulièrement utile sur les `IconButton`).

### Props

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `content` | `React.ReactNode` | — | Texte ou élément affiché dans la bulle |
| `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Position de la bulle par rapport à l'enfant |

### Exemple d'utilisation

```tsx
import { IconButton, Tooltip } from '@/ui/components';

export const BlockActionBtn = () => (
  <Tooltip content="Dupliquer ce bloc" placement="top">
    <IconButton aria-label="Dupliquer ce bloc" name="content-copy" size="sm"/>
  </Tooltip>
);
```