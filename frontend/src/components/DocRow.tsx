import { C } from "../data/colors";
import type { DocumentItem } from "../types";

interface Props {
  doc: DocumentItem;
  onView: (name: string) => void;
}

export function DocRow({ doc, onView }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: `1px solid ${C.grayLight}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12.5,
            color: C.text,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {doc.name}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 20,
            background: doc.valid ? C.greenBg : C.redBg,
            color: doc.valid ? C.green : C.red,
          }}
        >
          {doc.valid ? "✓" : "✕"}
        </span>
        {doc.scan && (
          <button
            onClick={() => onView(doc.name)}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              border: `1px solid ${C.grayBorder}`,
              background: C.white,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: C.primary,
            }}
          >
            👁
          </button>
        )}
      </div>
    </div>
  );
}
