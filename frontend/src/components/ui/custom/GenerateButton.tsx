import { cn } from "@/lib/utils";
import { Button } from "../button";
import type React from "react";

type TGenerateButtonProps = {
  children: React.ReactNode;
};

const GenerateButton = ({ children }: TGenerateButtonProps) => {
  const childrenIsCode =
    typeof children === "object" &&
    children !== null &&
    "type" in children &&
    children.type === "code";

  if (!childrenIsCode) return;

  const { children: code } = children.props as { children: string };

  const clickHandler = () => {
    console.log(code);
  };

  return (
    <Button
      className={cn("cursor-pointer")}
      variant={"outline"}
      onClick={clickHandler}
    >
      Generate Video
    </Button>
  );
};

export default GenerateButton;
