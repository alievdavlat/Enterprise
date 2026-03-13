import * as React from "react";
export function Breadcrumb({ items, className = "" }) {
    return (<nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {items.map((item, i) => (<li key={i} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            {item.href ? (<a href={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </a>) : (<span className="text-foreground font-medium">{item.label}</span>)}
          </li>))}
      </ol>
    </nav>);
}
//# sourceMappingURL=Breadcrumb.jsx.map