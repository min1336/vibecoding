import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UploadForm } from "@/components/upload/upload-form";

export default async function UploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=required");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">프로젝트 업로드</h1>
        <p className="mt-2 text-zinc-400">
          바이브코딩으로 만든 프로젝트를 공유하세요
        </p>
      </div>
      <UploadForm />
    </div>
  );
}
