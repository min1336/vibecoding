"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-4">😵</div>
      <h2 className="text-xl font-semibold text-zinc-300 mb-2">
        문제가 발생했어요
      </h2>
      <p className="text-zinc-500 mb-6">잠시 후 다시 시도해주세요</p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
