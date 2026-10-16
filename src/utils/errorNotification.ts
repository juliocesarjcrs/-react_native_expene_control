// src/utils/errorNotification.ts
const notified = new WeakSet<object>();

export const markNotified = (error: unknown): void => {
  if (typeof error === 'object' && error !== null) notified.add(error);
};

export const wasNotified = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && notified.has(error);
