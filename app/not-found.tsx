import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-4xl mb-4 text-muted-foreground font-mono">404</div>
      <h2 className="text-xl font-semibold mb-2">페이지를 찾을 수 없어요</h2>
      <p className="text-muted-foreground mb-6">
        요청하신 페이지가 존재하지 않거나 삭제되었을 수 있습니다
      </p>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
