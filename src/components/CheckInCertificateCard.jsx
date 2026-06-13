import { useEffect, useMemo, useState } from 'react';
import {
  certificateFilename,
  downloadCertificateBlob,
  generateCheckInCertificate,
  shareCertificateBlob,
} from '../lib/checkInCertificate';
import { usePlannerStore } from '../store/usePlannerStore';
import { useTranslation } from '../i18n/useTranslation';
import { t as translate } from '../i18n/messages';

const LOCALE_MAP = { en: 'en-GB', de: 'de-DE', es: 'es-ES', it: 'it-IT' };

export function CheckInCertificateCard({ event, photographer, cameraOk, cameraStatus, cameraImageUrl, cameraDetails, cameraString, checkedInAt, completedChecks = [], onClose, extraShareFile }) {
  const { t, language } = useTranslation();
  const showToast = usePlannerStore((s) => s.showToast);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const certLabels = useMemo(
    () => ({
      title: translate(language, 'checkInCertTitle'),
      subtitle: translate(language, 'checkInCertSubtitle'),
      event: translate(language, 'checkInCertEvent'),
      date: translate(language, 'checkInCertDate'),
      camera: translate(language, 'checkInCertCamera'),
      cameraOk: translate(language, 'checkInCertCameraOk'),
      cameraPending: translate(language, 'checkInCertCameraPending'),
      time: translate(language, 'checkInCertTime'),
      footer: translate(language, 'checkInCertFooter'),
    }),
    [language],
  );

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    (async () => {
      setLoading(true);
      try {
        const imageBlob = await generateCheckInCertificate({
          event,
          photographer,
          cameraOk,
          cameraStatus,
          cameraImageUrl,
          cameraDetails,
          cameraString,
          checkedInAt,
          completedChecks,
          locale: LOCALE_MAP[language] || 'en-GB',
          labels: certLabels,
        });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(imageBlob);
        setBlob(imageBlob);
        setPreviewUrl(objectUrl);
      } catch {
        if (!cancelled) setPreviewUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [event, photographer, cameraOk, cameraStatus, cameraImageUrl, cameraDetails, cameraString, checkedInAt, completedChecks, language, certLabels]);

  const filename = certificateFilename(event.id, photographer.code);

  const handleShare = async () => {
    if (!blob) return;
    setSharing(true);
    try {
      const shared = await shareCertificateBlob(blob, filename, t('checkInCertTitle'), extraShareFile);
      if (!shared) {
        downloadCertificateBlob(blob, filename);
        showToast(t('checkInCertDownloaded'));
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    if (!blob) return;
    downloadCertificateBlob(blob, filename);
    showToast(t('checkInCertDownloaded'));
  };

  return (
    <section className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-[#166534]">{t('checkInCertReady')}</h3>
          <p className="mt-1 text-xs text-[#4b7a5c]">{t('checkInCertShareHint')}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-[#6b9a7d] hover:bg-[#dcfce7]"
          >
            {t('close')}
          </button>
        )}
      </div>

      {loading && (
        <p className="mt-3 text-center text-xs font-semibold text-[#6b9a7d]">{t('checkInCertLoading')}</p>
      )}

      {!loading && previewUrl && (
        <>
          <img
            src={previewUrl}
            alt={t('checkInCertTitle')}
            className="mx-auto mt-3 w-full max-w-[320px] rounded-lg border border-[#bbf7d0] shadow-sm"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              disabled={sharing}
              className="flex-1 rounded-lg bg-[#166534] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#14532d] disabled:opacity-60"
            >
              {t('checkInCertShare')}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={sharing}
              className="rounded-lg border border-[#86efac] bg-white px-4 py-2.5 text-sm font-bold text-[#166534] hover:bg-[#f0fdf4] disabled:opacity-60"
            >
              {t('checkInCertDownload')}
            </button>
          </div>
        </>
      )}

      {!loading && !previewUrl && (
        <p className="mt-3 text-xs text-[#991b1b]">{t('checkInCertError')}</p>
      )}
    </section>
  );
}
