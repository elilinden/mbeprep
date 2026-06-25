import { describe, expect, it } from "vitest";

import {
  fetchActiveTaxonomyTree,
  fetchAncestors,
  fetchDescendants,
  type TaxonomyNodeRecord,
} from "./taxonomy";

const asOf = new Date("2026-07-01T00:00:00.000Z");

const nodes: TaxonomyNodeRecord[] = [
  {
    id: "subject",
    name: "Subject",
    nodeType: "SUBJECT",
    status: "ACTIVE",
    effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
    sortOrder: 1,
  },
  {
    id: "category",
    parentId: "subject",
    name: "Category",
    nodeType: "CATEGORY",
    status: "ACTIVE",
    effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
    sortOrder: 1,
  },
  {
    id: "subtopic",
    parentId: "category",
    name: "Subtopic",
    nodeType: "SUBTOPIC",
    status: "ACTIVE",
    effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
    sortOrder: 1,
  },
  {
    id: "retired",
    parentId: "subject",
    name: "Retired",
    nodeType: "CATEGORY",
    status: "RETIRED",
    effectiveFrom: new Date("2020-01-01T00:00:00.000Z"),
    sortOrder: 2,
  },
  {
    id: "future",
    parentId: "subject",
    name: "Future",
    nodeType: "CATEGORY",
    status: "ACTIVE",
    effectiveFrom: new Date("2028-01-01T00:00:00.000Z"),
    sortOrder: 3,
  },
];

describe("taxonomy traversal", () => {
  it("fetches the active taxonomy tree for a date", () => {
    const tree = fetchActiveTaxonomyTree(nodes, asOf);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.children.map((node) => node.id)).toEqual(["category"]);
    expect(tree[0]?.children[0]?.children.map((node) => node.id)).toEqual([
      "subtopic",
    ]);
  });

  it("fetches active ancestors from root to parent", () => {
    expect(
      fetchAncestors(nodes, "subtopic", asOf).map((node) => node.id),
    ).toEqual(["subject", "category"]);
  });

  it("fetches active descendants depth-first", () => {
    expect(
      fetchDescendants(nodes, "subject", asOf).map((node) => node.id),
    ).toEqual(["category", "subtopic"]);
  });
});
