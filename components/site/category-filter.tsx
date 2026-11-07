"use client";
import { useId, useState } from "react";
import { dictionaries, type Locale } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";
import { useMediaQuery } from "./use-media-query";

export type CategoryNode = {
  id: string;
  label: string;
  children?: CategoryNode[];
};
function categoryLabel(
  nodes: CategoryNode[],
  selected: string,
): string | undefined {
  for (const node of nodes) {
    if (node.id === selected) return node.label;
    const nested = node.children && categoryLabel(node.children, selected);
    if (nested) return nested;
  }
}
function CategoryOption({
  node,
  selected,
  onSelect,
  locale,
}: {
  node: CategoryNode;
  selected: string;
  onSelect: (id: string) => void;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const id = useId(),
    d = dictionaries[locale];
  return (
    <li>
      <div className="category-option">
        <button
          type="button"
          aria-pressed={selected === node.id}
          onClick={() => onSelect(node.id)}
        >
          {node.label}
        </button>
        {!!node.children?.length && (
          <button
            className="icon-button category-expand"
            type="button"
            aria-expanded={open}
            aria-controls={id}
            aria-label={`${open ? d.collapseCategory : d.expandCategory}: ${node.label}`}
            onClick={() => setOpen(!open)}
          >
            <Icon name="plus" />
          </button>
        )}
      </div>
      {!!node.children?.length && (
        <ul id={id} hidden={!open}>
          {node.children.map((child) => (
            <CategoryOption
              key={child.id}
              node={child}
              selected={selected}
              onSelect={onSelect}
              locale={locale}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
export function CategoryFilter({
  locale,
  nodes,
  selected,
  onSelect,
  label,
  allLabel,
  inline = false,
}: {
  locale: Locale;
  nodes: CategoryNode[];
  selected: string;
  onSelect: (id: string) => void;
  label: string;
  allLabel: string;
  inline?: boolean;
}) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(!inline);
  const id = useId(),
    d = dictionaries[locale];
  const expanded = desktop ? desktopOpen : mobileOpen;
  const chosen = categoryLabel(nodes, selected) || allLabel;
  function select(value: string) {
    onSelect(value);
    setMobileOpen(false);
  }
  return (
    <div className={`category-navigation ${inline ? "category-inline" : ""}`}>
      <button
        type="button"
        className="category-toggle"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() =>
          desktop ? setDesktopOpen(!desktopOpen) : setMobileOpen(!mobileOpen)
        }
      >
        <span>
          {label}
          <small>{chosen}</small>
        </span>
        <Icon name="down" />
      </button>
      <div className="category-panel" id={id} hidden={!expanded}>
        <ul>
          <li>
            <button
              type="button"
              aria-pressed={!selected}
              onClick={() => select("")}
            >
              {allLabel}
            </button>
          </li>
          {nodes.map((node) => (
            <CategoryOption
              key={node.id}
              node={node}
              selected={selected}
              onSelect={select}
              locale={locale}
            />
          ))}
        </ul>
      </div>
      <span className="sr-only" role="status">
        {d.selectedCategory}: {chosen}
      </span>
    </div>
  );
}
