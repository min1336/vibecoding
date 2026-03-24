import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-4xl mb-4 text-zinc-600 font-mono">404</div>
      <h2 className="text-xl font-semibold text-zinc-300 mb-2">
        페이지를 찾을 수 없어요
      </h2>
      <p className="text-zinc-500 mb-6">
        요청하신 페이지가 존재하지 않거나 삭제되었을 수 있습니다
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
