import { useLayoutEffect, useState } from "react";

const DEFAULT_HEADER_HEIGHT = 101;

export const useHeaderOffset = () => {
  const [offset, setOffset] = useState(DEFAULT_HEADER_HEIGHT);

  useLayoutEffect(() => {
    const header = document.querySelector(".header-content-outer");
    if (!header) {
      return undefined;
    }

    const updateOffset = () => {
      const rect = header.getBoundingClientRect();
      setOffset(rect.bottom || DEFAULT_HEADER_HEIGHT);
    };

    updateOffset();

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(updateOffset)
      : null;

    if (resizeObserver) {
      resizeObserver.observe(header);
    }

    window.addEventListener("resize", updateOffset);

    return () => {
      window.removeEventListener("resize", updateOffset);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return offset;
};
