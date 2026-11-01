# Utilisation des Composants Embed (UI Kit)

Ce document décrit l'utilisation des composants d'affichage multimédia : **Image**, **Video** et **Figure**.

Ces composants intègrent les tokens du Design System (rayons, ombres, espacements) et fournissent des options avancées pour le responsive design (chargement différé, ratios d'aspect, cadrage `object-fit`).

**Règle d'import :**
Importez les composants directement depuis l'index UI grâce au forwarding d'export :

```tsx
import { Figure, Image, Video } from '@/ui/components';
```

---

## 1. Image

Composant d'affichage d'images optimisé. Il active le chargement différé (`loading="lazy"`) par défaut et propose un dimensionnement fluide automatique.

### Props principales

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `fluid` | `boolean` | `true` | Adapte l'image à la largeur de son conteneur (`max-width: 100%`, `height: auto`). |
| `fit` | `'cover' \| 'contain' \| 'fill' \| 'none' \| 'scale-down'` | `undefined` | Règle le comportement CSS `object-fit`. |
| `aspectRatio` | `string` | `undefined` | Ratio largeur/hauteur CSS (ex: `'16/9'`, `'4/3'`, `'1/1'`). |
| `radius` | `'sm' \| 'base' \| 'lg' \| 'xl' \| '2xl' \| 'pill' \| 'full'` | `undefined` | Arrondi des angles selon les tokens du thème. |
| `thumbnail` | `boolean` | `false` | Ajoute une bordure, un padding interne et une légère ombre façon vignette. |
| *Attributs HTML* | `src`, `alt`, `loading`, etc. | - | Hérite de tous les attributs natifs d'une balise `<img>`. |

### Exemples d'utilisation

#### Image fluide avec ratio et cadrage

```tsx
import { Image } from '@/ui/components';

export const CoverImage = () => {
  return (
    <Image
      src="/uploads/article-cover.jpg"
      alt="Bannière de l'article"
      aspectRatio="16/9"
      fit="cover"
      radius="lg"
    />
  );
};
```

#### Vignette (Thumbnail) carrée

```tsx
<Image
  src="/uploads/thumbnail.jpg"
  alt="Aperçu média"
  thumbnail
  aspectRatio="1/1"
  fit="cover"
  width={120}
/>
```

---

## 2. Video

Lecteur vidéo HTML5 encapsulé. Il active les contrôles natifs (`controls`) par défaut, gère le redimensionnement fluide et fournit un message d'accessibilité avec lien de téléchargement direct si le navigateur ne prend pas en charge la balise.

### Props principales

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string` | `undefined` | URL directe du fichier vidéo. |
| `sources` | `VideoSource[]` | `[]` | Liste de sources multiples avec format (`{ src: string, type?: string }`). |
| `controls` | `boolean` | `true` | Affiche ou masque la barre de contrôle native du navigateur. |
| `fluid` | `boolean` | `true` | Occupe 100% de la largeur du parent tout en conservant ses proportions. |
| `fit` | `'cover' \| 'contain' \| 'fill' \| 'none' \| 'scale-down'` | `undefined` | Comportement CSS `object-fit`. |
| `aspectRatio` | `string` | `undefined` | Ratio d'aspect forcé (ex: `'16/9'`). |
| `radius` | `'sm' \| 'base' \| 'lg' \| 'xl' \| '2xl' \| 'pill' \| 'full'` | `undefined` | Arrondi des angles issu du thème. |
| `fallbackUrl` | `string` | `undefined` | URL alternative pour le lien de téléchargement (prend `src` par défaut). |
| `fallbackText` | `React.ReactNode` | `undefined` | Remplace le texte par défaut affiché aux navigateurs non compatibles. |

### Exemples d'utilisation

#### Vidéo simple avec ratio 16/9 et coins arrondis

```tsx
import { Video } from '@/ui/components';

export const ArticleVideo = () => {
  return (
    <Video
      src="https://cdn.example.com/videos/demo.mp4"
      poster="/images/video-poster.jpg"
      aspectRatio="16/9"
      radius="base"
    />
  );
};
```

#### Vidéo multi-formats avec lecture automatique sans son

```tsx
<Video
  sources={[
    { src: '/videos/loop.webm', type: 'video/webm' },
    { src: '/videos/loop.mp4', type: 'video/mp4' },
  ]}
  autoPlay
  muted
  loop
  controls={false}
  radius="md"
/>
```

---

## 3. Figure

Balise sémantique `<figure>` conçue pour encapsuler des éléments graphiques (`Image`, `Video`, tableaux ou graphiques) accompagnés d'une légende textuelle (`<figcaption>`).

Il peut s'utiliser de deux façons :
1. **Via ses props intégrées** (`caption`, `captionPosition`, `captionAlign`).
2. **Via son sous-composant composé** (`Figure.Caption`).

### Props de `Figure`

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `caption` | `React.ReactNode` | `undefined` | Contenu textuel ou composant de légende. |
| `captionPosition` | `'top' \| 'bottom'` | `'bottom'` | Emplacement de la légende au-dessus ou en-dessous du média. |
| `captionAlign` | `'start' \| 'center' \| 'end'` | `'start'` | Alignement horizontal du texte de la légende. |

### Props de `Figure.Caption`

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `position` | `'top' \| 'bottom'` | `'bottom'` | Ajuste les marges hautes ou basses du texte. |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Alignement horizontal du texte (`text-align`). |

### Exemples d'utilisation

#### Approche déclarative (via props)

Idéale pour les blocs de contenu simples dans l'éditeur :

```tsx
import { Figure, Image } from '@/ui/components';

export const ImageBlockPreview = () => {
  return (
    <Figure
      caption="Fig 1. Vue d'ensemble de l'architecture Symfony & React."
      captionAlign="center"
      captionPosition="bottom"
    >
      <Image
        src="/uploads/archi-schema.png"
        alt="Schéma d'architecture"
        radius="base"
      />
    </Figure>
  );
};
```

#### Approche composée (via `Figure.Caption`)

Permet d'ajouter des liens ou une mise en forme riche dans la légende :

```tsx
import { Figure, Video, Link } from '@/ui/components';

export const VideoBlockWithRichCaption = () => {
  return (
    <Figure>
      <Video src="/videos/tutoriel.mp4" aspectRatio="16/9" radius="base" />
      <Figure.Caption align="start">
        Tutoriel d'introduction — Réalisé par l'équipe produit.{' '}
        <Link href="/credits">Voir les crédits</Link>
      </Figure.Caption>
    </Figure>
  );
};
```