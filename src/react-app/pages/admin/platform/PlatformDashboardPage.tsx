import { PlatformDashboardHeader } from "@/react-app/components/platform/dashboard/PlatformDashboardHeader";
import { PlatformNewStoresWeekChart } from "@/react-app/components/platform/dashboard/PlatformNewStoresWeekChart";
import { PlatformStatsGrid } from "@/react-app/components/platform/dashboard/PlatformStatsGrid";
import { usePlatformDashboard } from "@/react-app/hooks/platform/usePlatformDashboard";

const PlatformDashboardPage = () => {
  const dashboard = usePlatformDashboard();
  const busy = dashboard.isLoading || dashboard.isRefetching;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PlatformDashboardHeader busy={busy} onRefresh={() => void dashboard.refetch()} />
      <PlatformStatsGrid overview={dashboard.overview} ranking={dashboard.ranking} />
      <div className="max-w-3xl">
        <PlatformNewStoresWeekChart buckets={dashboard.weeklyBuckets} loading={dashboard.isLoading} />
      </div>
    </div>
  );
};

export default PlatformDashboardPage;
