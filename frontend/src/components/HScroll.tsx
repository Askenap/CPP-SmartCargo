import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { C } from "../data/colors";

interface ArrProps {
  dir: -1 | 1;
  show: boolean;
  onClick: () => void;
}

function Arr({ dir, show, onClick }: ArrProps) {
  if (!show) return null;
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top: "50%",
        [dir < 0 ? "left" : "right"]: -2,
        transform: "translateY(-50%)",
        zIndex: 2,
        width: 24,
        height: 24,
        borderRadius: "50%",
        border: `1px solid ${C.grayBorder}`,
        background: C.white,
        cursor: "pointer",
        fontSize: 12,
        color: C.textSec,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,.1)",
      }}
    >
      {dir < 0 ? "‹" : "›"}
    </button>
  );
}

export function HScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    check();
  });

  const scroll = (d: -1 | 1) => {
    ref.current?.scrollBy({ left: d * 120, behavior: "smooth" });
    setTimeout(check, 300);
  };

  return (
    <div style={{ position: "relative" }}>
      <Arr dir={-1} show={canL} onClick={() => scroll(-1)} />
      <div
        ref={ref}
        onScroll={check}
        style={{
          display: "flex",
          gap: 5,
          overflowX: "auto",
          paddingBottom: 4,
          scrollbarWidth: "none",
        }}
      >
        {children}
      </div>
      <Arr dir={1} show={canR} onClick={() => scroll(1)} />
      {canR && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 4,
            width: 28,
            background: "linear-gradient(90deg,transparent,rgba(255,255,255,.9))",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
}
