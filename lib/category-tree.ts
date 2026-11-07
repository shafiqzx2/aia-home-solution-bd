import type { Locale } from "./i18n";
import type { SolutionCategory } from "./public-content";

export function flattenCategories(
  nodes: SolutionCategory[],
): SolutionCategory[] {
  return nodes.flatMap((node) => [
    node,
    ...flattenCategories(node.children || []),
  ]);
}
export function categoryNodes(
  nodes: SolutionCategory[],
  locale: Locale,
): {
  id: string;
  label: string;
  children?: ReturnType<typeof categoryNodes>;
}[] {
  return nodes.map((node) => ({
    id: node.id,
    label: node.name[locale],
    ...(node.children?.length
      ? { children: categoryNodes(node.children, locale) }
      : {}),
  }));
}
export function categoryBranchIds(
  nodes: SolutionCategory[],
  selected: string,
): string[] {
  const category = flattenCategories(nodes).find(
    (node) => node.id === selected,
  );
  return category ? flattenCategories([category]).map((node) => node.id) : [];
}
