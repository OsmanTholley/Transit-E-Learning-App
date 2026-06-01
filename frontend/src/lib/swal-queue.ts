"use client";

type AlertJob = () => void | Promise<void>;

const queue: AlertJob[] = [];
let ready = false;

/** Called from SwalProvider after the client tree has mounted. */
export function markSwalReady() {
  if (ready) return;
  ready = true;
  const jobs = queue.splice(0);
  for (const job of jobs) {
    window.setTimeout(() => {
      void job();
    }, 0);
  }
}

/** Run SweetAlert only after mount (avoids React state-update-during-render warnings). */
export function enqueueAlert<T>(job: () => T | Promise<T>): Promise<T> {
  if (typeof window === "undefined") {
    return Promise.resolve(undefined as T);
  }

  return new Promise<T>((resolve, reject) => {
    const run = async () => {
      try {
        resolve(await job());
      } catch (error) {
        reject(error);
      }
    };

    if (ready) {
      window.setTimeout(() => {
        void run();
      }, 0);
      return;
    }

    queue.push(() => {
      void run();
    });
  });
}

export function deferCallback(callback: () => void) {
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    callback();
  }, 0);
}
