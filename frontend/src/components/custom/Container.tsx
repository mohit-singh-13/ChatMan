import type React from "react";

type TContainerProps = {
  children: React.ReactNode;
  className?: string;
};

const Container = ({ children, className }: TContainerProps) => {
  return (
    <div
      className={`max-w-4xl mx-auto p-6 relative size-full h-screen bg-secondary ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
};

export default Container;
