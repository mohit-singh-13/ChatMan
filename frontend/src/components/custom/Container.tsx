import type React from "react";

type TContainerProps = {
  children: React.ReactNode;
};

const Container = ({ children }: TContainerProps) => {
  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      {children}
    </div>
  );
};

export default Container;
