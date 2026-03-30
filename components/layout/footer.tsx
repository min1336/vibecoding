import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-background py-8">
      <Separator />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 text-center text-sm text-muted-foreground">
        <p>VibeCoding &mdash; 바이브코딩 프로젝트를 공유하는 갤러리</p>
      </div>
    </footer>
  );
}
