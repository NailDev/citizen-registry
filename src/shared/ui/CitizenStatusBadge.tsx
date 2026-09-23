import { optionLabel, STATUS_OPTIONS, type CitizenStatus } from '@/domain/dictionaries';
import { Badge, type BadgeTone } from './Badge';

const TONES: Record<CitizenStatus, BadgeTone> = {
  active: 'ok',
  pending: 'warn',
  archived: 'neutral',
  blocked: 'danger',
};

export function CitizenStatusBadge({ status }: { status: CitizenStatus }) {
  return <Badge tone={TONES[status]}>{optionLabel(STATUS_OPTIONS, status)}</Badge>;
}
