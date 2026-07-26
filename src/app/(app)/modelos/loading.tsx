import {
  CardGridSkeleton,
  PageHeaderSkeleton,
} from "@/components/shared/page-skeleton";

export default function TemplatesLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={6} />
    </div>
  );
}
