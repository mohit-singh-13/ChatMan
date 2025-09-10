import { cn } from "@/lib/utils";
import { Button } from "../button";
import type React from "react";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { fetchVideos, setCode } from "@/store/slices/videoSlice";

type TGenerateButtonProps = {
  children: React.ReactNode;
};

const GenerateButton = ({ children }: TGenerateButtonProps) => {
  const dispatch = useAppDispatch();

  const childrenIsCode =
    typeof children === "object" &&
    children !== null &&
    "type" in children &&
    children.type === "code";

  if (!childrenIsCode) return;

  const { children: code } = children.props as { children: string };

  const clickHandler = async () => {
    dispatch(setCode(code));
    dispatch(fetchVideos());
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
