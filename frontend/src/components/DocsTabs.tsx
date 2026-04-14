import { C } from "../data/colors";
import { cargoDocs, driverDocs } from "../data/mockData";
import { DocRow } from "./DocRow";
import type { TabKey } from "./TabBar";

interface Props {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  setVd: (name: string | null) => void;
}

export function DocsTabs({ tab, setVd }: Props) {
  if (tab === "cargo")
    return (
      <div style={{ background: C.white, borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Груз</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { l: "Вес", v: "18 500 кг" },
            { l: "Мест", v: 43 },
            { l: "Кол-во", v: 1 },
            { l: "Стоимость", v: "$98 000" },
          ].map((c) => (
            <div key={c.l}>
              <div
                style={{
                  fontSize: 10,
                  color: C.gray,
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                {c.l}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{c.v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  if (tab === "docs")
    return (
      <>
        <div
          style={{
            background: C.white,
            borderRadius: 14,
            padding: 14,
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>🚛 Водитель и ТС</div>
          {driverDocs.map((d, i) => (
            <DocRow key={i} doc={d} onView={setVd} />
          ))}
        </div>
        <div style={{ background: C.white, borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📦 Груз</div>
          {cargoDocs.map((d, i) => (
            <DocRow key={i} doc={d} onView={setVd} />
          ))}
        </div>
      </>
    );
  return null;
}
