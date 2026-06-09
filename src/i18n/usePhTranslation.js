import { usePhotographerStore } from '../store/usePhotographerStore';
import { t } from './messages';

/** Translation hook for the photographer module — reads language from usePhotographerStore */
export function usePhTranslation() {
  const language = usePhotographerStore((s) => s.language);
  return {
    language,
    t: (key, vars) => {
      let str = t(language, key);
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, v);
        });
      }
      return str;
    },
  };
}
