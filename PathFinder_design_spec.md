PathFinder — Product & Visual Design Specification

Prototype brief: Build a polished Career PathFinder SaaS that turns a user’s skills, interests, experience, and goals into an explainable, actionable career and learning roadmap.

Design direction: A calm, intelligent, optimistic workspace that makes career decisions feel navigable rather than overwhelming.

Document owner: Manus AI
Prototype window: 14 August 2026, 8:00 pm IST – 31 August 2026, 11:59 pm IST
Status: Prototype-ready product design

1. Product concept

PathFinder is an AI-guided career exploration product for students, early-career professionals, and career switchers. The core experience is a short guided intake followed by a personalized Path Map: a visual graph of possible roles, skill gaps, learning resources, milestones, and next actions.

The product should not present a single deterministic career verdict. Instead, it should show a small set of plausible routes, explain why each route fits, surface trade-offs, and let the user compare paths before choosing one to explore.

Product promise

“See where your strengths can take you — and what to do next.”

Prototype success criteria

2. Target users and primary use cases

Primary personas

Core user stories

As a user, I can describe my background and goals in plain language.

As a user, I can edit the skills and interests the system inferred from my answers.

As a user, I can compare three career paths without losing my place.

As a user, I can understand why a path was recommended.

As a user, I can see the skills I already have, the skills I need, and what to do next.

As a user, I can save a path and return to it later.

As a user, I can mark milestones complete and regenerate the plan when my goals change.

3. Information architecture

flowchart LR

  A[Landing page] --> B[Guided intake]

  B --> C[Profile review]

  C --> D[Path Map]

  D --> E[Path detail]

  D --> F[Compare paths]

  E --> G[Learning plan]

  E --> H[Next actions]

  D --> I[Saved paths]

  I --> J[Progress dashboard]

Main navigation

The prototype should keep the navigation intentionally small. The most important action is always visible: Continue your path or Generate my path.

4. End-to-end experience

4.1 Landing page

The landing page should immediately communicate that PathFinder is personalized, visual, and actionable. The hero should feature a dark-to-indigo gradient background with an animated 3D constellation or route object on the right. The left side contains the headline, a concise explanation, and a primary CTA.

Hero copy:

Eyebrow: AI career navigation

Headline: Your next career move, mapped clearly.

Supporting copy: Tell PathFinder where you are, what you enjoy, and where you want to go. Get a personalized route with the skills, milestones, and next steps to move forward.

Primary CTA: Build my path

Secondary CTA: See an example path

The page should use a restrained amount of marketing content. For the prototype, prioritize the intake CTA, one short “How it works” section, and a credibility panel showing the output structure: strengths → options → gaps → next steps.

4.2 Guided intake

The intake is a progressive, conversational form divided into four stages. Each stage should feel lightweight and give the user a visible sense of progress.

The form should support both typing and selection. After each free-text answer, the interface may show inferred chips such as research, storytelling, or systems thinking, but the user must be able to remove or edit them.

Microcopy principle: Never imply that the AI knows more than the user has shared. Use “We heard…” and “You can edit this” rather than “We know you are…”.

4.3 Profile review

Before recommendations are generated, show a compact editable review screen. This screen is an important trust checkpoint.

The user should see:

A short profile summary generated from their answers.

Inferred strengths with confidence indicators.

Preferences and constraints.

A clear Edit profile action.

A primary Generate my paths action.

A small “How recommendations work” disclosure should explain that PathFinder combines user preferences, transferable skills, goal fit, and learning effort. Do not expose opaque model jargon in the primary flow.

4.4 Path Map dashboard

The Path Map is the signature screen. It should feel like a personal navigation instrument rather than a generic dashboard.

Desktop layout:

Left rail: greeting, progress ring, current focus, and saved-path navigation.

Center canvas: interactive career route graph.

Right inspector: selected role, fit explanation, skill overlap, and CTA.

Bottom strip: next three actions with estimated effort.

Mobile layout:

Header with progress and profile avatar.

Horizontal path selector.

Vertical route timeline replacing the graph canvas.

Bottom sheet for role details.

4.5 Path comparison

The comparison view should allow up to three paths. Each path is represented by a card with a distinct accent color but a shared structure.

The product should explicitly label these as estimates and let users adjust priorities. A “Tune priorities” control can change the weighting between speed, income, creativity, stability, and flexibility.

4.6 Path detail and learning plan

A selected path opens a focused detail view with four sections:

Why this path fits: a concise explanation tied to the user’s actual inputs.

Skill bridge: existing strengths mapped to required capabilities.

Milestones: a sequence from foundation to proof-of-work to application.

Next actions: small tasks with checkboxes, links, and suggested time.

The primary action should be Start this path. A secondary action should be Keep comparing so the user does not feel locked in.

5. Visual identity

Brand personality

PathFinder should feel clear, encouraging, intelligent, and grounded. Avoid the visual language of productivity surveillance, gamified finance, or overly futuristic AI dashboards. The product is about confidence and direction, not pressure.

Color system

Recommended gradient recipes

--gradient-hero: linear-gradient(135deg, #111827 0%, #312E81 52%, #5967F2 100%);

--gradient-ai: linear-gradient(135deg, #5967F2 0%, #8B5CF6 55%, #22D3EE 100%);

--gradient-growth: linear-gradient(135deg, #B7F36B 0%, #22D3EE 100%);

--gradient-card: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96));

Typography

Use a modern sans-serif family with a distinctive display weight for headlines. Recommended pairing:

Display: Sora or Space Grotesk, weights 600–700.

Body: Inter or DM Sans, weights 400–600.

Data and code-like labels: IBM Plex Mono, weight 500.

Headlines should be compact and human. Avoid all-caps paragraphs and excessive letter spacing. Use sentence case for navigation and CTAs.

Shape, depth, and texture

Use a 16–24 px radius for large cards, 12–14 px radius for controls, and 999 px radius for pills. Elevation should come from subtle border contrast and soft shadows rather than heavy neumorphism.

Recommended surface treatment:

.card {

  background: rgba(255, 255, 255, 0.82);

  border: 1px solid rgba(148, 163, 184, 0.22);

  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);

  backdrop-filter: blur(18px);

}

The dark hero and path canvas may use a fine noise texture, low-opacity grid lines, and faint radial glows. These should support hierarchy, not compete with the route graph.

6. 3D object system

The prototype should use a small library of consistent 3D objects. The objects should be low-poly or smooth geometric forms with glass, ceramic, and soft metallic materials. They must share the same lighting direction and color palette.

Shared 3D art direction

Object 01 — The Pathfinder Compass

A floating circular compass with four rounded directional arms and a glowing indigo center. The compass represents orientation and should be the main hero object.

Primary use: Landing-page hero and loading state.

Materials: Frosted white outer ring, indigo glass center, cyan emissive needle.

Animation: Slow 8-second rotation with a subtle hover bob; needle gently reorients toward the active path.

Interaction: On hover, route lines appear from the center toward four small destination nodes.

Fallback: A 2D SVG compass with animated gradient stroke.

Object 02 — Skill Constellation

A cluster of translucent spheres connected by thin glowing lines. Each sphere represents a skill, with larger spheres representing stronger or more relevant skills.

Primary use: Profile review and skills dashboard.

Materials: Semi-transparent glass spheres with colored inner cores.

Animation: Nodes gently drift within a bounded volume; selected nodes pulse once and brighten their connections.

Interaction: Clicking a node opens its skill card and confidence control.

Fallback: CSS circles and SVG paths rendered in the same layout.

Object 03 — Career Bridge

Two floating platforms connected by a curved bridge made of modular luminous tiles. One platform is labeled conceptually as the user’s current state; the other represents a target role.

Primary use: Path detail view to visualize transferable skills.

Materials: Dark ceramic platforms, amber bridge tiles, cyan edge lights.

Animation: Tiles illuminate sequentially from current state to target state.

Interaction: Hovering a tile reveals the skill or milestone it represents.

Fallback: A horizontal milestone timeline.

Object 04 — Growth Seed

A small geometric seed that opens into a luminous branching form. It is a metaphor for learning and should be used sparingly.

Primary use: Empty states, completed milestone celebration, onboarding interstitial.

Materials: Matte pearl shell, lime emissive interior, subtle violet shadow.

Animation: The shell opens over 1.2 seconds when a milestone is completed.

Interaction: Completion triggers a small burst of particles, not a loud celebration.

Fallback: A line-art sprout icon with a short scale animation.

Object 05 — Opportunity Prism

A translucent prism containing three colored internal beams. Each beam represents a possible path and changes intensity according to the selected priority.

Primary use: Path comparison and priority tuning.

Materials: Transparent prism, internal volumetric beams, dark base.

Animation: Beams slowly refract; the active path becomes brighter and thicker.

Interaction: Moving the priority sliders shifts beam intensity and label position.

Fallback: Three comparison bars with animated width transitions.

Object 06 — Learning Orbit

A central planet-like sphere surrounded by small orbiting cards or cubes representing courses, projects, mentors, and practice sessions.

Primary use: Weekly learning plan.

Materials: Indigo planet surface, white cards, cyan orbit ring, lime completion marks.

Animation: Orbit objects move slowly; completed objects settle into a lower orbit.

Interaction: Clicking an orbiting item opens the action detail.

Fallback: Stacked action cards with a vertical progress line.

Object 07 — Route Marker

A compact three-dimensional pin with a circular center and a glowing vertical stem.

Primary use: Career graph nodes and milestone markers.

Materials: White ceramic shell with accent-colored center.

Animation: Active marker scales from 1.0 to 1.08 and emits one soft ring every 4 seconds.

Interaction: Hover state reveals role title, fit range, and milestone count.

Fallback: CSS marker with radial-gradient pulse.

Object 08 — Confidence Dial

A shallow circular dial with a rotating inner ring and three confidence bands: emerging, capable, and strong.

Primary use: Skill confidence controls and model explanation cards.

Materials: Matte dark base, glass ring, lime-to-amber gradient indicator.

Animation: Indicator animates into position after inference completes.

Interaction: Dragging changes confidence; the model recommendation updates only after confirmation.

Fallback: Accessible range input with a segmented visual meter.

Asset-generation prompts

Use these prompts as a starting point for image or 3D asset generation. Keep all objects consistent in camera angle, material language, and lighting.

Create a premium 3D product asset for a career navigation SaaS called PathFinder. Subject: a floating geometric compass with a frosted glass ring, indigo translucent center, and cyan emissive needle. Composition: isolated object, three-quarter view, centered, generous negative space, transparent background. Style: soft industrial design, rounded low-poly geometry, subtle bevels, calm intelligent mood, studio lighting from upper left with cyan rim light. Colors: ink navy, path indigo, signal cyan, growth lime. Avoid: text, logos, clutter, sharp spikes, photorealistic hardware.

Create a premium 3D product asset for a career navigation SaaS. Subject: a skill constellation made of seven translucent glass spheres connected by fine glowing lines, with three larger nodes and four smaller nodes. Composition: centered floating cluster, transparent background, three-quarter view. Style: elegant data sculpture, rounded forms, restrained bloom, indigo-violet-cyan palette with one lime highlight. Avoid: text, people, galaxy scenery, excessive particles, chaotic network density.

Create a premium 3D product asset for a career navigation SaaS. Subject: two rounded dark ceramic platforms connected by a curved bridge of luminous modular tiles. Composition: isolated, three-quarter view, transparent background, readable silhouette. Style: optimistic, tactile, soft industrial design, cyan edge lighting, amber bridge tiles, indigo ambient glow. Avoid: text, literal roads, cars, buildings, realistic landscape, excessive detail.

7. Motion and animation system

Motion should clarify state, sequence, and progress. It must never delay users or make the interface feel like a game when the user needs confidence.

Motion principles

Orient first. Animate the path into view from the user’s current position toward the recommended next step.

Use one dominant motion. Avoid simultaneous large-scale movement in cards, graph nodes, and background objects.

Reward understanding. Use small confirmations when a user edits a skill or completes a milestone.

Keep motion interruptible. Users should be able to continue reading or interacting immediately.

Respect reduced motion. Disable floating, parallax, particle, and continuous rotation effects when prefers-reduced-motion: reduce is active.

Timing tokens

Recommended easing: cubic-bezier(0.22, 1, 0.36, 1) for entrances and cubic-bezier(0.4, 0, 0.2, 1) for state transitions.

Key animation sequences

CSS motion examples

@keyframes path-draw {

  from { stroke-dashoffset: 1; opacity: 0.1; }

  to { stroke-dashoffset: 0; opacity: 1; }

}

@keyframes soft-pulse {

  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0); }

  50% { transform: scale(1.04); box-shadow: 0 0 0 10px rgba(34, 211, 238, 0.08); }

}

@keyframes float-object {

  0%, 100% { transform: translateY(0) rotate(-1deg); }

  50% { transform: translateY(-10px) rotate(1deg); }

}

8. AI and model experience design

The AI should be presented as a collaborative guide, not an oracle. Every recommendation must be inspectable and editable.

Recommendation architecture

The prototype can represent the recommendation process as five visible stages:

Explanation card template

Every path should contain an explanation card with this structure:

Why PathFinder suggested this
You mentioned enjoying structured problem-solving, visual storytelling, and independent project work. This path uses those strengths while asking you to build stronger research and presentation skills.

Then show three evidence groups:

Strong match: strengths that already transfer.

Growth area: skills that require deliberate practice.

Trade-off: what the user gains and what they may need to compromise.

Avoid exposing raw model confidence as a single authoritative percentage. If a score is shown, label it as Path fit estimate and pair it with the reasons that influence the estimate.

Editable inference pattern

We inferred: systems thinking · writing · visual communication

[Keep] [Edit] [Remove]

How confident are you in these skills?

Emerging ───── Capable ───── Strong

[Refresh recommendations]

Loading state copy

Use transparent progress messages rather than theatrical claims:

Reading your goals

Connecting transferable skills

Comparing nearby paths

Building your first-week plan

Do not claim that the system has searched the entire job market unless that is actually implemented.

9. Component design

Buttons

All buttons should have visible focus states, a minimum touch target of 44 px, and labels that describe the action rather than the system operation.

Cards

Cards should support a clear hierarchy: a short eyebrow, a strong title, one sentence of context, and one primary action. Do not put more than two competing actions in the same card.

Data visualization

Use route graphs for relationships and timelines for sequences. Do not use circular gauges for information that requires precise comparison. A fit estimate should always have a textual explanation and a comparison context.

Icons

Use a rounded line icon set with consistent 1.75 px stroke weight. Suggested icon metaphors include compass, spark, bridge, map pin, layers, target, clock, book, briefcase, and arrow-up-right. The 3D objects carry the expressive brand layer; icons should remain quiet and functional.

10. Responsive behavior

The route graph must never become the only way to access information. Every node, connection, and status should have an equivalent accessible list or timeline representation.

11. Accessibility and trust requirements

The visual system should target WCAG 2.2 AA contrast for text and controls. Do not rely on color alone to communicate fit, confidence, or completion. Use labels, icons, patterns, or text in addition to color.

The prototype should include keyboard navigation for intake, path selection, comparison, and milestone completion. The route graph should expose an accessible list of roles and milestones. Decorative 3D objects should be hidden from screen readers with aria-hidden="true".

Trust should be visible in the interaction design:

Let users edit inferred skills before generating a path.

Explain which user inputs influenced a recommendation.

Distinguish estimates from verified facts.

Avoid guarantees about salary, hiring outcomes, or career success.

Provide a clear way to regenerate a path when preferences change.

12. Prototype data model

type UserProfile = {

  currentRole?: string;

  experienceLevel: "student" | "early-career" | "mid-career" | "career-switcher";

  interests: string[];

  skills: Skill[];

  goals: string[];

  constraints: {

    weeklyHours?: number;

    learningMode?: "self-paced" | "cohort" | "mentor-led" | "mixed";

    workStyle?: string[];

    locationPreference?: string;

  };

};

type Skill = {

  name: string;

  category: "technical" | "creative" | "communication" | "business" | "domain";

  confidence: "emerging" | "capable" | "strong";

  evidence?: string;

};

type CareerPath = {

  id: string;

  title: string;

  summary: string;

  fitEstimate: "strong" | "promising" | "exploratory";

  reasons: string[];

  transferableSkills: string[];

  growthAreas: string[];

  tradeoffs: string[];

  milestones: Milestone[];

  firstWeekActions: Action[];

};

Suggested prototype AI flow

For a fast, credible prototype, use structured JSON output from the model and validate the response against the data model before rendering. Keep a deterministic fallback dataset with three example paths so the demo remains usable if inference fails or network access is unavailable.

The three fallback paths should be:

Product Designer — visual communication, user empathy, prototyping, and storytelling.

Data Analyst — structured problem-solving, spreadsheets, SQL, and visual explanation.

Growth Marketing Strategist — communication, experimentation, audience understanding, and analytics.

13. Demo narrative

The short walkthrough should follow one coherent user rather than show every feature. Use a profile such as “A final-year student who enjoys writing, visual work, and solving ambiguous problems, and wants a flexible career with visible impact.”

The recommended demo sequence is:

Open the landing page and establish the product promise.

Complete the four-step intake with realistic answers.

Show the editable inferred skills checkpoint.

Generate the Path Map and let the route animation complete.

Select Product Designer and inspect the explanation card.

Compare Product Designer with Data Analyst.

Open the learning bridge and mark the first action complete.

End on the saved path and the clear next action for the week.

The closing line should reinforce the product’s value: “PathFinder does not choose your future; it makes the next decision easier.”

14. Build priorities

Must have for the prototype

Technical implementation recommendation

A practical prototype stack is React with TypeScript, Tailwind CSS, a component library for accessible primitives, and a lightweight graph renderer for the Path Map. Use React Three Fiber or a similar WebGL layer only for decorative 3D objects, and ensure the primary information architecture still works without WebGL.

Keep model calls behind a server-side endpoint. Store the user profile, normalized skills, recommendation response, and completion state in a simple database or JSON-backed prototype store. Add schema validation, loading states, error states, and a seeded demo profile before polishing visual details.

15. Definition of done

The PathFinder prototype is ready for submission when a first-time user can complete the intake, understand the inferred profile, receive at least three explainable paths, inspect one route in detail, and identify a concrete next action without external guidance.

The experience should be visually recognizable within the first five seconds through its indigo navigation language, route-based visual metaphor, and calm 3D objects. It should remain usable when animations are disabled, when the AI response is delayed, and when a user changes their mind.

Final design principle: Make the future feel like a set of navigable paths, not a single irreversible choice.


### Table 1

| Area | Prototype outcome |
| Product thinking | The user moves from uncertainty to a concrete next step within one session. |
| AI quality | Recommendations are personalized, explainable, editable, and grounded in the user’s stated inputs. |
| UX quality | The journey is understandable without instructions and does not overload the user with career jargon. |
| Feasibility | A small team can demonstrate the full loop: intake → recommendations → path detail → action plan. |
| Demo readiness | A judge can understand the value in under two minutes and see a credible expansion path. |


### Table 2

| Persona | Situation | Main need | Design implication |
| The Explorer | A student knows broad interests but no target role. | Discover realistic options. | Use approachable language, examples, and visual exploration. |
| The Switcher | A professional wants to move into a new field. | Understand transferable skills and gaps. | Emphasize skill adjacency, effort estimates, and bridge roles. |
| The Planner | A user has a target role but lacks a sequence of actions. | Convert ambition into a roadmap. | Show milestones, learning order, and weekly actions. |


### Table 3

| Navigation item | Purpose |
| My Path | The current recommended roadmap and progress summary. |
| Explore | Alternative roles and adjacent paths. |
| Skills | Skill inventory, confidence levels, and gaps. |
| Plan | Weekly learning plan and next actions. |
| Profile | Goals, preferences, constraints, and editable intake data. |


### Table 4

| Stage | Inputs | Interaction |
| Where you are | Current role, study status, years of experience, location or remote preference. | Text input plus selectable chips. |
| What energizes you | Interests, favorite tasks, work style, preferred environments. | Multi-select cards with icons and examples. |
| What you can do | Skills, tools, projects, confidence level. | Skill chips with confidence sliders. |
| Where you want to go | Target outcomes, time horizon, salary or lifestyle priorities, learning availability. | Goal cards and a weekly-hours selector. |


### Table 5

| Comparison field | Display treatment |
| Fit score | Large number with an explanation label, never as the only signal. |
| Skill overlap | Segmented bar showing existing, adjacent, and missing skills. |
| Time to first milestone | Calendar icon plus an approximate range. |
| Learning effort | Low, medium, or high with a plain-language explanation. |
| Lifestyle alignment | Chips for remote, collaboration, autonomy, stability, or variety. |
| First step | One concrete action the user can complete this week. |


### Table 6

| Token | Hex | Use |
| ink-950 | #111827 | Main dark backgrounds, primary text on light surfaces. |
| ink-800 | #263246 | Secondary dark text and navigation. |
| slate-500 | #64748B | Supporting text and metadata. |
| cloud-50 | #F8FAFC | Page background. |
| cloud-100 | #F1F5F9 | Soft surfaces and input backgrounds. |
| white | #FFFFFF | Cards and elevated surfaces. |
| path-indigo | #5967F2 | Primary brand color and route highlights. |
| path-violet | #8B5CF6 | AI-generated or exploratory states. |
| signal-cyan | #22D3EE | Progress, active route nodes, data accents. |
| growth-lime | #B7F36B | Positive milestones and completion states. |
| warm-coral | #FB7185 | Warnings, trade-offs, and attention states. |
| sun-amber | #FBBF24 | Intermediate confidence and learning effort. |


### Table 7

| Attribute | Specification |
| Camera | Orthographic or 50 mm perspective; mostly three-quarter view. |
| Lighting | Large soft key light from upper left, cyan rim light from rear right. |
| Materials | Frosted glass, satin ceramic, brushed metal, and emissive route lines. |
| Background | Transparent for UI objects; deep ink gradient for hero scenes. |
| Shadows | Soft contact shadows with low opacity. |
| Geometry | Rounded, simple, memorable silhouettes; avoid photorealistic complexity. |
| Export | GLB for web scenes, PNG/WebP renders for lightweight fallback, SVG icons for controls. |


### Table 8

| Token | Duration | Use |
| motion-instant | 100 ms | Color, opacity, and hover feedback. |
| motion-fast | 180 ms | Button press, chip selection, small controls. |
| motion-base | 280 ms | Card transitions and panel changes. |
| motion-slow | 520 ms | Route drawing, graph transitions, modal entry. |
| motion-orbit | 8,000 ms | Decorative 3D rotation or orbital motion. |


### Table 9

| Moment | Sequence | Purpose |
| Intake stage change | Progress indicator fills, current panel fades and slides 12 px, next panel enters. | Preserve orientation. |
| AI generation | Route nodes appear in sequence, then explanations fade in. | Make the output feel constructed and explainable. |
| Path selection | Selected route thickens, alternative routes reduce opacity, inspector panel expands. | Establish focus without losing context. |
| Skill edit | Chip changes color, confidence dial updates, recommendation status shows “Ready to refresh.” | Show that user input controls the model. |
| Milestone completion | Checkbox completes, route segment glows, Growth Seed opens briefly. | Connect action to progress. |
| Save path | Bookmark morphs from outline to filled state with a small ring. | Provide lightweight confirmation. |


### Table 10

| Stage | User-facing label | Output |
| 1 | Understand your profile | Normalized skills, interests, goals, and constraints. |
| 2 | Find nearby possibilities | Candidate roles and adjacent paths. |
| 3 | Compare the trade-offs | Fit, gap, effort, and lifestyle alignment. |
| 4 | Build a practical bridge | Skills, milestones, and learning sequence. |
| 5 | Suggest the next step | One small action for the current week. |


### Table 11

| Type | Visual treatment | Example |
| Primary | Indigo fill, white text, subtle gradient on hover. | Build my path |
| Secondary | White or translucent surface with indigo border. | Keep comparing |
| Tertiary | Text-only with icon. | Edit profile |
| Positive | Lime fill with dark text. | Mark complete |
| Destructive | Coral text and soft coral background on hover. | Remove skill |


### Table 12

| Breakpoint | Layout behavior |
| Small mobile, under 640 px | Single-column flow; graph becomes timeline; inspector becomes bottom sheet. |
| Tablet, 640–1024 px | Two-column dashboard; compact inspector below or beside graph. |
| Desktop, over 1024 px | Three-zone dashboard with persistent left rail, graph canvas, and inspector panel. |
| Wide desktop, over 1440 px | Increase canvas breathing room, not text size; cap content width around 1480 px. |


### Table 13

| Priority | Feature |
| P0 | Guided intake with editable profile inputs. |
| P0 | Structured AI-generated recommendations or a convincing deterministic fallback. |
| P0 | Path Map with three career routes. |
| P0 | Path detail with reasons, skill gaps, milestones, and first-week actions. |
| P0 | Responsive layout and accessible basic controls. |
| P1 | Path comparison and priority tuning. |
| P1 | Save path and mark milestones complete. |
| P1 | One or two 3D hero objects with 2D fallbacks. |
| P2 | Full 3D interaction, richer profile history, exportable plans, and integrations. |

