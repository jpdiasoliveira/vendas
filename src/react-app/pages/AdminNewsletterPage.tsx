import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { downloadAdminNewsletterSubscribersCsv } from "@/react-app/services/api";
import {
  NEWSLETTER_ADMIN_PAGE_SIZE,
  useAdminNewsletterSubscribersQuery,
} from "@/react-app/hooks/useAdminNewsletterSubscribersQuery";
import { NewsletterPageHeader } from "@/react-app/components/admin/newsletter/NewsletterPageHeader";
import { NewsletterSubscribersPanel } from "@/react-app/components/admin/newsletter/NewsletterSubscribersPanel";

const AdminNewsletterPage = () => {
  const [page, setPage] = useState(0);
  const listQuery = useAdminNewsletterSubscribersQuery({ page });
  const exportMutation = useMutation({
    mutationFn: downloadAdminNewsletterSubscribersCsv,
  });

  const data = listQuery.data;
  const loading = listQuery.isPending && listQuery.data === undefined;
  const loadError =
    listQuery.isError && listQuery.error instanceof Error
      ? listQuery.error.message
      : listQuery.isError
        ? String(listQuery.error)
        : null;
  const refetching = listQuery.isFetching && listQuery.data !== undefined;

  return (
    <>
      <NewsletterPageHeader
        exporting={exportMutation.isPending}
        total={data?.total ?? 0}
        refetching={refetching}
        loading={loading}
        onExport={() => void exportMutation.mutate()}
        onRefresh={() => void listQuery.refetch()}
      />

      <div className="w-full min-w-0">
        <div className="rounded-3xl border border-brand-primary/10 bg-surface-elevated p-5 shadow-sm sm:p-8">
          {loadError ? (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {loadError}
            </div>
          ) : null}
          {exportMutation.isError ? (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {exportMutation.error instanceof Error ? exportMutation.error.message : "Erro ao exportar"}
            </div>
          ) : null}

          <NewsletterSubscribersPanel
            loading={loading}
            items={data?.items ?? []}
            total={data?.total ?? 0}
            page={page}
            pageSize={NEWSLETTER_ADMIN_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </>
  );
};

export default AdminNewsletterPage;
