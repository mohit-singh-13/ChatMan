import type React from "react";

type TContainerProps = {
  children: React.ReactNode;
};

const Container = ({ children }: TContainerProps) => {
  return <div className="max-w-7xl bg-black mx-auto h-full">{children}</div>;
};

export default Container;
