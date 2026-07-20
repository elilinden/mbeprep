import agencyOutlineJson from "@/data/outlines/agency.json";
import civilProcedureOutlineJson from "@/data/outlines/civil-procedure.json";
import constitutionalLawOutlineJson from "@/data/outlines/constitutional-law.json";
import criminalLawOutlineJson from "@/data/outlines/criminal-law.json";
import criminalProcedureOutlineJson from "@/data/outlines/criminal-procedure.json";
import contractsSalesOutlineJson from "@/data/outlines/contracts-sales.json";
import corporationsLlcsOutlineJson from "@/data/outlines/corporations-llcs.json";
import evidenceOutlineJson from "@/data/outlines/evidence.json";
import meeFocusedReviewOutlineJson from "@/data/outlines/mee-focused-review.json";
import partnershipsOutlineJson from "@/data/outlines/partnerships.json";
import realPropertyOutlineJson from "@/data/outlines/real-property.json";
import tortsOutlineJson from "@/data/outlines/torts.json";

export type OutlineBlock = {
  type: "paragraph" | "subheading" | "minorHeading" | "quote" | "compact" | "chartHeader" | "chartRow";
  text: string;
};

export type OutlineSection = {
  id: string;
  title: string;
  body: string[];
  blocks?: OutlineBlock[];
};

export type Outline = {
  id: string;
  title: string;
  subject: string;
  summary: string;
  sections: OutlineSection[];
};

const agencyOutline = agencyOutlineJson as Outline;
const civilProcedureOutline = civilProcedureOutlineJson as Outline;
const constitutionalLawOutline = constitutionalLawOutlineJson as Outline;
const criminalLawOutline = criminalLawOutlineJson as Outline;
const criminalProcedureOutline = criminalProcedureOutlineJson as Outline;
const contractsSalesOutline = contractsSalesOutlineJson as Outline;
const corporationsLlcsOutline = corporationsLlcsOutlineJson as Outline;
const evidenceOutline = evidenceOutlineJson as Outline;
const meeFocusedReviewOutline = meeFocusedReviewOutlineJson as Outline;
const partnershipsOutline = partnershipsOutlineJson as Outline;
const realPropertyOutline = realPropertyOutlineJson as Outline;
const tortsOutline = tortsOutlineJson as Outline;

export const outlines: Outline[] = [
  meeFocusedReviewOutline,
  agencyOutline,
  civilProcedureOutline,
  constitutionalLawOutline,
  criminalLawOutline,
  criminalProcedureOutline,
  evidenceOutline,
  contractsSalesOutline,
  corporationsLlcsOutline,
  partnershipsOutline,
  realPropertyOutline,
  tortsOutline,
];
