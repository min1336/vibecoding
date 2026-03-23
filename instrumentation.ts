export async function register() {
  // Next.js dev server가 --localstorage-file 플래그로 Node.js를 시작하면
  // 깨진 localStorage 전역 객체가 생성됨. Supabase SDK가 이를 감지하고
  // 사용하려 하지만 getItem이 동작하지 않아 에러 발생.
  // 서버 환경에서 localStorage를 올바른 no-op 구현으로 교체.
  if (typeof globalThis.localStorage !== "undefined") {
    const storage: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
      get length() { return Object.keys(storage).length; },
      key: (index: number) => Object.keys(storage)[index] ?? null,
    } as Storage;
  }
}
