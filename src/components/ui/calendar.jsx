"use client";

import "react-day-picker/style.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  ...props
}) {
  const defaultClassNames = {
    months: "relative flex flex-col sm:flex-row gap-4",
    month: "w-full",
    month_caption: "relative mx-10 mb-1 flex h-9 items-center justify-center z-20",
    caption_label: "text-sm font-medium text-zinc-200",
    nav: "absolute top-0 flex w-full justify-between z-10",
    button_previous: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-zinc-400 hover:text-white p-0",
    ),
    button_next: cn(
      buttonVariants({ variant: "ghost" }),
      "size-9 text-zinc-400 hover:text-white p-0",
    ),
    weekday: "size-9 p-0 text-xs font-medium text-zinc-500",
    day_button:
      "relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg p-0 text-zinc-300 outline-offset-2 group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not(.range-middle)]:duration-150 focus:outline-none group-data-[disabled]:pointer-events-none focus-visible:z-10 hover:bg-zinc-800 group-data-[selected]:bg-indigo-600 hover:text-white group-data-[selected]:text-white group-data-[disabled]:text-zinc-600 group-data-[disabled]:line-through group-data-[outside]:text-zinc-600 group-data-[outside]:group-data-[selected]:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-data-[selected]:group-[.range-middle]:bg-indigo-500/20 group-data-[selected]:group-[.range-middle]:text-zinc-200",
    day: "group size-9 px-0 text-sm",
    range_start: "range-start",
    range_end: "range-end",
    range_middle: "range-middle",
    today:
      "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-10 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-indigo-500 [&[data-selected]:not(.range-middle)>*]:after:bg-zinc-950 [&[data-disabled]>*]:after:bg-zinc-700 *:after:transition-colors",
    outside: "text-zinc-500 data-selected:bg-zinc-800 data-selected:text-zinc-400",
    hidden: "invisible",
    week_number: "size-9 p-0 text-xs font-medium text-zinc-500",
  };

  const mergedClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => ({
      ...acc,
      [key]: classNames?.[key]
        ? cn(
            defaultClassNames[key],
            classNames[key],
          )
        : defaultClassNames[key],
    }),
    {}
  );

  const defaultComponents = {
    Chevron: (props) => {
      if (props.orientation === "left") {
        return <ChevronLeft size={16} strokeWidth={2} {...props} aria-hidden="true" />;
      }
      return <ChevronRight size={16} strokeWidth={2} {...props} aria-hidden="true" />;
    },
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={mergedClassNames}
      components={mergedComponents}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
