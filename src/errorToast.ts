import { Capacitor } from '@capacitor/core';
import { Toast } from '@capacitor/toast';

export async function errorToast(err: unknown): Promise<void> {
  console.error(err);
  if (Capacitor.isNativePlatform()) {
    const text =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'An error occurred';
    await Toast.show({ text, duration: 'long' });
  }
}
