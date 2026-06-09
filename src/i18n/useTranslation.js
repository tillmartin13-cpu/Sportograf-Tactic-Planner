import { usePlannerStore } from '../store/usePlannerStore';
import { t } from './messages';

export function useTranslation() {
  const language = usePlannerStore((s) => s.language);
  return {
    language,
    t: (key) => t(language, key),
  };
}
