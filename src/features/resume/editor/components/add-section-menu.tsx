"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  REPEATABLE_SECTION_TYPES,
  SECTION_LABEL,
  type SectionType,
} from "../../schemas/document";

const ALL_TYPES = Object.keys(SECTION_LABEL) as SectionType[];

export function AddSectionMenu({
  existingTypes,
  onAdd,
}: {
  existingTypes: SectionType[];
  onAdd: (type: SectionType) => void;
}) {
  // A resume has one "Formação"; only custom sections repeat.
  const available = ALL_TYPES.filter(
    (type) =>
      REPEATABLE_SECTION_TYPES.includes(type) || !existingTypes.includes(type),
  );

  if (available.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full">
          <Plus data-icon="inline-start" />
          Adicionar seção
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {available.map((type) => (
          <DropdownMenuItem key={type} onSelect={() => onAdd(type)}>
            {SECTION_LABEL[type]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
