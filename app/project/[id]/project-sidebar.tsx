import Link from "next/link";
import type { Project } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function ProjectSidebar({ project }: { project: Project }) {
  return (
    <div className="space-y-4 w-full lg:w-72 flex-shrink-0">
      <Card>
        <CardContent>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Creator</p>
          <Link href={`/profile/${project.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Avatar className="h-10 w-10">
              <AvatarImage src={project.profiles?.avatar_url || undefined} alt="" />
              <AvatarFallback>{project.profiles?.display_name?.[0]?.toUpperCase() || "A"}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{project.profiles?.display_name || "Anonymous"}</span>
          </Link>
        </CardContent>
      </Card>

      {project.tool_used && (
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Tool</p>
            <p className="text-sm">{project.tool_used}</p>
          </CardContent>
        </Card>
      )}

      {project.tags && project.tags.length > 0 && (
        <Card>
          <CardContent>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Stats</p>
          <div className="flex gap-6">
            <div>
              <p className="text-lg font-semibold">{project.likes_count ?? 0}</p>
              <p className="text-xs text-muted-foreground">Likes</p>
            </div>
            <div>
              <p className="text-lg font-semibold">{project.views_count ?? 0}</p>
              <p className="text-xs text-muted-foreground">Views</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Published</p>
          <p className="text-sm">{new Date(project.created_at).toLocaleDateString("ko-KR")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
