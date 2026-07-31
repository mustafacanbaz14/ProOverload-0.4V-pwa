import { useEffect, useState } from 'react';
import { applyPendingAppUpdate, hasPendingAppUpdate } from '../pwaUpdate.js';

export const useDeferredPwaUpdate = (activeWorkout, showToast) => {
  const [updateReady, setUpdateReady] = useState(hasPendingAppUpdate);

  useEffect(() => {
    const onReady = () => {
      setUpdateReady(true);
      showToast('Yeni sürüm hazır — antrenman bitince otomatik uygulanacak.');
    };
    window.addEventListener('po-update-ready', onReady);
    return () => window.removeEventListener('po-update-ready', onReady);
  }, [showToast]);

  useEffect(() => {
    if (!updateReady || activeWorkout) return;
    applyPendingAppUpdate();
  }, [updateReady, activeWorkout]);

  return updateReady;
};
