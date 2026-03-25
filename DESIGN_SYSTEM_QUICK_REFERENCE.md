# Design System Quick Reference

## Color Palette

### Semantic Status Colors
```
Success:        #10b981  (emerald-500)   | Background: #ecfdf5
Pending:        #f59e0b  (amber-500)     | Background: #fffbeb
Error:          #ef4444  (red-500)       | Background: #fef2f2
Critical:       #b91c1c  (red-800)       | Background: #fee2e2
Danger (Dark):  #dc2626  (red-600 hover)
```

### Primary Actions
```
Primary Blue:   #2563eb  (MD style)      | Alternative: #0056d2
Dark on Hover:  #1d4ed8
Form Focus:     #4f46e5  (indigo-600)
Darker:         #4338ca  (indigo-700 hover)
```

### Backgrounds & Surfaces
```
Page BG:        #f1f5f9  (slate-100)     | Alt: #f0f3f9, #f5f5f5
Card:           #ffffff
Input BG:       #f9fafb  (slate-50)
Hover Light:    #f8fafc
Divider:        #f1f5f9
```

### Neutral Text
```
Primary (H1-H3): #1f2937 or #333
Secondary:       #6b7280 or #64748b
Muted Label:     #94a3b8
Placeholder:     #999 or #bbb
```

### Borders
```
Light:    #e2e8f0 (slate-200)
Medium:   #e5e7eb (gray-200)
Dark:     #d5d5d5
Dashed:   #e2e8f0
```

---

## Typography Scale

| Tier    | Size  | Weight | Use Case |
|---------|-------|--------|----------|
| h1      | 32px  | 700-800| Page title, hero |
| h2/h3   | 18-20px| 600-700| Sections, cards |
| label   | 12-13px| 500-600| Form labels, table headers |
| body    | 14px  | 400    | Body text, descriptions |
| small   | 11-12px| 400-500| Badges, meta info |

---

## Spacing Reference

| Token | Value | Common Usage |
|-------|-------|--------------|
| xs    | 4px   | Badge padding |
| sm    | 8px   | Icon gaps |
| md    | 12px  | Form gaps, item margins |
| lg    | 16px  | Cell padding, card padding |
| xl    | 20px  | Card padding |
| 2xl   | 24px  | Layout gaps, major margins |
| 3xl   | 40px  | Page padding |

---

## Component Defaults

### Buttons
```
Padding:       10px 20px (vertical × horizontal)
Border Radius: 6px
Font Size:     14px
Font Weight:   500-600
Height:        ~40px (typical)
```

### Form Inputs
```
Padding:       10-12px
Border Radius: 6-10px
Border:        1px solid #e5e7eb
Background:    #f9fafb
Font Size:     14px
Focus Border:  #4f46e5
Focus Shadow:  0 0 0 3px rgba(79, 70, 229, 0.1)
```

### Cards
```
Padding:       16-30px
Border Radius: 12px
Background:    white
Shadow:        0 4px 20px rgba(0, 0, 0, 0.15)
```

### Tables
```
Header Font:   12px, 500-700 weight, UPPERCASE, letter-spacing 0.5px
Cell Padding:  16px vertical, 0px horizontal
Border:        1px solid #f1f5f9
Row Hover:     background #f8fafc
```

### Modals
```
Width:         90%, max 500px
Border Radius: 8px
Padding:       24px
Overlay:       rgba(0, 0, 0, 0.5)
Z-Index:       1000 (or 2000 for confirm)
Shadow:        0 4px 20px rgba(0, 0, 0, 0.15)
```

---

## Icon & Avatar Sizes

```
Stat Card Icon:    Not specified, appears inline
Activity Thumb:    60×60px, border-radius 8px
Avatar (Small):    40×40px, border-radius 50%
Avatar (Large):    60×60px, border-radius 15px
```

---

## Transition & Animation

```
Standard Duration:  0.2s
Timing Function:    ease
Button Scale:       transform: scale(0.98) on active
Disable Opacity:    0.6
Switch Animation:   0.4s
```

---

## Responsive Breakpoints

| Screen | Breakpoint | Changes |
|--------|----------|---------|
| Desktop | ≥769px | Full width, 40px padding, 32px h1 |
| Mobile  | ≤768px | 16px padding, 24px h1, stack layouts |

---

## CSS Variable Suggestions (for refactoring)

```scss
// Colors
--color-primary-blue: #2563eb;
--color-primary-blue-dark: #1d4ed8;
--color-success: #10b981;
--color-success-light: #ecfdf5;
--color-warning: #f59e0b;
--color-warning-light: #fffbeb;
--color-error: #ef4444;
--color-error-light: #fef2f2;
--color-critical: #b91c1c;

// Neutrals
--color-bg-page: #f1f5f9;
--color-bg-card: #ffffff;
--color-bg-input: #f9fafb;
--color-text-primary: #1f2937;
--color-text-secondary: #6b7280;
--color-text-muted: #94a3b8;
--color-border-light: #e2e8f0;
--color-border-medium: #e5e7eb;

// Typography
--font-family: 'Inter', sans-serif;
--font-weight-bold: 700;
--font-weight-semibold: 600;
--font-weight-medium: 500;
--font-weight-regular: 400;

// Spacing
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 20px;
--space-2xl: 24px;
--space-3xl: 40px;

// Sizing
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 20px;
--radius-full: 9999px;

// Shadows
--shadow-sm: 0 4px 20px rgba(0, 0, 0, 0.15);
--shadow-md: 0 10px 40px rgba(0, 0, 0, 0.2);

// Transitions
--transition-base: all 0.2s ease;
```

---

## Common Pattern Snippets

### Button Variants

#### Primary (CTA)
```scss
background-color: #2563eb;
color: white;
padding: 10px 20px;
border-radius: 6px;
font-weight: 600;
box-shadow: 0 4px 12px rgba(0, 86, 210, 0.2);

&:hover {
    background-color: #1d4ed8;
}
```

#### Secondary
```scss
background-color: #e5e7eb;
color: #333;
padding: 10px 20px;
border-radius: 6px;
font-weight: 500;

&:hover {
    background-color: #d1d5db;
}
```

#### Danger
```scss
background-color: #dc2626;
color: white;
padding: 10px 24px;

&:hover {
    background-color: #b91c1c;
}
```

### Badge Pattern

```scss
padding: 4px 12px;
border-radius: 20px;
font-size: 11px;
font-weight: 700;

&.admin {
    background: #e0f2fe;
    color: #0369a1;
}

&.success {
    background: #ecfdf5;
    color: #10b981;
}
```

### Selected List Item

```scss
border: 1px solid #2563eb;
background: #eff6ff;
```

### Form Focus State

```scss
border-color: #4f46e5;
box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
outline: none;
```

### Status Indicator (Colored Left Border)

```scss
border-left: 4px solid;
padding: 16px;
border-radius: 12px;

&.pending {
    border-left-color: #f59e0b;
}

&.approved {
    border-left-color: #10b981;
}

&.error {
    border-left-color: #ef4444;
}
```

---

## File Reference

| Component | File Path | Key Colors/Sizes |
|-----------|-----------|------------------|
| Activity Approval | `components/ActivityApproval/activity.approval.module.scss` | #2563eb, 5-col grid, 380px sidebar |
| Organizer Approval | `components/OrganizerApproval/organizer.approval.module.scss` | #2563eb (same as Activity) |
| Members Management | `components/MembersManagerment/members.management.module.scss` | #0056d2, 2-col layout, table styling |
| Management Pages | `pages/management.module.scss` | Hero gradient, modals, buttons |
| Category Forms | `components/ActivityCategoryManagement/category.form.module.scss` | #4f46e5 forms, modal focus ring |

---

## Design System Consistency Checklist

Use this when implementing new components:

- [ ] Colors from approved palette only
- [ ] Spacing uses 4px multiples
- [ ] Border radius follows pattern (6/8/12/16/20) 
- [ ] Typography uses Inter font only
- [ ] Form inputs have focus states
- [ ] Buttons have hover + active states
- [ ] Disabled states have reduced opacity
- [ ] Error states use red with light background
- [ ] Success states use green with light background
- [ ] All interactive elements have 0.2s transitions
- [ ] Modals have proper z-index & dark overlay
- [ ] Table headers are UPPERCASE with letter-spacing
- [ ] Status badges are semantic (color-coded by role/status)
- [ ] Padding/margin follows spacing scale
- [ ] Mobile viewport has reduced padding (16px vs 40px)
