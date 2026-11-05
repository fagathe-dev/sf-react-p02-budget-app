/**
 * UI Kit de l'app : celui de core-react (`core-react/ui`, doc dans node_modules/core-react/docs/).
 *
 * Les pages passent encore les anciens noms de props (`variant`, `size`…) : les composants concernés
 * sont enveloppés par `withLegacyProps`, qui les traduit en props `$`. Les deux écritures sont acceptées ;
 * le nouveau code utilise directement les props `$`.
 */
import { withLegacyProps } from 'core-react/compat';
import {
  Badge as CoreBadge,
  Button as CoreButton,
  Card as CoreCard,
  Col as CoreCol,
  Columns as CoreColumns,
  Container as CoreContainer,
  Display as CoreDisplay,
  Divider as CoreDivider,
  Flex as CoreFlex,
  Gallery as CoreGallery,
  GalleryItem as CoreGalleryItem,
  Grid as CoreGrid,
  HelperText as CoreHelperText,
  Image as CoreImage,
  Label as CoreLabel,
  ListGroup as CoreListGroup,
  ListGroupItem as CoreListGroupItem,
  NavbarLink as CoreNavbarLink,
  Row as CoreRow,
  Skeleton as CoreSkeleton,
  Table as CoreTable,
  Td as CoreTd,
  Text as CoreText,
  Th as CoreTh,
  Title as CoreTitle,
  TRow as CoreTRow,
} from 'core-react/ui';

export * from 'core-react/ui';

export const Badge = withLegacyProps(CoreBadge, { variant: '$variant', pill: '$pill', color: '$color' });
export const Button = withLegacyProps(CoreButton, { variant: '$variant', size: '$size', fullWidth: '$fullWidth', loading: '$loading' });
export const Divider = withLegacyProps(CoreDivider, { orientation: '$orientation', margin: '$margin' });

export const CardBase = withLegacyProps(CoreCard, { bordered: '$bordered', elevation: '$elevation' });
export const Card = Object.assign(CardBase, { Header: CoreCard.Header, Body: CoreCard.Body, Footer: CoreCard.Footer, Title: CoreCard.Title });

export const ListGroupItem = withLegacyProps(CoreListGroupItem, { action: '$action', active: '$active' });
export const ListGroup = Object.assign(withLegacyProps(CoreListGroup, { flush: '$flush' }), { Item: ListGroupItem });

export const Table = withLegacyProps(CoreTable, { bordered: '$bordered', dense: '$dense', hoverable: '$hoverable', striped: '$striped' });
export const TRow = withLegacyProps(CoreTRow, { selected: '$selected' });
export const Th = withLegacyProps(CoreTh, { width: '$width', align: '$align' });
export const Td = withLegacyProps(CoreTd, { width: '$width', align: '$align' });

export const GalleryItem = withLegacyProps(CoreGalleryItem, { hoverZoom: '$hoverZoom', radius: '$radius' });
export const Gallery = Object.assign(
  withLegacyProps(CoreGallery, { columns: '$columns', gap: '$gap', minColumnWidth: '$minColumnWidth', rule: '$rule' }),
  { Item: GalleryItem },
);
export const Image = withLegacyProps(CoreImage, { aspectRatio: '$aspectRatio', fit: '$fit', fluid: '$fluid', radius: '$radius', thumbnail: '$thumbnail' });

export const Skeleton = withLegacyProps(CoreSkeleton, { variant: '$variant', width: '$width', height: '$height' });
export const HelperText = withLegacyProps(CoreHelperText, { state: '$state' });
export const Label = withLegacyProps(CoreLabel, { required: '$required' });

export const Col = withLegacyProps(CoreCol, { span: '$span', sm: '$sm', md: '$md', lg: '$lg', xl: '$xl', offset: '$offset' });
export const Columns = withLegacyProps(CoreColumns, { count: '$count', gap: '$gap', rule: '$rule', width: '$width' });
export const Container = withLegacyProps(CoreContainer, { fluid: '$fluid' });
export const Flex = withLegacyProps(CoreFlex, { direction: '$direction', gap: '$gap', justify: '$justify', align: '$align', wrap: '$wrap', inline: '$inline' });
export const Grid = withLegacyProps(CoreGrid, {
  columns: '$columns',
  rows: '$rows',
  gap: '$gap',
  columnGap: '$columnGap',
  rowGap: '$rowGap',
  alignItems: '$alignItems',
  justifyItems: '$justifyItems',
});
export const Row = withLegacyProps(CoreRow, { gutter: '$gutter' });

export const NavbarLink = withLegacyProps(CoreNavbarLink, { active: '$active' });

export const Display = withLegacyProps(CoreDisplay, { level: '$level' });
export const Text = withLegacyProps(CoreText, { size: '$size', weight: '$weight', align: '$align', color: '$color' });
export const Title = withLegacyProps(CoreTitle, { align: '$align', color: '$color' });
