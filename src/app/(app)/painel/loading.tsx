import {
  CardGridSkeleton,
  PageHeaderSkeleton,
  StatRowSkeleton,
} from "@/components/shared/page-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <StatRowSkeleton />
      <CardGridSkeleton />
    </div>
  );
}
