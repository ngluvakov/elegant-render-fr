"use client";

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  useQuickInquiry,
} from "@/components/inquiry/quick-inquiry-provider";
import type { InquiryFormSource } from "@/components/inquiry/project-inquiry-form";
import { cn } from "@/lib/utils";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  VariantProps<typeof buttonVariants> & {
    children: ReactNode;
    href?: string;
    inquiry?: InquiryFormSource;
    onOpen?: () => void;
  };

export function QuickInquiryLink({
  children,
  className,
  variant,
  size,
  href = "/kontakt",
  inquiry,
  onClick,
  onOpen,
  ...props
}: Props) {
  const pathname = usePathname();
  const { openInquiry } = useQuickInquiry();
  const styledAsButton = Boolean(variant || size);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    onOpen?.();
    openInquiry({
      ...inquiry,
      sourcePath: inquiry?.sourcePath ?? pathname,
    });
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        styledAsButton ? buttonVariants({ variant, size }) : undefined,
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}
