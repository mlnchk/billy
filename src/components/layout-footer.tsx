import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

interface LayoutFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function LayoutFooter({ className, children }: PropsWithChildren<LayoutFooterProps>) {
  return (
    <>
      <div className="h-20" aria-hidden="true" />
      <footer
        className={cn(
          "fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-white border-t",
          className,
        )}
      >
        {children}
      </footer>
    </>
  );
}
