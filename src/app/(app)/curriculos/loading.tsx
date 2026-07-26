import {
  ListSkeleton,
  PageHeaderSkeleton,
} from "@/components/shared/page-skeleton";

export default function ResumesLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton />
    </div>
  );
}
