# Design System & Styling Patterns Analysis

## Project Overview
This document compiles the design system patterns used across 3 major admin/management pages in the extracurricular management application.

---

## 1. COLOR SCHEME ANALYSIS

### Primary Colors
- **Primary Blue (Main Action)**: `#2563eb` - Used in ActivityApproval/OrganizerApproval
  - Alternative Primary Blue: `#0056d2` - Used in MembersManagement
  - Darker shade: `#4f46e5` - Used in category forms
  - Very dark: `#4338ca` - Hover state for buttons

### Status Colors (Semantic)
- **Success/Approved**: `#10b981` (Green) with background `#ecfdf5`
- **Pending/Warning**: `#f59e0b` (Amber) with background `#fffbeb`
- **Error/Rejected**: `#ef4444` (Red) with background `#fef2f2`, `#fee2e2`
- **Danger**: `#dc2626` (Dark Red) - For delete actions, darkens to `#b91c1c` on hover
- **Critical Red**: `#b91c1c` - Text color for errors

### Neutral Colors
- **Primary Background**: `#f1f5f9` or `#f0f3f9` - Page background (light blue-gray)
- **Secondary Background**: `#f5f5f5` - Alternative page background (neutral gray)
- **Card Background**: `#ffffff` (White) - All cards, panels, tables
- **Surface Light**: `#f9fafb` - Input backgrounds, subtle backgrounds
- **Hover Light**: `#f8fafc` - Row hover, selected states
- **Even Light**: `#ecfdf5` - Alternative background colors

### Border Colors
- **Light Border**: `#e2e8f0` - Standard dividers
- **Medium Border**: `#e5e7eb` - Form inputs, table borders
- **Dark Border**: `#d5d5d5` - Alternative darker border
- **Subtle Border**: `#f1f5f9` - Minimal separation (table borders)
- **Dashed Border**: `#e2e8f0` - Empty states

### Text Colors
- **Primary Text**: `#1f2937` or `#333` - Headlines, primary content
- **Secondary Text**: `#6b7280` or `#64748b` - Labels, descriptions
- **Muted Text**: `#94a3b8` - Sub-labels, IDs
- **Light Text**: `#999` or `#bbb` - Placeholders, hints
- **White Text**: `#ffffff` - White text on colored backgrounds

### Role-based Badge Colors
- **Admin**: Background `#e0f2fe`, Text `#0369a1`
- **Manager**: Background `#dcfce7`, Text `#15803d`
- **Moderator**: Background `#f3f4f6`, Text `#4b5563`
- **Member**: Background `#fef3c7`, Text `#92400e`

---

## 2. TYPOGRAPHY & SPACING

### Font Family
- **Primary Font**: `'Inter', sans-serif`

### Font Sizes
| Component | Size | Weight | Line Height |
|-----------|------|--------|------------|
| Page Heading (H1) | 32px | 700 | 1.2 |
| Subheading (H2/H3) | 18-20px | 600-700 | 1.4 |
| Card Title | 18px | 700 | - |
| Label/Eyebrow | 12-13px | 500-600 | - |
| Body Text | 14px | 400 | 1.5 |
| Small Text | 11-12px | 400-500 | - |
| Form Text | 14px | 400 | - |
| Table Headers | 12px | 500 | - |

### Font Weights
- **Bold Headers**: 700-800 (h1, h2, section titles)
- **Semi-bold**: 600 (labels, buttons, emphasized text)
- **Medium**: 500 (form labels, tab text)
- **Regular**: 400 (body text, descriptions)

### Spacing Scale
| Size | Value | Usage |
|------|-------|-------|
| XS | 4px | Badge padding |
| S | 6px | Small paddings |
| SM | 8px | Icon gaps, small margins |
| M | 12px | Content padding, gaps |
| L | 16px | Card/cell padding |
| XL | 20px | Card padding |
| 2XL | 24px | Layout gaps, section margins |
| 3XL | 30-40px | Page padding, major sections |

### Padding Patterns
- **Page Level**: 40px (desktop), 20px (mobile)
- **Card/Panel**: 16-30px
- **Form Input**: 10-12px horizontal, 10-11px vertical
- **Table Cell**: 16px vertical, 0px horizontal
- **Button**: 10-12px vertical, 14-24px horizontal
- **Status Card**: 16px
- **Sidebar Padding**: 16px

### Gap Patterns
- **Grid Gap**: 16px (standard), 24px (large gaps)
- **Flex Gap**: 12px (forms), 24px (layout), 8px (icons)
- **List Gap**: 12px (items)

---

## 3. COMPONENT STYLING

### Button Styles

#### Primary Button
```scss
.primaryBtn {
    background-color: #2563eb; // or #0056d2, #4f46e5
    color: white;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background-color: #1d4ed8; // or darker variant
    }

    &:active {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
}
```

#### Secondary Button
```scss
.secondaryBtn {
    background-color: #e5e7eb;
    color: #333;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    border: none;

    &:hover {
        background-color: #d1d5db;
    }
}
```

#### Danger Button
```scss
.dangerBtn {
    background-color: #dc2626;
    color: white;
    padding: 10px 24px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;

    &:hover {
        background-color: #b91c1c;
    }
}
```

#### Icon Button (Transparent)
```scss
.iconBtn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
        background-color: #f5f5f5;
    }
}
```

### Form Input Styling
```scss
input, select {
    padding: 10-12px;
    border: 1px solid #e5e7eb; // or #d5d5d5
    border-radius: 6-10px;
    font-size: 14px;
    font-family: inherit;
    background-color: #f9fafb;
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        background-color: white;
    }

    &:disabled {
        background-color: #f5f5f5;
        opacity: 0.6;
        cursor: not-allowed;
    }

    &::placeholder {
        color: #bbb;
    }
}
```

### Form Group Layout
```scss
.formGroup {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
        font-size: 12px;
        font-weight: 700;
        color: #6b7280; // text-secondary
        text-transform: uppercase;
        margin-bottom: 10px;
    }
}
```

### Add Form Card (MembersManagement pattern)
```scss
.addFormCard {
    background: white;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;

    h3 {
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 14px;
    }

    .addFormGrid {
        display: grid;
        grid-template-columns: 1fr 180px;
        gap: 12px;
    }

    .addFormActions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 14px;
    }
}
```

### Table Styling
```scss
table {
    width: 100%;
    border-collapse: collapse;

    th {
        text-align: left;
        font-size: 12px;
        color: #6b7280;
        padding-bottom: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 500;
    }

    td {
        padding: 16px 0;
        border-top: 1px solid #f1f5f9;
        vertical-align: middle;
    }

    tr.selected {
        background-color: #f8fafc;
    }
}
```

### List Item Styling
```scss
.activityItem {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &.selected {
        border-color: #2563eb;
        background: #eff6ff;
    }

    .itemThumb {
        width: 60px;
        height: 60px;
        background: #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
    }
}
```

### Search Input
```scss
.searchInput {
    width: 260px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 14px;
    background: #f9fafb;
    transition: all 0.2s ease;

    &:focus {
        outline: none;
        border-color: #2563eb;
        background: white;
    }
}
```

### Toggle Switch
```scss
.switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 22px;

    input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        background-color: #ccc;
        transition: 0.4s;
        border-radius: 34px;
        cursor: pointer;

        &:before {
            content: "";
            position: absolute;
            height: 18px;
            width: 18px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            border-radius: 50%;
            transition: 0.4s;
        }
    }

    input:checked + .slider {
        background-color: #2563eb;
    }

    input:checked + .slider:before {
        transform: translateX(22px);
    }
}
```

### Status Badges
```scss
.badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    display: inline-block;

    // Role variants
    &.admin {
        background: #e0f2fe;
        color: #0369a1;
    }

    &.manager {
        background: #dcfce7;
        color: #15803d;
    }

    &.moderator {
        background: #f3f4f6;
        color: #4b5563;
    }

    &.member {
        background: #fef3c7;
        color: #92400e;
    }

    // Status variants
    &.pending {
        background: #fffbeb;
        color: #f59e0b;
    }

    &.approved {
        background: #ecfdf5;
        color: #10b981;
    }
}
```

### Stat Card (Dashboard)
```scss
.statCard {
    background: white;
    padding: 16px;
    border-radius: 12px;
    border-left: 4px solid #cbd5e1;

    label {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
    }

    .value {
        font-size: 24px;
        font-weight: 700;
        margin-top: 8px;
    }

    &.pending {
        border-left-color: #f59e0b;
    }

    &.approved {
        border-left-color: #10b981;
    }

    &.overdue {
        border-left-color: #ef4444;
    }
}
```

### Error State
```scss
.error {
    padding: 10px 12px;
    background-color: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #b91c1c;
    font-size: 13px;
    line-height: 1.4;
}

.errorState {
    padding: 12px 16px;
    border-radius: 12px;
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
}
```

### Empty State
```scss
.emptyState {
    border: 1px dashed #e2e8f0;
    border-radius: 12px;
    padding: 24px 16px;
    text-align: center;
    color: #64748b;
    background: #f8fafc;
    font-size: 14px;
}
```

---

## 4. MODAL STYLING

### Modal Overlay
```scss
.modalOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; // or 2000 for confirm dialogs
}

.modal {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid #e5e5e5;

    h2 {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        margin: 0;
    }
}

.form {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 12px;
}
```

### Confirmation Modal
```scss
.confirmModal {
    background-color: white;
    border-radius: 12px;
    padding: 32px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    text-align: center;

    .confirmIcon {
        font-size: 48px;
        color: #f59e0b;
        margin-bottom: 16px;
    }

    h3 {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0 0 12px 0;
    }

    p {
        font-size: 14px;
        color: #666;
        line-height: 1.5;
        margin: 0 0 12px 0;
    }

    .warning {
        padding: 12px;
        background-color: #fef3c7;
        border-radius: 6px;
        color: #92400e;
        font-size: 13px;
        margin: 12px 0;
    }
}

.confirmActions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 24px;
}
```

---

## 5. HERO/HEADER SECTIONS

### Hero Section Gradient
```scss
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 20px;
    position: relative;
}

.backButton {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 10px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    margin-bottom: 24px;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
    }
}

.heroContent {
    max-width: 1200px;
    margin: 0 auto;

    .eyebrow {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        opacity: 0.9;
        margin: 0 0 8px 0;
    }

    h1 {
        font-size: 32px;
        font-weight: 700;
        line-height: 1.2;
        margin: 0 0 12px 0;
    }

    .heroText {
        font-size: 16px;
        opacity: 0.95;
        max-width: 600px;
        margin: 0;
    }
}
```

### Management Page Header (Alternative)
```scss
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;

    .titleSection h1 {
        font-size: 32px;
        font-weight: 800;
        color: #1f2937;
        margin-bottom: 8px;
    }

    .titleSection p {
        color: #6b7280;
        font-size: 14px;
    }

    .btnAdd {
        background: #0056d2;
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 12px rgba(0, 86, 210, 0.2);
    }
}
```

---

## 6. LAYOUT PATTERNS

### Main Container
```scss
.container {
    box-sizing: border-box;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 24px;
    padding: 24px;
    background: #f1f5f9;
    min-height: 100dvh;
    font-family: 'Inter', sans-serif;
}
```

### Main Layout (Dashboard)
```scss
.mainLayout {
    flex: 1;
    display: flex;
    gap: 24px;
    min-height: 0;
}
```

### Grid Layout (2-Column)
```scss
.mainLayout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 24px;
}
```

### Sidebar
```scss
.sidebar {
    width: 380px;
    background: white;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;

    .tabs {
        display: flex;
        border-bottom: 1px solid #e2e8f0;

        button {
            flex: 1;
            padding: 12px;
            border: none;
            background: none;
            font-size: 13px;
            color: #64748b;
            cursor: pointer;

            &.active {
                color: #2563eb;
                border-bottom: 2px solid #2563eb;
                font-weight: 600;
            }
        }
    }
}
```

### Stats Grid
```scss
.statsGrid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
}
```

### Content Area
```scss
.content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
}
```

### Permission Panel
```scss
.permissionPanel {
    background: white;
    border-radius: 20px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    gap: 24px;

    .userBrief {
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .formGroup {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .footerActions {
        margin-top: auto;
        display: flex;
        gap: 12px;

        button {
            flex: 1;
            padding: 12px;
            border-radius: 10px;
        }
    }
}
```

---

## 7. REAL-WORLD EXAMPLES

### Example 1: ActivityApprovalPage
**File**: [ActivityApproval/activity.approval.module.scss](../../frontend/src/components/ActivityApproval/activity.approval.module.scss)
- Uses `#2563eb` primary blue
- `#f1f5f9` page background
- 5-column stats grid with colored left borders (4px)
- 380px fixed sidebar width
- Main layout with flexbox and 24px gaps
- Selected state: blue border + light blue background `#eff6ff`

### Example 2: OrganizerApprovalPage
**File**: [OrganizerApproval/organizer.approval.module.scss](../../frontend/src/components/OrganizerApproval/organizer.approval.module.scss)
- Identical styling to ActivityApproval (same module structure)
- Demonstrates design consistency across admin pages

### Example 3: MembersManagementPage
**File**: [MembersManagement/members.management.module.scss](../../frontend/src/components/MembersManagerment/members.management.module.scss)
- Uses `#0056d2` primary blue with `#f0f3f9` background
- 2-column main layout: `1fr 400px`
- Form card with 16px border-radius
- Table with uppercase headers and uppercase letter-spacing
- Permission panel with role-based colors
- User avatar: 60px with 15px border-radius

### Example 4: Management Pages (Hero & Modals)
**File**: [pages/management.module.scss](../../frontend/src/pages/management.module.scss)
- Gradient hero: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Confirmation modals with white text on dark overlay
- Warning boxes: `#fef3c7` background with `#92400e` text
- Delete buttons: `#dc2626` primary with `#b91c1c` hover

### Example 5: Category Management Forms
**File**: [ActivityCategoryManagement/category.form.module.scss](../../frontend/src/components/ActivityCategoryManagement/category.form.module.scss)
- Primary form color: `#4f46e5`
- Form focus ring: `0 0 0 3px rgba(79, 70, 229, 0.1)` (very light opacity)
- Modal max-width: 500px
- Form group gap: 20px
- Error styling with light red background

---

## 8. RESPONSIVE CONSIDERATIONS

### Mobile Breakpoint (≤768px)
- Page padding: 16px (vs 40px desktop)
- Hero h1: 24px (vs 32px)
- Hero text: 14px (vs 16px)
- Stack 2-column layouts to single column via media query

### Spacing Adjustments
- Card padding: 20px → 16px on mobile
- Gap sizes typically reduced by 25%

---

## 9. SHADOW & ELEVATION

### Shadow Patterns
- **Subtle**: `0 4px 20px rgba(0, 0, 0, 0.15)` - Modals
- **Emphasis**: `0 10px 40px rgba(0, 0, 0, 0.2)` - Confirm dialogs
- **Button**: `0 4px 12px rgba(0, 86, 210, 0.2)` - Primary buttons

---

## 10. TRANSITIONS & INTERACTIONS

### Standard Transitions
```scss
transition: all 0.2s ease;
```

### Hover Effects
- Button scale: `transform: scale(0.98)` on active
- Opacity changes: common for disabled states
- Background color transitions: 0.2s ease

### Focus Styles
- Focus ring: `0 0 0 3px rgba(79, 70, 229, 0.1)`
- Border color change to primary blue
- Subtle elevation increase

---

## Key Takeaways for Your Implementation

1. **Cohesive Palette**: Blue primary (`#2563eb` or `#0056d2`), with semantic colors for status
2. **Consistent Spacing**: 16px gaps for most layouts, 12px for forms, 24px for major sections
3. **Generous Padding**: Cards use 16-30px padding; creates breathing room
4. **Semantic Status**: Always use consistent colors for success (green), warning (amber), error (red)
5. **Typography**: Inter font, weight hierarchy (700→600→500→400), generous line-heights
6. **Border Radius**: 6-8px for inputs, 12px for cards, 16-20px for large containers
7. **Focus States**: Always implement focus rings for accessibility
8. **Hover Effects**: Subtle color/shadow changes, minimal Transform usage
9. **Modal Patterns**: 50% opacity overlay, max-width containers, generous padding
10. **Role Badges**: Use pastel backgrounds with darker text for accessibility
