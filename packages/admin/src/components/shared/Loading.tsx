import React from "react";

export const Loading = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="p-8 flex flex-col items-center justify-center gap-4 h-full animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 animate-pulse" />
      <p className="font-semibold text-muted-foreground animate-pulse">
        {message}
      </p>
    </div>
  );
};
