type OrderConfirmationBannersProps = {
  successMessage: string | null;
  noticeMessage: string | null;
};

export function OrderConfirmationBanners({ successMessage, noticeMessage }: OrderConfirmationBannersProps) {
  return (
    <>
      {successMessage ? (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
          {successMessage}
        </div>
      ) : null}
      {noticeMessage ? (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          {noticeMessage}
        </div>
      ) : null}
    </>
  );
}
