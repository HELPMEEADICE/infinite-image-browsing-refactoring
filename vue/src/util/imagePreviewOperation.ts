
// Active preview state for close management
let activePreviewRoot: HTMLElement | null = null

export const closeImageFullscreenPreview = () => {
  // Click the overlay to close if present
  const overlay = document.querySelector('.image-preview-overlay') as HTMLElement | null
  if (overlay) {
    overlay.click()
  }
  activePreviewRoot = null
};

export const openImageFullscreenPreview = (idx: number, root: HTMLElement) => {
  activePreviewRoot = root
  const el = root.querySelector(`.idx-${idx} .preview-img`) as HTMLImageElement | null
  if (el) {
    el.click()
  } else {
    console.log('openImageFullscreenPreview error: not found', idx, root);
  }
}
