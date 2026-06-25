export type TaxonomyNodeStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "RETIRED"
  | "ARCHIVED";

export type TaxonomyNodeRecord = {
  id: string;
  parentId?: string | null;
  name: string;
  nodeType: "SUBJECT" | "CATEGORY" | "SUBTOPIC" | "RULE" | "SKILL";
  status: TaxonomyNodeStatus;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  sortOrder: number;
};

export type TaxonomyTreeNode = TaxonomyNodeRecord & {
  children: TaxonomyTreeNode[];
};

export function fetchActiveTaxonomyTree(
  nodes: readonly TaxonomyNodeRecord[],
  asOf: Date,
) {
  const activeNodes = nodes.filter((node) => isTaxonomyNodeActive(node, asOf));
  const byId = new Map(
    activeNodes.map((node) => [
      node.id,
      { ...node, children: [] as TaxonomyTreeNode[] },
    ]),
  );
  const roots: TaxonomyTreeNode[] = [];

  for (const node of sortTaxonomyNodes(Array.from(byId.values()))) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  sortTree(roots);
  return roots;
}

export function fetchAncestors(
  nodes: readonly TaxonomyNodeRecord[],
  nodeId: string,
  asOf?: Date,
) {
  const eligibleNodes = asOf
    ? nodes.filter((node) => isTaxonomyNodeActive(node, asOf))
    : [...nodes];
  const byId = new Map(eligibleNodes.map((node) => [node.id, node]));
  const ancestors: TaxonomyNodeRecord[] = [];
  let current = byId.get(nodeId);

  while (current?.parentId) {
    const parent = byId.get(current.parentId);
    if (!parent) {
      break;
    }

    ancestors.push(parent);
    current = parent;
  }

  return ancestors.reverse();
}

export function fetchDescendants(
  nodes: readonly TaxonomyNodeRecord[],
  nodeId: string,
  asOf?: Date,
) {
  const eligibleNodes = asOf
    ? nodes.filter((node) => isTaxonomyNodeActive(node, asOf))
    : [...nodes];
  const childrenByParent = new Map<string, TaxonomyNodeRecord[]>();

  for (const node of eligibleNodes) {
    if (!node.parentId) {
      continue;
    }

    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }

  const descendants: TaxonomyNodeRecord[] = [];
  const visit = (parentId: string) => {
    for (const child of sortTaxonomyNodes(
      childrenByParent.get(parentId) ?? [],
    )) {
      descendants.push(child);
      visit(child.id);
    }
  };

  visit(nodeId);
  return descendants;
}

export function isTaxonomyNodeActive(node: TaxonomyNodeRecord, asOf: Date) {
  return (
    node.status === "ACTIVE" &&
    node.effectiveFrom.getTime() <= asOf.getTime() &&
    (node.effectiveTo == null || node.effectiveTo.getTime() >= asOf.getTime())
  );
}

function sortTaxonomyNodes<
  T extends Pick<TaxonomyNodeRecord, "sortOrder" | "name">,
>(nodes: readonly T[]) {
  return [...nodes].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
}

function sortTree(nodes: TaxonomyTreeNode[]) {
  nodes.sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
  for (const node of nodes) {
    sortTree(node.children);
  }
}
