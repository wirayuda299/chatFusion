"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateServerForm from "./form";

export default function CreateServerModal() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const handleClose = () => setIsOpen(false);

  return (
    <Dialog modal onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <button className="bg-background ease hover:bg-green-1 group flex size-12 items-center justify-center rounded-full transition-colors duration-300">
          <Plus className="stroke-green-1 group-hover:stroke-white" size={25} />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-foreground rounded-lg border-none p-5 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Customize your server server
          </DialogTitle>
          <DialogDescription className="text-center text-sm font-light text-zinc-500">
            Give your server personality with name and icon. You can always
            change it later.
          </DialogDescription>
          <CreateServerForm handleClose={handleClose} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
