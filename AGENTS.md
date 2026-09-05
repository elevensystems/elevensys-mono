# AGENTS.md — UI conventions for Elevensys Mono

Rules for **creating or editing any UI** in this repo — `apps/web`, `apps/admin`, `apps/insight`,
`apps/pulse`, and `packages/ui`. They are conventions, not preferences: a page that breaks one
should be fixed rather than copied.

`CLAUDE.md` covers architecture, imports, naming, and testing. This file covers what a screen looks
like and where things go on it.

---

## 1. Page skeleton

Every page is the same three layers, in this order:

```
MainLayout          → sidebar, sticky header, breadcrumb, site banner
  page shell        → the one width and gutter (never a bespoke container)
    page header     → title, optional description, the one primary action
    content         → Panels and Cards
```

| App            | Shell                               | Header                               |
| -------------- | ----------------------------------- | ------------------------------------ |
| `admin`        | `PageShell` (`components/layouts/`) | `PageHeader` (`components/layouts/`) |
| `web`, `pulse` | `container mx-auto px-4 py-12`      | `ToolPageHeader`                     |

**Never hand-roll the shell.** `container mx-auto px-2 py-8` next to
`mx-auto w-full max-w-[100rem] px-6 py-6` is how five admin pages ended up at four different widths.
In admin the shell is a component; in web and pulse it is the string above, copied exactly.

Widths are capped, never full-bleed — long form fields and prose become unreadable across a wide
monitor. Admin caps at `100rem`; `container` caps at `96rem`.

### Adding a page

1. `MainLayout` → shell → header → content. No `<h1>` written by hand: the header component owns it,
   so every page's title is the same size, weight, and spacing.
2. One `<h1>` per page. If a client component renders the header (see §2), the server page must not
   also render one.
3. Content goes in `Panel`s or `Card`s (§3) — not loose `<div>`s with ad-hoc borders.

---

## 2. The primary action goes in the page title row

The title row is the page's scope, so the action that acts on the whole page belongs there, at the
end of the row:

```tsx
<PageHeader
  title="Site Banner"
  actions={
    <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
      {isSubmitting ? <Spinner /> : <Megaphone />}
      Publish
    </Button>
  }
/>
```

**Conditions — all three hold, or the button goes elsewhere:**

- **Exactly one primary action.** The title row states what this page does. A page with two
  independently-saved sections has no page-level action; each section saves itself.
- **Primary only.** Destructive, per-item, and selection-scoped actions stay next to what they
  affect — Delete in the composer footer, bulk delete in the table's own header (`urlify-table.tsx`
  shows both).
- **The form fits roughly one viewport, or the header is sticky.** Otherwise the user types at the
  bottom of a long form while the submit button is scrolled off the top. This is the failure mode
  that makes this pattern feel broken; check it before adding a long form to a page that uses it.

**One submit control per page.** If Publish is in the header, the form footer does not also carry
Save. One action, one label, one place.

### Wiring a submit button that lives outside its form

Use native form association — `<form id={FORM_ID}>` and `<Button type="submit" form={FORM_ID}>`. It
keeps Enter-to-submit and browser validation intact, and needs no ref or imperative handle.

### When the action needs client state

A `disabled={!isDirty}` or a spinner means the button needs the form's state, which means the
**client component renders the header**, passing its own button as `actions`. The server page then
renders the header _without_ actions on the branches that have nothing to act on — a failed read, an
unconfigured store — and returns early:

```tsx
// The editor owns the title row, because Publish sits in it and needs the
// composer's state. The branches below have nothing to publish.
if (snapshot?.configured && !loadError) {
  return (
    <MainLayout>
      <PageShell>
        <ToolsVisibilityForm snapshot={snapshot} />
      </PageShell>
    </MainLayout>
  );
}
```

Do **not** conditionally render a second hand-written `<h1>` alongside the client one. That is how
the same title ended up in two files with two different sets of classes.

---

## 3. `Panel` vs `Card`

Both live in `@workspace/ui/components/`. They are not interchangeable.

**`Panel`** — the workspace unit. Its header sits on a tinted ground (`--surface`) and its body is a
card inset into that ground, so a column of panels reads as one surface with labelled regions. Use
it for the regions of an editor, a list, or a table.

```tsx
<Panel>
  <PanelHeader>
    <PanelTitle>Banners</PanelTitle>
    <PanelActions>{/* actions and notes, pushed right */}</PanelActions>
  </PanelHeader>

  <PanelBody>{/* flush list or table, or add p-4 for a padded block */}</PanelBody>
</Panel>
```

- `PanelTitle` is small and uppercase, in full-strength `text-foreground`. Size and letterspacing do
  the labelling, so a panel name stays legible against its tinted ground — never bump one to
  `text-lg` to make it stand out, and never mute it.
- `PanelBody` carries no padding. A body is as often a flush `<ul className="divide-y">` or a
  `<Table>` as it is a padded block; pass `className="p-4"` when you need one.
- How the body meets the panel's edge is the `dense` variant on `Panel`, not something the body
  sets. `dense` (the default) pulls the body's border under the panel's own with 1px negative
  margins so the two read as a single line; `dense={false}` keeps a 1px gutter instead, so the
  tinted ground frames the body on every side.

**`Card`** — the standalone unit. Its own padding and shadow make it read as an object on the page.
Use it for a summary tile, a dashboard link, or a single self-contained form. The admin dashboard's
tool tiles are the reference.

**Neither of these is a default wrapper.** A page where everything is in a card has no structure at
all. And never nest one in another.

**Never hand-roll either.** `bg-card overflow-hidden rounded-xl border` written inline is a `Panel`
that will drift; `overflow-hidden rounded-lg border` around a table is the same thing at a different
radius. Both existed here and both are gone.

---

## 4. Styling

- Tailwind v4 utilities, `cn()` from `@workspace/ui/lib/utils` for conditionals.
- **Semantic tokens only** — `bg-card`, `bg-surface`, `text-muted-foreground`, `border`. No raw hex,
  no `bg-gray-100`, no `dark:` pairs hand-written for something a token already covers.
- `--surface` is the inset step off `--card`: panel grounds, preview strips, segmented tracks.
- Need a colour the tokens do not have? Add a CSS variable in `packages/ui/src/styles/globals.css`
  with both light and dark values. Do not approximate with the nearest existing token.
- Every new surface must be checked in both themes.

## 5. Components

- A component used by more than one app goes in `packages/ui/src/components/`. App-specific ones go
  in that app's `components/`; page-private ones in the route's `_components/`.
- Add shadcn components to `packages/ui`, never to an app:
  `cd packages/ui && pnpm dlx shadcn@latest add [name]`.
- Before writing a new primitive, check `packages/ui/src/components/` — there are ~58 of them.

## 6. Forms

- `@tanstack/react-form`, with `Field` / `FieldLabel` / `FieldMessage` from `@workspace/ui`.
- Errors show on the field, after it has been touched. Outcomes go to `toast` from sonner.
- Buttons disable while submitting and show a `Spinner`.
- Destructive actions go through `AlertDialog`, never a bare confirm.
- Two `useForm` traps, both already paid for once — see the site-banner notes in `CLAUDE.md`: do not
  call `form.reset(values)`, and keep whatever builds `defaultValues` pure.

## 7. Layout stability

Nothing above the fold may move under the cursor.

- Prefer laying out every option at once over expand/collapse. The site-banner rail lists all five
  targets — a fixed ~180px — precisely so switching target never shifts the composer beside it.
- Reserve space for text that changes: `min-h-5` on a subtitle that swaps between states beats a
  line that collapses when empty.
- Never decide layout from `Date.now()` during SSR. Read the clock through a `useSyncExternalStore`
  that returns `null` until mounted, and render the "unknown" branch for `null` — see `useNow()` in
  `site-banner-form.tsx`.

## 8. Accessibility

- Every input has a `<FieldLabel htmlFor>`. Icon-only buttons have `aria-label`.
- Custom radio and checkbox visuals use a real `<input className="peer sr-only">` with
  `peer-checked:` styling — never a `<div onClick>`.
- Grouped controls need `role="radiogroup"` + `aria-labelledby`.
- Keep the focus ring (`peer-focus-visible:ring-ring`); do not style it away.

## 9. Known divergence

`admin`'s `PageHeader` renders `text-2xl font-semibold tracking-tight`; `web` and `pulse`'s
`ToolPageHeader` renders `text-2xl font-bold mb-2`. Both accept an `actions` slot and follow §2.
Converge them when something else brings you into those files — don't restyle every tool page for it
alone.
