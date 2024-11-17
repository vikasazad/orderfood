"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDispatch } from "react-redux";
import { searchTerm } from "@/lib/features/searchSlice";
import { AppDispatch } from "@/lib/store";
export default function Header({ data }: { data: any }) {
  // console.log(data);
  const dispatch = useDispatch<AppDispatch>();
  const [expanded, setExpanded] = React.useState(false);

  return (
    <header className="mx-auto max-w-6xl px-2">
      <div className="flex items-center justify-between py-2">
        <Avatar className="h-10 w-10">
          <AvatarImage alt="Restaurant logo" src={data.logo} />
        </Avatar>

        <div
          className={cn(
            "relative flex items-center gap-2 rounded-full bg-background transition-all duration-500 shadow-md hover:shadow-lg ",
            expanded ? "w-[85%] px-3" : "h-10 w-10"
          )}
        >
          <Input
            className={cn(
              "border-none bg-transparent p-0 focus-visible:ring-0",
              expanded ? "w-full opacity-100" : "w-0 opacity-0"
            )}
            placeholder="Search anything"
            type="search"
            onChange={(e) => dispatch(searchTerm(e.target.value))}
          />
          <Button
            onClick={() => setExpanded(!expanded)}
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0 rounded-full "
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Toggle search</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
