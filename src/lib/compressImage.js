const MAX_REF_IMAGES = 4;

export { MAX_REF_IMAGES };

// maxDim: 800px is plenty for a phone lightbox (375px screen × 2x retina = 750px)
// maxChars: ~112KB binary — fast to load, looks great at any displayed size
export function compressImageFile(file, maxDim = 800, maxChars = 150000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        let q = 0.82;
        let data = canvas.toDataURL('image/jpeg', q);
        while (data.length > maxChars && q >= 0.4) {
          q -= 0.06;
          data = canvas.toDataURL('image/jpeg', q);
        }
        const baseName = (file.name || 'photo').replace(/\.[^.]+$/i, '');
        resolve({ data, name: `${baseName}.jpg`, w, h });
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
