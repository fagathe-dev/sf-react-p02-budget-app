# Documentation des Composants de Navigation (`navigation_components_usage.md`)

Ce document détaille l'utilisation des composants de navigation (`Navbar`, `Sidebar`, `Tabs`, `Pagination`, `Dropdown`) dans l'application React.

Tous les composants et hooks associés s'importent directement depuis l'index central :

```tsx
import {
  // Navbar
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarDropdown,
  NavbarDropdownDivider,
  NavbarDropdownHeader,
  NavbarDropdownItem,
  NavbarDropdownMenu,
  NavbarDropdownToggle,
  NavbarItem,
  NavbarLink,
  NavbarNav,
  useDropdown,
  useNavbar,
  // Sidebar
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLink,
  SidebarNav,
  SidebarProvider,
  SidebarSection,
  SidebarToggle,
  useSidebar,
  // Tabs
  TabContent,
  TabList,
  Tabs,
  TabTrigger,
  useTabs,
  // Pagination
  Pagination,
  PaginationButton,
  PaginationContainer,
  PaginationEllipsis,
  PaginationItem,
  // Dropdown autonome
  Dropdown,
  DropdownDivider,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  useGenericDropdown,
  // Choix du mode d'affichage
  ThemeModeSwitcher,
} from '@/ui/components';
```

---

## 1. Navbar & NavbarDropdown

Barre de navigation horizontale supérieure supportant `sticky`, `breakpoint`, `isOpen` et `onToggle`.
* **Sous-composants** : `Navbar`, `NavbarBrand`, `NavbarCollapse`, `NavbarNav`, `NavbarItem`, `NavbarLink`.
* **Menu intégré** : `NavbarDropdown`, `NavbarDropdownToggle`, `NavbarDropdownMenu`, `NavbarDropdownItem`, `NavbarDropdownHeader`, `NavbarDropdownDivider`.

---

## 2. Sidebar

Barre de navigation latérale verticale (`sticky` sur desktop, tiroir `fixed` avec `Backdrop` sous le `breakpoint`).
* **Sous-composants** : `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarNav`, `SidebarSection`, `SidebarItem`, `SidebarLink` (slots `icon` et `badge`), `SidebarFooter`, `SidebarToggle`.

---

## 3. Tabs (Système d'Onglets)

Navigation par onglets avec montage conditionnel des panneaux.
* **Sous-composants** : `Tabs` (`defaultValue`, `value`, `onValueChange`), `TabList`, `TabTrigger` (`value`, `disabled`), `TabContent` (`value`).

---

## 4. Pagination

Navigation par pages avec calcul automatique des intervalles et ellipses.
* **Props** : `currentPage`, `totalPages`, `onPageChange`, `siblingCount = 1`, `showFirstLast = true`, `disabled = false`.
* **Sous-composants atomiques** : `Pagination.Container`, `Pagination.Item`, `Pagination.Button`, `Pagination.Ellipsis`.

---

## 5. Dropdown (Menu d'actions contextuel autonome)

Contrairement à `NavbarDropdown` qui est dédié à la barre supérieure, `Dropdown` s'utilise n'importe où dans l'interface : au bout des lignes d'un `Table` d'articles (bouton `⋮`) ou dans les barres d'outils de cartes. Il se ferme automatiquement au clic extérieur (`mousedown`), à la sélection d'une option ou avec la touche `Escape`.

### 5.1. Sous-composants composés
* **`Dropdown`** : Conteneur racine relatif fournissant le `GenericDropdownContext`.
* **`Dropdown.Trigger`** (`DropdownTrigger`) : Enveloppe l'élément déclencheur (ex. un `<IconButton name="dots-vertical" />` ou un `<Button>`).
* **`Dropdown.Menu`** (`DropdownMenu`) : Liste flottante (`role="menu"`).
* **`Dropdown.Item`** (`DropdownItem`) : Bouton d'action individuel (`role="menuitem"`) qui exécute son `onClick` puis referme automatiquement le menu.
* **`Dropdown.Divider`** (`DropdownDivider`) : Ligne de séparation horizontale.

### 5.2. Props

#### `Dropdown.Menu` (`DropdownMenuProps`)
| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `align` | `'left' \| 'right'` | `'right'` | Alignement horizontal du menu par rapport au déclencheur |
| `minWidth` | `string` | `'180px'` | Largeur minimale du menu déroulant |

#### `Dropdown.Item` (`DropdownItemProps`)
| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `icon` | `React.ReactNode` | `undefined` | Icône affichée à gauche du libellé |
| `variant` | `'default' \| 'danger'` | `'default'` | Applique la couleur `danger.base` pour les actions destructrices |
| `disabled` | `boolean` | `false` | Désactive l'action |

### Exemple d'utilisation (Colonne d'actions dans un tableau d'articles)

```tsx
import { Dropdown, Icon, IconButton } from '@/ui/components';

export const PostRowActions = ({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) => {
  return (
    <Dropdown>
      <Dropdown.Trigger>
        <IconButton aria-label="Actions sur l'article" name="dots-vertical" size="sm" variant="ghost"/>
      </Dropdown.Trigger>

      <Dropdown.Menu align="right" minWidth="190px">
        <Dropdown.Item icon="{<Icon" name="pencil-outline" size="{16}"/>}
          onClick={onEdit}
        >
          Modifier l'article
        </Dropdown.Item>
        <Dropdown.Item icon="{<Icon" name="content-copy" size="{16}"/>}
          onClick={onDuplicate}
        >
          Dupliquer
        </Dropdown.Item>
        <Dropdown.Divider/>
        <Dropdown.Item icon="{<Icon" name="trash-can-outline" size="{16}" variant="danger"/>}
          onClick={onDelete}
        >
          Supprimer
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};
```

---

## 6. ThemeModeSwitcher (Choix du mode d'affichage)

Sélecteur de thème prêt à l'emploi, basé sur `SegmentedControl` (voir `base_components_usage.md`) et branché sur le hook `useTheme`. Il propose trois choix présentés en icônes seules, avec une infobulle :

| Segment | `preference` | Icône | Description |
| :--- | :--- | :--- | :--- |
| Système | `'system'` | `laptop` | Suit le réglage de l'appareil / du navigateur (`prefers-color-scheme`), y compris en direct quand il change |
| Clair | `'light'` | `white-balance-sunny` | Force le thème clair |
| Sombre | `'dark'` | `weather-night` | Force le thème sombre |

Le composant n'a pas d'état propre : il lit et écrit le choix via `useTheme()` (`preference` / `setPreference`), persisté dans le `localStorage` (clé `ds-app-theme`). Le groupe est annoncé aux lecteurs d'écran sous le nom « Mode d'affichage ».

### Props (`ThemeModeSwitcherProps`)

Reprises de `SegmentedControlProps` :

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `fullWidth` | `boolean` | `false` | Occupe toute la largeur du parent, segments de largeur égale |
| `size` | `'sm' \| 'md'` | `'md'` | Taille des segments (padding, texte, icône) |

### Exemples d'utilisation

```tsx
import { ThemeModeSwitcher } from '@/ui/components';

{/* Seul, par exemple en haut à droite d'une page de connexion */}
<ThemeModeSwitcher />

{/* Version compacte */}
<ThemeModeSwitcher size="sm" />
```

Dans le menu du compte de la `Navbar`, en pleine largeur, avec un conteneur qui apporte l'espacement :

```tsx
import {
  NavbarDropdown,
  NavbarDropdownDivider,
  NavbarDropdownItem,
  NavbarDropdownMenu,
  NavbarDropdownToggle,
  ThemeModeSwitcher,
} from '@/ui/components';
import styled from 'styled-components';

const ThemeSetting = styled.div`
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
`;

export const AccountMenu = () => (
  <NavbarDropdown>
    <NavbarDropdownToggle aria-label="Menu du compte">Mon compte</NavbarDropdownToggle>

    <NavbarDropdownMenu align="right">
      <NavbarDropdownItem>Mon profil</NavbarDropdownItem>
      <NavbarDropdownDivider />
      <ThemeSetting>
        <ThemeModeSwitcher fullWidth />
      </ThemeSetting>
    </NavbarDropdownMenu>
  </NavbarDropdown>
);
```