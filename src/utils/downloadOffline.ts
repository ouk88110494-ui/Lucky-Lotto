/**
 * Robust helper to download the standalone single-file offline HTML
 * Supports Blob Object URL for iframe compatibility and fallback to direct download.
 */
export async function downloadOfflineHtmlFile(): Promise<boolean> {
  const fileName = '幸運抽獎機_離網單機版.html';
  try {
    const response = await fetch(`/${fileName}?t=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const htmlText = await response.text();
    const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);
    return true;
  } catch {
    // Fallback: direct anchor trigger
    const link = document.createElement('a');
    link.href = `/${fileName}`;
    link.download = fileName;
    link.target = '_blank';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return false;
  }
}
