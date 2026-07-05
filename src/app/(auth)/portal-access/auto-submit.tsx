"use client";

import { useEffect, useRef } from "react";

export function AutoSubmitMagicLink() {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.form?.requestSubmit();
  }, []);

  return <input ref={ref} type="hidden" name="_autosubmit" value="1" />;
}
