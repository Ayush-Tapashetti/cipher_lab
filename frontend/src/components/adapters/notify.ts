import { toast } from 'sonner';

/** Toasts for copy and export confirmations only (Sonner, wrapped so pages never import it directly). */
export function notify(message: string): void {
  toast.success(message);
}

export function notifyError(message: string): void {
  toast.error(message);
}

/** Copies text and confirms with a toast. Falls back to an error toast if the clipboard is blocked. */
export async function copyToClipboard(text: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    notify(`${label} copied`);
  } catch {
    notifyError('Could not copy: the browser blocked clipboard access');
  }
}
