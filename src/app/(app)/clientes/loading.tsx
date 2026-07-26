import {
  ListSkeleton,
  PageHeaderSkeleton,
} from "@/components/shared/page-skeleton";

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <ListSkeleton />
    </div>
  );
}
