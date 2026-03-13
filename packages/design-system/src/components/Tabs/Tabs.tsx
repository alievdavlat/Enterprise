import * as React from "react";

export interface TabItem {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className = "" }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(items[0]?.value ?? "");
  const current = value ?? internalValue;
  const setCurrent = onChange ?? setInternalValue;
  const activeTab = items.find((t) => t.value === current) ?? items[0];

  return (
    <div className={className}>
      <div className="border-b">
        <nav className="-mb-px flex gap-4">
          {items.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCurrent(tab.value)}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${current === tab.value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-4">{activeTab?.content}</div>
    </div>
  );
}
