import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function ProjectCard({ project }: { project: Project }) {
  const profile = project.profiles;

  return (
    <Link href={`/project/${project.id}`} className="group block break-inside-avoid mb-4">
      <Card className="overflow-hidden transition-all duration-300 hover:ring-2 hover:ring-primary/20 hover:shadow-lg hover:shadow-primary/5 py-0 gap-0">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={project.screenshot_url}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold truncate">{project.title}</h3>
          <div className="mt-2 flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={profile?.avatar_url || undefined} alt="" />
              <AvatarFallback className="text-[10px]">
                {profile?.display_name?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {profile?.display_name || "Anonymous"}
            </span>
            {project.tool_used && (
              <>
                <span className="text-muted-foreground/50">&middot;</span>
                <Badge variant="secondary">{project.tool_used}</Badge>
              </>
            )}
            <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span title="Likes">{project.likes_count ?? 0}</span>
              <span title="Views">{project.views_count ?? 0}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
