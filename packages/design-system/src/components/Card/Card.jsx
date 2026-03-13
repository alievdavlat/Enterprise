import * as React from "react";
export function Card({ children, className = "", ...rest }) {
    return (<div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...rest}>
      {children}
    </div>);
}
export function CardHeader({ children, className = "", ...rest }) {
    return (<div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...rest}>
      {children}
    </div>);
}
export function CardTitle({ children, className = "", ...rest }) {
    return (<h3 className={`font-semibold leading-none tracking-tight ${className}`} {...rest}>
      {children}
    </h3>);
}
export function CardDescription({ children, className = "", ...rest }) {
    return (<p className={`text-sm text-muted-foreground ${className}`} {...rest}>
      {children}
    </p>);
}
export function CardContent({ children, className = "", ...rest }) {
    return (<div className={`p-6 pt-0 ${className}`} {...rest}>
      {children}
    </div>);
}
export function CardFooter({ children, className = "", ...rest }) {
    return (<div className={`flex items-center p-6 pt-0 ${className}`} {...rest}>
      {children}
    </div>);
}
//# sourceMappingURL=Card.jsx.map