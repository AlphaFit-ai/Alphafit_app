import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Screen } from './Screen';
import { Skeleton, SkeletonGroup } from './Skeleton';

/** What a wizard step looks like before its saved answers arrive: a heading and three answers. */
export const WizardSkeleton: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Screen>
      <SkeletonGroup label={t('common.loading')} style={styles.group}>
        <Skeleton width="70%" height={32} />
        <Skeleton height={56} radius={12} />
        <Skeleton height={56} radius={12} />
        <Skeleton height={56} radius={12} />
      </SkeletonGroup>
    </Screen>
  );
};

const styles = StyleSheet.create({ group: { paddingTop: 32, gap: 16 } });
