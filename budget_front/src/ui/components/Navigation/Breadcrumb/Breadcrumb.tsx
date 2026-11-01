import { Icon } from '@/ui/components/Base/Icon';
import React from 'react';
import styled from 'styled-components';
import { BreadcrumbContainer } from './BreadcrumbContainer';
import { BreadcrumbItem } from './BreadcrumbItem';

const Separator = styled.li`
  display: inline-flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.text.muted};
  opacity: 0.6;
  user-select: none;
`;

export interface BreadcrumbEntry {
  label: React.ReactNode;
  to?: string;
  onClick?: () => void;
  icon?: string;
  active?: boolean;
}

export interface BreadcrumbProps {
  items?: BreadcrumbEntry[];
  separatorIcon?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  separatorIcon = 'chevron-right',
  children,
  className,
}) => {
  const elements = items
    ? items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <BreadcrumbItem key={idx} to={item.to} onClick={item.onClick} icon={item.icon} active={item.active ?? isLast}>
            {item.label}
          </BreadcrumbItem>
        );
      })
    : React.Children.toArray(children);

  return (
    <BreadcrumbContainer className={className}>
      {elements.map((el, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <Separator aria-hidden="true">
              <Icon name={separatorIcon} size={15} />
            </Separator>
          )}
          {el}
        </React.Fragment>
      ))}
    </BreadcrumbContainer>
  );
};
