# Documentation des Composants Grid et Layout (`grid_components_usage.md`)

Ce document détaille l'utilisation des composants structurels de mise en page (`Container`, `Row`, `Col`, `Grid`, `Flex`, `Columns`) dans l'application React.

Conformément à l'architecture du projet, chaque sous-dossier réexporte ses modules via un fichier `index.ts`. Tous les composants de mise en page s'importent directement depuis l'index central :

```tsx
import {
  Col,
  Columns,
  Container,
  Flex,
  Grid,
  Row,
} from '@/ui/components';
```

---

## 1. Container

Conteneur de centrage horizontal principal permettant de cadrer la largeur maximale des vues.

### Fonctionnement et comportement responsive
* Par défaut (`fluid={false}`), il applique des paliers `max-width` progressifs selon le point de rupture : `540px` (`sm`), `720px` (`md`), `960px` (`lg`), `1140px` (`xl`) et `1320px` (`xxl`).
* En mode fluide (`fluid={true}`), il occupe `100%` de la largeur disponible sans restriction de `max-width`.
* Il applique un centrage horizontal automatique (`margin-left: auto`, `margin-right: auto`) ainsi qu'un espacement interne latéral basé sur `theme.spacing[4]`.

### Props (`ContainerProps`)

Hérite de `BaseComponentProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `fluid` | `boolean` | `false` | Étend le conteneur sur `100%` de la largeur sur tous les écrans |
| `as` | `React.ElementType` | `'div'` | Balise HTML polymorphe rendue dans le DOM |

### Exemple d'utilisation

```tsx
import { Container } from '@/ui/components';

export const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Container as="main" fluid>
      {children}
    </Container>
  );
};
```

---

## 2. Système 12 Colonnes (`Row` & `Col`)

Système de grille flexible basé sur Flexbox et découpé en 12 colonnes proportionnelles.

### 2.1. Row (`RowProps`)
Conteneur horizontal (`display: flex`, `flex-wrap: wrap`) gérant les gouttières par marges négatives sur le parent et paddings symétriques sur ses enfants directs (`& > *`). Hérite de `BaseComponentProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `gutter` | `string` | `theme.spacing[2]` | Espacement latéral appliqué entre les colonnes |
| `as` | `React.ElementType` | `'div'` | Balise HTML polymorphe |

### 2.2. Col (`ColProps`)
Élément de colonne individuel dont la largeur s'exprime via le type `ColSpan` (`1` à `12` ou `'auto'`).
* Par défaut, une colonne occupe `100%` de la largeur (`flex: 0 0 auto`).
* Une valeur numérique calcule le pourcentage correspondant (`(span / 12) * 100%`).
* La valeur `'auto'` permet à la colonne d'occuper l'espace restant disponible (`flex: 1 0 0%`, `width: auto`, `max-width: 100%`).

Hérite de `BaseComponentProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `span` | `1..12 \| 'auto'` | `undefined` | Largeur de base (mobile-first) |
| `sm` | `1..12 \| 'auto'` | `undefined` | Largeur à partir du breakpoint `sm` |
| `md` | `1..12 \| 'auto'` | `undefined` | Largeur à partir du breakpoint `md` |
| `lg` | `1..12 \| 'auto'` | `undefined` | Largeur à partir du breakpoint `lg` |
| `xl` | `1..12 \| 'auto'` | `undefined` | Largeur à partir du breakpoint `xl` |
| `offset` | `number` | `undefined` | Décalage vers la droite (`margin-left: (offset / 12) * 100%`) |
| `as` | `React.ElementType` | `'div'` | Balise HTML polymorphe |

### Exemple d'utilisation

```tsx
import { Col, Row } from '@/ui/components';

export const EditorSplitLayout = () => {
  return (
    <Row gutter="1.5rem">
      {/* Pleine largeur sur mobile, 8 colonnes à partir de lg */}
      <Col lg="{8}" span="{12}">
        <div>Zone d'édition des blocs</div>
      </Col>

      {/* Pleine largeur sur mobile, 4 colonnes à partir de lg */}
      <Col lg="{4}" span="{12}">
        <div>Paramètres de publication et SEO</div>
      </Col>

      {/* Colonne de 6 unités centrée via un offset de 3 */}
      <Col md="{6}" offset="{3}" span="{12}">
        <div>Résumé centré</div>
      </Col>
    </Row>
  );
};
```

---

## 3. Grid (CSS Grid)

Conteneur natif basé sur CSS Grid (`display: grid`) pour créer des grilles bidimensionnelles.
* Si `columns` ou `rows` reçoit un nombre `N`, la valeur générée est `repeat(N, 1fr)`.
* Si une chaîne de caractères est fournie (ex. `'250px 1fr'`), elle est injectée telle quelle dans `grid-template-columns` ou `grid-template-rows`.

### Props (`GridProps`)

Hérite de `BaseComponentProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `columns` | `number | string` | `1` | Définition des colonnes (`repeat(N, 1fr)` ou valeur CSS) |
| `rows` | `number | string` | `'auto'` | Définition des lignes (`repeat(N, 1fr)` ou valeur CSS) |
| `gap` | `string` | `theme.spacing[0]` | Espacement global entre les lignes et les colonnes |
| `columnGap` | `string` | `undefined` | Espacement horizontal spécifique entre les colonnes |
| `rowGap` | `string` | `undefined` | Espacement vertical spécifique entre les lignes |
| `alignItems` | `'start' | 'end' | 'center' | 'stretch'` | `'stretch'` | Alignement vertical des cellules |
| `justifyItems` | `'start' | 'end' | 'center' | 'stretch'` | `'stretch'` | Alignement horizontal des cellules |
| `as` | `React.ElementType` | `'div'` | Balise HTML polymorphe |

### Exemple d'utilisation

```tsx
import { Card, Grid } from '@/ui/components';

export const MediaGrid = () => {
  return (
    <Grid alignItems="stretch" columns="{3}" gap="1rem">
      <Card>Média 1</Card>
      <Card>Média 2</Card>
      <Card>Média 3</Card>
    </Grid>
  );
};
```

---

## 4. Flex

Conteneur utilitaire universel basé sur Flexbox (`display: flex` ou `inline-flex`) pour gérer les alignements, distributions et espacements unidirectionnels.

### Props (`FlexProps`)

Hérite de `BaseComponentProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `inline` | `boolean` | `false` | Bascule l'affichage en `inline-flex` si activé |
| `direction` | `'row' | 'row-reverse' | 'column' | 'column-reverse'` | `'row'` | Direction de l'axe principal (`flex-direction`) |
| `justify` | `'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'` | `'flex-start'` | Alignement sur l'axe principal (`justify-content`) |
| `align` | `'stretch' | 'flex-start' | 'flex-end' | 'center' | 'baseline'` | `'stretch'` | Alignement sur l'axe secondaire (`align-items`) |
| `wrap` | `'nowrap' | 'wrap' | 'wrap-reverse'` | `'nowrap'` | Gestion du retour à la ligne (`flex-wrap`) |
| `gap` | `string` | `theme.spacing[0]` | Espacement entre les éléments enfants |
| `as` | `React.ElementType` | `'div'` | Balise HTML polymorphe |

### Exemple d'utilisation

```tsx
import { Button, Flex } from '@/ui/components';

export const ActionToolbar = () => {
  return (
    <Flex align="center" gap="1rem" justify="space-between" wrap="wrap">
      <span>Statut : Brouillon</span>
      <Flex align="center" gap="0.5rem">
        <Button variant="ghost">Aperçu</Button>
        <Button variant="primary">Publier</Button>
      </Flex>
    </Flex>
  );
};
```

---

## 5. Columns (Multi-colonnes / Masonry)

Conteneur exploitant la propriété CSS native `columns` pour répartir automatiquement le contenu en colonnes fluides (style journal ou grille *masonry*).

### Comportement automatique
* Applique `break-inside: avoid` sur tous les enfants directs (`& > *`) afin d'éviter qu'une carte ou un bloc ne soit coupé entre deux colonnes.
* Applique une marge basse (`margin-bottom`) égale au `gap` (ou `theme.spacing[4]` par défaut) sur chaque enfant direct.

### Props (`ColumnsProps`)

Hérite de `BaseComponentProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `count` | `number` | `undefined` | Nombre cible de colonnes |
| `width` | `string` | `undefined` | Largeur minimale idéale par colonne (ex. `'280px'`) |
| `gap` | `string` | `theme.spacing[4]` | Espacement entre les colonnes (`column-gap`) et marge basse des enfants |
| `rule` | `string` | `undefined` | Filet de séparation vertical entre colonnes (`column-rule`) |
| `as` | `React.ElementType` | `'div'` | Balise HTML polymorphe |

### Exemple d'utilisation

```tsx
import { Card, Columns } from '@/ui/components';

export const BlocksOverviewMasonry = () => {
  return (
    <Columns count="{3}" gap="1.25rem" width="280px">
      <Card>
        <Card.Body>Bloc texte court</Card.Body>
      </Card>
      <Card>
        <Card.Body>Bloc de code plus haut avec plusieurs lignes…</Card.Body>
      </Card>
      <Card>
        <Card.Body>Bloc citation</Card.Body>
      </Card>
    </Columns>
  );
};
```