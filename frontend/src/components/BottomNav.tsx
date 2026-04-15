import { C } from "../data/colors";

export type MainTab = "cpp" | "vehicles" | "drivers";

interface Props {
  active: MainTab;
  onChange: (t: MainTab) => void;
}

const TABS: { k: MainTab; l: string; i: string }[] = [
  { k: "cpp", l: "ЦПП", i: "📋" },
  { k: "vehicles", l: "ТС", i: "🚛" },
  { k: "drivers", l: "Водители", i: "👤" },
];

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 420,
        background: C.white,
        borderTop: `1px solid ${C.grayBorder}`,
        display: "flex",
        boxShadow: "0 -2px 10px rgba(0,0,0,.04)",
        zIndex: 20,
      }}
    >
      {TABS.map((t) => {
        const is = active === t.k;
        return (
          <button
            key={t.k}
            onClick={() => onChange(t.k)}
            style={{
              flex: 1,
              padding: "10px 0 12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              color: is ? C.primary : C.gray,
              fontWeight: is ? 700 : 500,
              fontSize: 11,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{t.i}</span>
            {t.l}
          </button>
        );
      })}
    </nav>
  );
}
