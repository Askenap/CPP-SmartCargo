import { C } from "../data/colors";

interface Props {
  name: string;
  onClose: () => void;
}

export function ScanModal({ name, onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 16,
          padding: 20,
          width: "100%",
          maxWidth: 380,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "none",
              background: C.grayLight,
              cursor: "pointer",
              fontSize: 14,
              color: C.textSec,
            }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            background: C.grayLight,
            borderRadius: 12,
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.gray,
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 40 }}>📄</span>
          Скан документа
        </div>
      </div>
    </div>
  );
}
