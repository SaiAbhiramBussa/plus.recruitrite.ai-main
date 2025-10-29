import React, { useContext } from "react";
import {
  Popover,
  PopoverHandler,
  PopoverContent,
} from "@material-tailwind/react";
import AppContext from "../context/Context";
import { colorToRGBA } from "../utils/misc";

export default function PopOverComponent(props: any) {
  const [openPopover, setOpenPopover] = React.useState(false);
  const { skills, skillLength, content } = props;
  const { color } = useContext(AppContext);
  const triggers = {
    onMouseEnter: () => setOpenPopover(true),
    onMouseLeave: () => setOpenPopover(false),
  };

  return (
    <Popover open={openPopover} handler={setOpenPopover}>
      {skillLength > 0 && !content && (
        <PopoverHandler {...triggers}>
          <div
            style={{ color: color?.primaryAccent }}
            className="py-2 text-xs cursor-pointer"
          >
            + {skillLength} more
          </div>
        </PopoverHandler>
      )}
      {content && (
        <PopoverHandler {...triggers}>
          <div className="truncate max-w-[13vw] min-w-[13vw]">{content}</div>
        </PopoverHandler>
      )}
      <PopoverContent {...triggers}>
        <div
          className={`z-11 ${
            content ? "max-w-[15rem]" : "max-w-[20rem]"
          } max-h-[16rem] overflow-y-scroll`}
        >
          <div className="flex flex-wrap items-center gap-2">
            {!content ? (
              skills.map((skill: any, id: any) => (
                <button
                  style={{
                    backgroundColor: colorToRGBA(color?.primaryAccent, 0.1),
                    color: color?.primaryAccent,
                  }}
                  key={id}
                  className="w-max mr-1 cursor-default items-center justify-center h-7 rounded-md px-2"
                >
                  <div className="text-xs">{skill.skill}</div>
                </button>
              ))
            ) : (
              <div>{content}</div>
            )}
          </div>
        </div>
        <div className="flex justify-center relative z-66">
          <div
            style={{ backgroundColor: color?.innerBg }}
            className="absolute top-2 h-4 w-4 rotate-45 flex justify-center"
          ></div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
