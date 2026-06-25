# UX Audit

Audit date: June 24, 2026

Scope: live inspection of `/`, `/login`, `/dashboard`, `/admin`, and `/admin/questions` at `1440 x 900`, `1024 x 768`, `768 x 1024`, and `390 x 844`.

Artifacts: before screenshots and raw Playwright/axe results are saved under `test-results/ux-audit/`, which is ignored locally.

Method: Playwright viewport inspection, keyboard tab-order sampling, DOM structure extraction, and automated axe-core checks. This was not a full assistive-technology screen-reader test.

## 1. Current Navigation Structure

The global application shell renders one primary navigation row for every tested context:

- Home
- Login
- Onboarding
- Dashboard
- Plan
- Audio
- Questions
- Review
- Essays
- Analytics
- Settings
- Admin

The same header appears for unauthenticated visitors, signed-in students, and signed-in administrators. Route protection redirects unauthorized users server-side, but the visible navigation does not reflect authentication state, onboarding state, or role.

The brand link appears before the navigation, followed by all route links in one crowded row. At desktop widths the header wraps into multiple lines; at smaller widths it becomes a horizontally overflowing navigation strip.

## 2. Routes Shown to Authenticated and Unauthenticated Users

Unauthenticated users currently see links to public and protected areas in the same primary navigation:

- Public routes shown: `/`, `/login`, `/onboarding`
- Protected student routes also shown: `/dashboard`, `/plan`, `/audio`, `/practice/questions`, `/review`, `/essays`, `/analytics`, `/settings`
- Protected admin route also shown: `/admin`

Authenticated users still see public or first-run routes as primary navigation:

- `/login` remains visible after sign-in.
- `/onboarding` remains visible after sign-in even when onboarding is complete or editable from settings/dashboard.
- Student application routes remain visible to administrators in the same row as admin routes.
- Admin routes remain visible to students even though access is blocked by server-side checks.

## 3. Routes Shown to Students Versus Administrators

Students and administrators see the same primary navigation items. The student `/admin` request redirects to `/dashboard`, which confirms server-side authorization is active, but the Admin link is still discoverable and tabbable for students.

Administrators see student routes and admin routes combined into one row. There is no separate administrative navigation model for content operations, imports, review queues, coverage, reports, or system settings.

Observed route behavior:

- Student `/dashboard`: loads the authenticated dashboard.
- Student `/admin`: redirects to `/dashboard`.
- Admin `/admin`: loads the administrative content operations page.
- Admin `/admin/questions`: returns a 404 page; a questions-management destination is implied by the product but not available as a route.

## 4. Visual-Hierarchy Problems

The admin page mixes several levels of work in one view: overview metrics, question list filters, question management, choice-rationale editing, podcast management, review workflows, imports, and coverage reporting. This makes it difficult to identify the primary task of the page.

The admin page does not present an obvious primary action such as "Create question", "Import content", or "Open review queue". Key actions are distributed across dense sections instead of being anchored near the page title.

Summary cards use internal or ambiguous labels:

- "Versioned items"
- "Rubric readiness"
- "Metadata"
- "Moderation"

These labels require domain knowledge and do not clearly communicate the operational state or next action. The dashboard has a clearer learner-facing hierarchy than the admin page, but it still competes with persistent setup and route links that are not always relevant.

## 5. Navigation and Discoverability Problems

Login and onboarding are treated as permanent primary destinations. For signed-in users, login should leave primary navigation and onboarding should become either a completion prompt, dashboard task, or settings/edit-profile link.

Student and administrative navigation are combined. This makes the global header long, hard to scan, and role-confusing. Administrators need an admin-specific navigation structure, while students need a study-focused structure.

The Admin link is visible to users who cannot use it. Hiding the link is not sufficient for authorization, but the visible navigation should still reflect available destinations to reduce dead ends.

Interactive cards do not consistently communicate that they are actionable. Cards that navigate or trigger workflows need clearer affordances such as buttons, links with explicit labels, hover/focus states, and consistent placement of actions.

The missing `/admin/questions` route is a discoverability gap. Question management appears inside `/admin`, but the URL structure does not support a focused question list/editor destination.

## 6. Responsive-Layout Problems

At `1440 x 900` and `1024 x 768`, the desktop header wraps because too many primary links are present. This makes the app feel unstable at common desktop and laptop widths.

At `768 x 1024` and `390 x 844`, the header becomes a long horizontally scrollable strip. This preserves access but is difficult to discover, inefficient with a keyboard, and easy to miss on touch devices.

The admin page has horizontal overflow at `390 x 844`. Wide tables and dense filters do not collapse into a mobile-friendly management pattern.

Admin filters take substantial vertical space before the user reaches results. On smaller screens this pushes the actual question table and row actions below the fold.

The admin page needs a responsive strategy for data-heavy screens: compact filter disclosure, table-to-card fallback, sticky primary actions, and pagination controls that remain reachable.

## 7. Keyboard and Focus Problems

The skip link is present and focusable, which is good. However, keyboard users must tab through the full global navigation before reaching page-specific controls. Because the nav includes unavailable or low-relevance links, keyboard traversal is unnecessarily long.

Student users can tab to the Admin link even though they cannot use the admin destination. Signed-in users can tab to Login and Onboarding even when those are not appropriate primary actions.

The admin table overflow container triggered an axe `scrollable-region-focusable` violation at `768 x 1024` and `390 x 844`. Scrollable regions that contain interactive or tabular content should be keyboard focusable and have accessible names.

Interactive cards and row-like elements need visible focus styles that are at least as clear as hover styles. The current experience does not make all actionable areas obvious during keyboard-only inspection.

## 8. Screen-Reader and Semantic HTML Problems

Automated axe scans reported `landmark-unique` violations on the dashboard. The likely cause is repeated section landmarks or repeated accessible names in empty-state components. Landmark regions need unique labels or should use non-landmark containers where section navigation is not useful.

Tables on the admin page do not expose enough structure for efficient assistive-technology navigation. They need captions or accessible names, meaningful row actions, sortable header buttons where sorting is supported, and status text that does not rely on layout alone.

Repeated empty states should avoid duplicate IDs and duplicate `aria-labelledby` targets. Empty-state components should accept unique heading IDs or rely on local heading structure without creating repeated landmark names.

The 404 for `/admin/questions` is semantically clear as an error page, but it confirms there is no dedicated semantic structure for question-management workflows yet.

## 9. Color-Contrast and Status-Indicator Problems

No broad color-contrast violation was reported by axe in the tested pages, but the audit did not include manual color sampling for every state.

Status indicators need clearer, non-color-only treatment. Admin content states, review states, processing states, and publication states should be shown as labeled badges with consistent text, color, and shape.

Terms such as "Metadata" and "Rubric readiness" are not status labels users can act on. Operational states should be phrased around user decisions, for example "Needs transcript", "Missing rubric", "Ready for legal review", "License expires soon", or "Published".

Focus indicators should be checked against contrast requirements in every state, especially inside dense admin tables, filter controls, and card-like actions.

## 10. Table and Form Usability Problems

The admin question list uses a table with headers for Key, Subject, Category, Format, Status, and Version. It does not provide clear row actions such as Edit, Preview, Review, Publish, Retire, or View history.

The question table needs:

- A caption or accessible name.
- Sortable column headers where sorting is supported.
- Pagination or result counts.
- Status badges with plain-language labels.
- Clear empty, loading, and error states.
- Responsive behavior for tablet and mobile widths.
- Row actions that are reachable by keyboard and screen readers.

Filters take too much vertical room and appear before the user can scan results. Filters should be grouped, collapsible on smaller screens, and paired with a clear "Clear filters" action.

Admin forms are dense and live alongside unrelated workflows. Editors for questions, choices, rationales, essays, podcasts, and imports should be moved into dedicated pages or panels with focused save/preview/review actions.

Button-only server-action forms can be accessible when the button text is specific, but destructive or workflow-changing actions should include confirmation, status feedback, and audit-log context.

## 11. Proposed Information Architecture

Use separate navigation models for public, student, and admin experiences.

Public navigation:

- Home
- Login

Student application navigation:

- Dashboard
- Plan
- Practice
- Audio
- Essays
- Review
- Analytics
- Settings

Onboarding should not remain a permanent primary link. Show it as a required setup task until complete, then expose editing through Dashboard and Settings.

Administrative navigation:

- Admin overview
- Questions
- Essays
- Podcasts
- Imports
- Review queue
- Coverage
- Reports
- Licenses
- Settings

Administrators can switch between student and admin contexts, but the default admin shell should not combine every student and admin destination in one row. The admin area should use a sidebar or segmented admin navigation with a concise global header.

Authorization must remain server-enforced. Role-aware navigation is a usability layer, not the security boundary.

## 12. Page-by-Page Implementation Plan

Global shell/header:

- Render navigation from authenticated user state and role.
- Separate public, student, and admin navigation groups.
- Replace the crowded row with a responsive pattern: concise desktop nav plus account menu, and a keyboard-accessible mobile menu or sidebar.
- Keep the skip link and add clear active states.
- Remove Login from signed-in primary navigation.
- Remove Admin from student primary navigation.

Login:

- Use a minimal public header.
- Redirect signed-in users away from `/login` or show account/session status with a dashboard link.
- Keep development-only login methods visually and semantically marked for development.

Onboarding:

- Treat onboarding as a first-run flow and editable profile section, not permanent primary navigation.
- Add a clear progress model for jurisdiction, exam date, track confirmation, availability, and accessibility preferences.
- Preserve server-side validation and accessible field errors.

Dashboard:

- Add one clear primary action based on learner state, such as "Start today's plan" or "Finish onboarding".
- Keep exam countdown, available study minutes, plan empty state, mastery empty state, and continue-studying placeholder, but order them around the learner's next action.
- Keep track-specific wording so legacy and NextGen users do not see mixed readiness signals.

Admin overview:

- Make `/admin` an overview and triage page only.
- Replace ambiguous summary terms with operational labels and clear next actions.
- Surface primary actions such as Create question, Import content, Open review queue, and View coverage.
- Move complete question-management UI out of the overview.

Admin questions:

- Add a dedicated `/admin/questions` route.
- Provide filters, result count, sorting, pagination, status badges, and row actions.
- Use a responsive table on desktop and a card/list pattern on mobile.
- Add a primary "Create question" action.

Question editor:

- Move creation and editing to focused routes such as `/admin/questions/new` and `/admin/questions/[id]`.
- Keep preview, topic selection, license selection, choice rationales, and workflow transitions in a task-specific layout.
- Preserve legal-review safeguards and prevent one person from completing all configured approval steps.

Admin essays and podcasts:

- Give essays and podcasts dedicated admin sections.
- Use specific labels for missing rubrics, missing transcripts, processing errors, legal-review status, and publication status.
- Keep upload and private playback controls behind server authorization.

Tables and forms:

- Add captions or accessible names to data tables.
- Add visible and programmatic sorting state.
- Add keyboard-accessible row actions.
- Make horizontal scroll containers focusable and named when overflow is unavoidable.
- Collapse secondary filters on smaller screens.

Accessibility:

- Fix duplicate or non-unique landmarks on dashboard empty states.
- Verify keyboard-only operation for navigation, filters, tables, editors, modals, and publish/retire actions.
- Add automated axe checks for core authenticated student and admin flows.
- Add manual screen-reader QA notes for the dashboard, admin overview, question table, and question editor.

## Highest-Priority Changes

1. Make the global navigation authentication-aware and role-aware while preserving server-side authorization.
2. Split the admin experience into an overview plus dedicated management routes, starting with `/admin/questions`.
3. Replace the wrapping desktop header and horizontal mobile nav strip with a responsive navigation pattern.
4. Redesign the admin question list with clear primary actions, filters, row actions, sorting, pagination, responsive behavior, and status badges.
5. Fix the accessibility issues found by axe and keyboard inspection: non-unique landmarks, non-focusable scroll regions, long irrelevant tab paths, and unclear interactive affordances.
