import { Skeleton } from "@/components/ui/skeleton";

export default function TokenLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <Skeleton className="size-[180px] shrink-0 rounded-md" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-3 gap-3 pt-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
      </div>
      <Skeleton className="mt-8 h-28 w-full" />
      <Skeleton className="mt-6 h-64 w-full" />
    </div>
  );
}
