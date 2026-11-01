# Documentation des Composants Typographiques (`typo_components_usage.md`)

Ce document détaille l'utilisation des composants de texte et de titrage (`Title`, `Display`, `Lead`, `Text`) dans l'application React[cite: 71, 72, 73, 74].

Conformément à l'architecture du projet, chaque sous-dossier réexporte ses modules via un fichier `index.ts`. Tous les composants typographiques s'importent directement depuis l'index central :

```tsx
import {
  Display,
  Lead,
  Text,
  Title,
} from '@/ui/components';
```

---

## 1. Types et Contrats Communs (`typo.types.ts`)

Tous les composants typographiques héritent de l'interface `TypoBaseProps`, qui étend elle-même `BaseComponentProps` (`id`, `className`, `style`, `children`, `as`).

* **`TextAlign`** : `'start' | 'center' | 'end'` — Contrôle la propriété CSS `text-align` (`'inherit'` par défaut si non spécifié)[cite: 71, 72, 73, 74, 75].
* **`SemanticColor`** : `'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'info' | 'danger' | 'muted'` — Applique la teinte `.base` du rôle sémantique correspondant (ou `theme.colors.text.muted` pour `'muted'`)[cite: 71, 72, 73, 74, 75].

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `align` | `TextAlign` | `'inherit'` | Alignement horizontal du texte[cite: 71, 72, 73, 74, 75] |
| `color` | `SemanticColor` | Selon composant | Couleur sémantique issue du thème[cite: 71, 72, 73, 74, 75] |
| `as` | `React.ElementType` | Selon composant | Balise HTML polymorphe rendue dans le DOM[cite: 71, 72, 73, 74, 75] |

---

## 2. Title

Composant de titrage standard pour structurer les sections et les cartes de l'interface.

### Caractéristiques stylistiques
* **Police et graisse** : Utilise la police sans-serif (`theme.typography.fonts.sans`) avec une graisse `semibold` (`600`) et un interligne serré (`theme.typography.lineHeights.tight`).
* **Espacement** : Supprime la marge haute (`margin-top: 0`) et applique une marge basse de `theme.spacing[2]` (`0.5rem`).
* **Couleur par défaut** : Utilise `theme.colors.text.heading` si aucune prop `color` n'est fournie.
* **Échelle dynamique (`titleSizes`)** : La taille de la police est déterminée automatiquement par la balise passée à la prop `as` (`'h3'` par défaut) :
  * `h1` : `'2.25rem'`
  * `h2` : `'1.875rem'`
  * `h3` : `'1.5rem'` (défaut)
  * `h4` : `'1.25rem'`
  * `h5` : `'1.125rem'`
  * `h6` : `'1rem'`

### Props (`TitleProps`)

Hérite de `TypoBaseProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `as` | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'` | `'h3'` | Définit à la fois la balise HTML sémantique et la taille de police associée |
| `align` | `TextAlign` | `'inherit'` | Alignement horizontal du titre |
| `color` | `SemanticColor` | `theme.colors.text.heading` | Couleur du titre |

### Exemple d'utilisation

```tsx
import { Title } from '@/ui/components';

export const SectionHeaders = () => {
  return (
    <>
      <Title as="h1">Tableau de bord</Title>
      <Title as="h2" color="primary">Articles récents</Title>
      {/* Par défaut rendu en <h3> de 1.5rem */}
      <Title>Paramètres du bloc</Title>
      <Title align="center" as="h5" color="muted">Aucun résultat</Title>
    </>
  );
};
```

---

## 3. Display

Composant de titrage de très grande taille destiné aux en-têtes d'accueil, bannières visuelles ou indicateurs clés (KPI).

### Caractéristiques stylistiques
* **Police et graisse** : Police sans-serif (`theme.typography.fonts.sans`), graisse légère (`font-weight: 300`), interligne serré (`theme.typography.lineHeights.tight`) et approche réduite (`letter-spacing: -0.02em`).
* **Espacement** : `margin-top: 0` et marge basse de `theme.spacing[3]` (`0.75rem`)[cite: 5, 71].
* **Couleur par défaut** : `theme.colors.text.heading`.
* **Échelle de tailles (`displaySizes`)** : Pilotée par la prop `level` (indépendamment de la balise HTML `as`) :
  * `1` : `'5rem'` (défaut)
  * `2` : `'4.5rem'`
  * `3` : `'4rem'`
  * `4` : `'3.5rem'`
  * `5` : `'3rem'`
  * `6` : `'2.5rem'`

### Props (`DisplayProps`)

Hérite de `TypoBaseProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `1` | Niveau d'échelle déterminant la taille (`5rem` à `2.5rem`) |
| `as` | `React.ElementType` | `'h1'` | Balise HTML rendue dans le DOM |
| `align` | `TextAlign` | `'inherit'` | Alignement horizontal |
| `color` | `SemanticColor` | `theme.colors.text.heading` | Couleur sémantique |

### Exemple d'utilisation

```tsx
import { Display } from '@/ui/components';

export constStatHero = () => {
  return (
    <div>
      <Display as="span" color="primary" level="{3}">
        1 024
      </Display>
      <Display as="h1" level="{6}">
        Blocs de contenu générés
      </Display>
    </div>
  );
};
```

---

## 4. Lead

Paragraphe d'accroche ou chapô permettant de mettre en valeur un texte introductif sous un titre.

### Caractéristiques stylistiques
* **Typographie** : Taille fixée à `1.25rem`, graisse légère (`font-weight: 300`) et interligne aéré (`theme.typography.lineHeights.relaxed`).
* **Espacement** : `margin-top: 0` et marge basse de `theme.spacing[4]` (`1rem`).
* **Couleur par défaut** : Utilise `theme.colors.text.muted` par défaut lorsqu'aucune prop `color` n'est spécifiée.

### Props (`LeadProps`)

Hérite de `TypoBaseProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `as` | `React.ElementType` | `'p'` | Balise HTML rendue |
| `align` | `TextAlign` | `'inherit'` | Alignement horizontal |
| `color` | `SemanticColor` | `theme.colors.text.muted` | Couleur sémantique du chapô |

### Exemple d'utilisation

```tsx
import { Lead, Title } from '@/ui/components';

export const PageIntro = () => {
  return (
    <header>
      <Title as="h1">Éditeur de Contenu</Title>
      <Lead>
        Assemblez, réorganisez et validez les blocs JSON de votre article avant publication.
      </Lead>
    </header>
  );
};
```

---

## 5. Text

Composant typographique polyvalent pour le texte courant, les paragraphes, les libellés secondaires ou les extraits de code.

### Comportements spécifiques
* **Résolution de la taille (`size`)** : Si la valeur passée correspond à une clé de `theme.typography.sizes` (`'xs'`, `'sm'`, `'base'`, `'lg'`, `'xl'`, `'2xl'`, `'3xl'`), le token correspondant est appliqué ; sinon, la chaîne CSS brute fournie est utilisée directement.
* **Échelle de graisses (`weightMap`)** :
  * `'light'` : `300`
  * `'normal'` : `400` (défaut)
  * `'medium'` : `500`
  * `'semibold'` : `600`
  * `'bold'` : `700`
* **Support natif du code (`as="pre"`)** : Lorsque `as` vaut `'pre'`, le composant bascule automatiquement sur la police à chasse fixe (`theme.typography.fonts.mono`) et réinitialise ses marges (`margin: 0`).
* **Couleur par défaut intelligente** : En l'absence de prop `color`, le composant applique `theme.colors.text.muted` s'il est rendu en tant que paragraphe (`as="p"`), et `theme.colors.text.body` pour toutes les autres balises (`span`, `div`, `strong`, etc.).

### Props (`TextProps`)

Hérite de `TypoBaseProps`.

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `as` | `React.ElementType` | `'span'` | Balise HTML rendue (`'span'`, `'p'`, `'pre'`, `'strong'`, `'small'`, etc.) |
| `size` | `'xs' \| 'sm' \| 'base' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| string` | `'base'` | Clé du thème ou valeur CSS personnalisée |
| `weight` | `'light' \| 'normal' \| 'medium' \| 'semibold' \| 'bold'` | `'normal'` | Graisse de la police |
| `align` | `TextAlign` | `'inherit'` | Alignement horizontal[cite: 73, 75] |
| `color` | `SemanticColor` | `'muted'` si `as="p"`, sinon `'body'` | Couleur sémantique du texte[cite: 73, 75] |

### Exemples d'utilisation

```tsx
import { Text } from '@/ui/components';

export const TextExamples = () => {
  return (
    <div>
      {/* Texte inline standard (span, couleur body) */}
      <Text size="sm" weight="medium">
        Auteur de la publication :
      </Text>

      {/* Paragraphe (applique automatiquement la couleur muted par défaut) */}
      <Text as="p" size="base">
        Cet article n'a pas encore de description SEO renseignée.
      </Text>

      {/* Message d'erreur ou statut mis en valeur */}
      <Text color="danger" size="xs" weight="semibold">
        Échec de la validation Zod
      </Text>

      {/* Bloc de code avec police monospace automatique */}
      <Text as="pre" size="xs">
        {JSON.stringify({ type: 'quote', position: 1 }, null, 2)}
      </Text>
    </div>
  );
};
```