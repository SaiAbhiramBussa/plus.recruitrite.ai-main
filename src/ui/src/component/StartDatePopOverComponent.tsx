import { NextPage } from "next";
import React from "react";
import {
  Popover,
  PopoverHandler,
  PopoverContent,
} from "@material-tailwind/react";

interface Props {
  ChildElement: any;
  popOverText: string | any;
}

const StartDatePopOverComponent: NextPage<Props> = ({
  ChildElement,
  popOverText,
}) => {
  const [openPopover, setOpenPopover] = React.useState<boolean>(false);

  const triggers = {
    onMouseEnter: () => setOpenPopover(true),
    onMouseLeave: () => setOpenPopover(false),
  };

  return (
    <Popover open={openPopover} handler={setOpenPopover}>
      <PopoverHandler {...triggers}>{ChildElement}</PopoverHandler>
      <PopoverContent className="z-[999]">{popOverText}</PopoverContent>
    </Popover>
  );
};

export default StartDatePopOverComponent;
