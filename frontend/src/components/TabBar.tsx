import { C } from "../data/colors";
import { cargoDocs, driverDocs } from "../data/mockData";

export type TabKey = "status" | "cargo" | "docs";

interface Props {
  tab: TabKey;
  setTab: (t: TabKey) => void;
}

export function TabBar({ tab, setTab }: Props) {
  const md = [...driverDocs, ...cargoDocs].filter((x) => !x.valid).length;
  const items: { k: TabKey; l: string; b?: number }[] = [
    { k: "status", l: "Статусы" },
    { k: "cargo", l: "Груз" },
    { k: "docs", l: "Документы", b: md },
  ];
  return (
    <div
      style={{
        display: "flex",
        margin: "10px 12px 0",
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${C.grayBorder}`,
        background: C.white,
      }}
    >
      {items.map((t) => (
        <button
          key={t.k}
          onClick={() => setTab(t.k)}
          style={{
            flex: 1,
            padding: "9px 0",
            fontSize: 12,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: tab === t.k ? C.primary : C.white,
            color: tab === t.k ? C.white : C.textSec,
            fontFamily: "inherit",
          }}
        >
          {t.l}
          {t.b !== undefined && t.b > 0 && (
            <span
              style={{
                marginLeft: 3,
                fontSize: 9,
                fontWeight: 700,
                background: tab === t.k ? C.red : C.redBg,
                color: tab === t.k ? C.white : C.red,
                borderRadius: 10,
                padding: "1px 5px",
              }}
            >
              {t.b}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
