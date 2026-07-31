let pendingApply = null;

export const deferAppUpdate = (apply) => {
  pendingApply = typeof apply === 'function' ? apply : null;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('po-update-ready'));
};

export const hasPendingAppUpdate = () => Boolean(pendingApply);

export const applyPendingAppUpdate = () => {
  const apply = pendingApply;
  pendingApply = null;
  apply?.();
};
