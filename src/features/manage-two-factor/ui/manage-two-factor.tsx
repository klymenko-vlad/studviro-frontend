'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { apiQueries, type TwoFactorSetupDto } from '@/shared/api';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  QueryError,
  Skeleton,
} from '@/shared/ui';

import { LOW_RECOVERY_CODES, twoFactorQueries } from '../model/two-factor';
import { ConfirmPassword } from './confirm-password';
import { PairAuthenticator } from './pair-authenticator';
import { RecoveryCodes } from './recovery-codes';

type Mode =
  | { kind: 'idle' }
  | { kind: 'start' }
  | { kind: 'pair'; setup: TwoFactorSetupDto }
  | { kind: 'codes'; codes: string[] }
  | { kind: 'regenerate' }
  | { kind: 'disable' };

const IDLE: Mode = { kind: 'idle' };

export function ManageTwoFactor() {
  const t = useTranslations('accountSettings.twoFactor');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const status = useQuery(twoFactorQueries.status());
  const [mode, setMode] = useState<Mode>(IDLE);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: twoFactorQueries.statusKey() });
  const cancel = () => {
    setMode(IDLE);
  };

  const begin = useMutation(apiQueries.beginTwoFactorSetupMutation());
  const regenerate = useMutation(apiQueries.regenerateRecoveryCodesMutation());
  const disable = useMutation(apiQueries.disableTwoFactorMutation());

  const body = () => {
    switch (mode.kind) {
      case 'start': {
        return (
          <ConfirmPassword
            prompt={t('startPrompt')}
            submitLabel={t('continue')}
            pending={begin.isPending}
            onCancel={cancel}
            onConfirm={async currentPassword => {
              const setup = await begin.mutateAsync({ body: { currentPassword } });
              setMode({ kind: 'pair', setup });
            }}
          />
        );
      }
      case 'pair': {
        return (
          <PairAuthenticator
            setup={mode.setup}
            onCancel={cancel}
            onEnabled={codes => {
              toast.success(t('enabled'));
              setMode({ kind: 'codes', codes });
              void refresh();
            }}
          />
        );
      }
      case 'codes': {
        return <RecoveryCodes codes={mode.codes} onDone={cancel} />;
      }
      case 'regenerate': {
        return (
          <ConfirmPassword
            prompt={t('regeneratePrompt')}
            submitLabel={t('regenerate')}
            pending={regenerate.isPending}
            onCancel={cancel}
            onConfirm={async currentPassword => {
              const { recoveryCodes } = await regenerate.mutateAsync({
                body: { currentPassword },
              });
              setMode({ kind: 'codes', codes: recoveryCodes });
              void refresh();
            }}
          />
        );
      }
      case 'disable': {
        return (
          <ConfirmPassword
            prompt={t('disablePrompt')}
            submitLabel={t('disable')}
            destructive
            pending={disable.isPending}
            onCancel={cancel}
            onConfirm={async currentPassword => {
              await disable.mutateAsync({ body: { currentPassword } });
              toast.success(t('disabled'));
              setMode(IDLE);
              void refresh();
            }}
          />
        );
      }
      case 'idle': {
        return summary();
      }
    }
  };

  const summary = () => {
    if (status.isPending) return <Skeleton className="h-16 w-full" />;
    if (status.isError) {
      return (
        <QueryError
          title={t('errorTitle')}
          onRetry={() => {
            void status.refetch();
          }}
        />
      );
    }

    if (!status.data.enabled) {
      return (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted-foreground text-sm">{t('offDescription')}</p>
          <Button
            type="button"
            onClick={() => {
              setMode({ kind: 'start' });
            }}
          >
            {t('setUp')}
          </Button>
        </div>
      );
    }

    const remaining = status.data.recoveryCodesRemaining;

    return (
      <div className="flex flex-col items-start gap-4">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 font-medium">
            <ShieldCheck aria-hidden className="text-success size-5" />
            {status.data.enabledAt
              ? t('onSince', {
                  date: format.dateTime(new Date(status.data.enabledAt), {
                    dateStyle: 'medium',
                  }),
                })
              : t('on')}
          </span>
          <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            {t('codesRemaining', { count: remaining })}
            {remaining <= LOW_RECOVERY_CODES ? (
              <Badge variant="warning">{t('codesLow')}</Badge>
            ) : null}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setMode({ kind: 'regenerate' });
            }}
          >
            {t('regenerate')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setMode({ kind: 'disable' });
            }}
          >
            {t('disable')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>{body()}</CardContent>
    </Card>
  );
}
