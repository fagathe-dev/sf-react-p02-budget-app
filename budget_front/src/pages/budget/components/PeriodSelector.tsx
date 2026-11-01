import { PeriodString } from '@/types/budget.types';
import { Button, Flex, Icon, IconButton, Input, Text, Tooltip } from '@/ui/components';
import { formatPeriodLabel, isValidPeriod } from '@/utils/budget';
import React from 'react';

export interface PeriodSelectorProps {
  period: PeriodString;
  isCurrentPeriod?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onResetToday?: () => void;
  onChangePeriod?: (period: PeriodString) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  period,
  isCurrentPeriod = true,
  onPrevious,
  onNext,
  onResetToday,
  onChangePeriod,
}) => {
  return (
    <Flex align="center" gap="0.5rem" wrap="wrap">
      <Tooltip content="Mois précédent" placement="top">
        <IconButton
          name="chevron-left"
          variant="outline"
          size="sm"
          aria-label="Mois précédent"
          onClick={onPrevious}
        />
      </Tooltip>

      <Flex align="center" gap="0.5rem">
        <Icon name="calendar-month-outline" size={18} />
        <Text weight="semibold" size="base">
          {formatPeriodLabel(period)}
        </Text>
      </Flex>

      {onChangePeriod && (
        <Input
          type="text"
          placeholder="AAAA-MM"
          aria-label="Sélectionner un mois (AAAA-MM)"
          defaultValue={period}
          key={period}
          style={{ width: '110px' }}
          onChange={(e) => {
            const next = e.target.value.trim();
            if (isValidPeriod(next)) {
              onChangePeriod(next);
            }
          }}
        />
      )}

      <Tooltip content="Mois suivant" placement="top">
        <IconButton
          name="chevron-right"
          variant="outline"
          size="sm"
          aria-label="Mois suivant"
          onClick={onNext}
        />
      </Tooltip>

      {!isCurrentPeriod && onResetToday && (
        <Button variant="ghost" size="sm" onClick={onResetToday}>
          Aujourd'hui
        </Button>
      )}
    </Flex>
  );
};
