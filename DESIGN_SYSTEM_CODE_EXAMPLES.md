# Design System - Real Code Examples

This document shows actual SCSS code from the 3 analyzed admin pages, demonstrating real implementation patterns.

---

## 1. ACTIVITY APPROVAL DASHBOARD
**Source**: [components/ActivityApproval/activity.approval.module.scss](../../frontend/src/components/ActivityApproval/activity.approval.module.scss)

### Colors & Variables
```scss
$primary-blue: #2563eb;
$bg-light: #f1f5f9;
$border-color: #e2e8f0;
```

### Main Container
```scss
.container {
    box-sizing: border-box;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 24px;
    padding: 24px;
    background: $bg-light;
    min-height: 100dvh;
    font-family: 'Inter', sans-serif;
}
```

### Stats Grid Layout
```scss
.statsGrid {
    flex: 0 0 auto;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;

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
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        span {
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
        }

        &.pending {
            border-left-color: #f59e0b;

            .up {
                color: #f59e0b;
                background: #fffbeb;
            }
        }

        &.approved {
            border-left-color: #10b981;

            .up {
                color: #10b981;
                background: #ecfdf5;
            }
        }

        &.overdue {
            border-left-color: #ef4444;

            .alert {
                color: white;
                background: #ef4444;
            }
        }
    }
}
```

### Sidebar with Tabs
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
        border-bottom: 1px solid $border-color;

        button {
            flex: 1;
            padding: 12px;
            border: none;
            background: none;
            font-size: 13px;
            color: #64748b;
            cursor: pointer;

            &.active {
                color: $primary-blue;
                border-bottom: 2px solid $primary-blue;
                font-weight: 600;
            }
        }
    }
}

.activityList {
    flex: 1;
    overflow-y: auto;
    padding: 16px;

    .emptyState {
        border: 1px dashed $border-color;
        border-radius: 12px;
        padding: 24px 16px;
        text-align: center;
        color: #64748b;
        background: #f8fafc;
    }

    .activityItem {
        display: flex;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid $border-color;
        margin-bottom: 12px;
        cursor: pointer;

        &.selected {
            border-color: $primary-blue;
            background: #eff6ff;
        }

        .itemThumb {
            width: 60px;
            height: 60px;
            background: #e2e8f0;
            border-radius: 8px;
            display: grid;
            place-items: center;
            overflow: hidden;

            .itemThumbImage {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
        }

        .itemInfo {
            flex: 1;

            .idLabel {
                font-size: 10px;
                color: #94a3b8;
            }

            h4 {
                font-size: 14px;
                margin: 4px 0;
                line-height: 1.4;
            }

            p {
                font-size: 12px;
                color: #64748b;
                margin: 0;
            }

            .deadlineTag {
                font-size: 10px;
                color: #f59e0b;
                font-weight: 600;
                margin-top: 8px;
                display: block;
            }
        }
    }
}

.mainLayout {
    flex: 1;
    display: flex;
    gap: 24px;
    min-height: 0;
}
```

### Error State
```scss
.errorState {
    padding: 12px 16px;
    border-radius: 12px;
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
}
```

---

## 2. MEMBERS MANAGEMENT PAGE
**Source**: [components/MembersManagerment/members.management.module.scss](../../frontend/src/components/MembersManagerment/members.management.module.scss)

### Variables & Container
```scss
$bg-main: #f0f3f9;
$primary-blue: #0056d2;
$text-dark: #1f2937;
$text-secondary: #6b7280;
$white: #ffffff;

.container {
    background-color: $bg-main;
    min-height: 100vh;
    padding: 40px;
    font-family: 'Inter', sans-serif;
}
```

### Page Header
```scss
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;

    .titleSection {
        h1 {
            font-size: 32px;
            font-weight: 800;
            color: $text-dark;
            margin-bottom: 8px;
        }

        p {
            color: $text-secondary;
            font-size: 14px;
        }
    }

    .btnAdd {
        background: $primary-blue;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 10px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 86, 210, 0.2);
    }
}
```

### Add Form Card
```scss
.addFormCard {
    background: $white;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;

    h3 {
        margin-bottom: 14px;
        font-size: 18px;
        font-weight: 700;
        color: $text-dark;
    }

    .addFormGrid {
        display: grid;
        grid-template-columns: 1fr 180px;
        gap: 12px;

        input,
        select {
            padding: 11px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            background: #f9fafb;
            font-size: 14px;
        }
    }

    .addFormActions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 14px;

        button {
            border: none;
            padding: 10px 14px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
        }
    }
}
```

### Table Styling
```scss
.memberCard {
    background: $white;
    border-radius: 20px;
    padding: 24px;

    .tableHeader {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h2 {
            font-size: 18px;
            font-weight: 700;
        }

        .searchInput {
            width: 260px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 14px;
            background: #f9fafb;
        }
    }

    table {
        width: 100%;
        border-collapse: collapse;

        th {
            text-align: left;
            font-size: 12px;
            color: $text-secondary;
            padding-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        tr.selected {
            background-color: #f8fafc;
        }

        td {
            padding: 16px 0;
            border-top: 1px solid #f1f5f9;
            vertical-align: middle;
        }
    }

    .emptyState {
        text-align: center;
        color: $text-secondary;
        padding: 16px 0;
        font-size: 14px;
    }
}
```

### Permission Panel (Right Sidebar)
```scss
.permissionPanel {
    background: $white;
    border-radius: 20px;
    padding: 30px;
    display: flex;
    flex-direction: column;
    gap: 24px;

    .userBrief {
        display: flex;
        align-items: center;
        gap: 15px;

        .panelAvatar {
            width: 60px;
            height: 60px;
            border-radius: 15px;
            object-fit: cover;
        }

        h3 {
            font-size: 18px;
            margin: 0;
        }

        span {
            color: $text-secondary;
            font-size: 13px;
        }
    }

    .formGroup {
        label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: $text-secondary;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .roleSelect {
            width: 100%;
            padding: 12px;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
        }
    }

    .permissionList {
        label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: $text-secondary;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .permissionHint {
            color: $text-secondary;
            font-size: 13px;
            margin-bottom: 8px;
        }

        .permItem {
            display: block;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
            font-size: 14px;
            color: $text-dark;

            span {
                display: inline-flex;
                align-items: center;
                gap: 8px;

                &::before {
                    content: "•";
                    color: $primary-blue;
                    font-size: 18px;
                    line-height: 1;
                }
            }
        }
    }

    .footerActions {
        margin-top: auto;
        display: flex;
        gap: 12px;

        button {
            flex: 1;
            padding: 12px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            border: none;

            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        }

        .btnSave {
            background: $primary-blue;
            color: white;
        }

        .btnCancel {
            background: #e5e7eb;
            color: $text-dark;
        }
    }

    .btnDanger {
        border: none;
        border-radius: 10px;
        padding: 11px 12px;
        font-weight: 600;
        background: #fee2e2;
        color: #b91c1c;
        cursor: pointer;
    }

    .emptyPanel {
        color: $text-secondary;
        font-size: 14px;
    }
}
```

### Role Badges
```scss
.badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;

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
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 34px;

        &:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
    }

    input:checked+.slider {
        background-color: $primary-blue;
    }

    input:checked+.slider:before {
        transform: translateX(22px);
    }
}
```

### User Info Row
```scss
.userInfo {
    display: flex;
    align-items: center;
    gap: 12px;

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
    }

    .details {
        strong {
            display: block;
            font-size: 14px;
        }

        small {
            color: $text-secondary;
            font-size: 12px;
        }
    }
}
```

---

## 3. MANAGEMENT PAGES - HERO & MODALS
**Source**: [pages/management.module.scss](../../frontend/src/pages/management.module.scss)

### Hero Section with Gradient
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

    &:active {
        transform: scale(0.98);
    }
}

.heroContent {
    max-width: 1200px;
    margin: 0 auto;

    div {
        p {
            margin: 0 0 8px 0;
        }

        .eyebrow {
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            opacity: 0.9;
        }

        h1 {
            margin: 0 0 12px 0;
            font-size: 32px;
            font-weight: 700;
            line-height: 1.2;
        }

        .heroText {
            margin: 0;
            font-size: 16px;
            opacity: 0.95;
            max-width: 600px;
        }
    }
}
```

### Content Area
```scss
.content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
}

.page {
    min-height: 100vh;
    background-color: #f5f5f5;
}
```

### Confirmation Modal
```scss
.confirmOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

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
        margin: 0 0 12px 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
    }

    p {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #666;
        line-height: 1.5;

        strong {
            color: #333;
            word-break: break-word;
        }
    }

    .warning {
        padding: 12px;
        background-color: #fef3c7;
        border-radius: 6px;
        color: #92400e;
        font-size: 13px;
        margin: 12px 0 !important;
    }
}

.confirmActions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 24px;
}

.cancelBtn,
.deleteBtn {
    padding: 10px 24px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 100px;
}

.cancelBtn {
    background-color: #f5f5f5;
    color: #333;

    &:hover:not(:disabled) {
        background-color: #e5e5e5;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.deleteBtn {
    background-color: #dc2626;
    color: white;

    &:hover:not(:disabled) {
        background-color: #b91c1c;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }
}
```

---

## 4. CATEGORY FORMS - MODAL & INPUT STYLING
**Source**: [components/ActivityCategoryManagement/category.form.module.scss](../../frontend/src/components/ActivityCategoryManagement/category.form.module.scss)

### Modal Layout
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
    z-index: 1000;
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
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #333;
    }
}
```

### Close Button
```scss
.closeBtn {
    background: none;
    border: none;
    font-size: 20px;
    color: #666;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background-color: #f5f5f5;
        color: #333;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}
```

### Form & Form Groups
```scss
.form {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.formGroup {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
        font-size: 14px;
        font-weight: 500;
        color: #333;
    }

    input {
        padding: 10px 12px;
        border: 1px solid #d5d5d5;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
        transition: all 0.2s ease;

        &:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        &:disabled {
            background-color: #f5f5f5;
            cursor: not-allowed;
            opacity: 0.6;
        }
    }
}
```

### Error Display
```scss
.error {
    padding: 10px 12px;
    background-color: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #991b1b;
    font-size: 13px;
    line-height: 1.4;
}
```

### Form Actions
```scss
.actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 12px;
}

.cancelBtn,
.submitBtn {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
}

.cancelBtn {
    background-color: #f5f5f5;
    color: #333;

    &:hover:not(:disabled) {
        background-color: #e5e5e5;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
}

.submitBtn {
    background-color: #4f46e5;
    color: white;

    &:hover:not(:disabled) {
        background-color: #4338ca;
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
}
```

---

## Key Patterns Summary

### Color Variables Used Across Files
- **Primary Blue**: `#2563eb` (ActivityApproval, OrganizerApproval), `#0056d2` (MembersManagement), `#4f46e5` (Forms)
- **Backgrounds**: `#f1f5f9`, `#f0f3f9`, `#f5f5f5` (all light neutrals)
- **Status Colors**: Consistent across all files (#10b981 green, #f59e0b amber, #ef4444 red)
- **Text**: `#1f2937` or `#333` primary, `#6b7280` or `#64748b` secondary

### Spacing Hierarchy
- **Grid/Flex Gaps**: 12px (inputs), 16px (common), 24px (major)
- **Padding**: 12px (tabs, items), 16px (cards, inputs), 20px (forms), 24px (modals)
- **Margins**: 8px (internal), 12px (sections), 24-30px (major sections)

### Border Radius Sequence
- Inputs: `6px`
- Cards: `8-12px`
- Large Panels: `16-20px`
- Badges: `20px` (full pill)
- Modals: `8px`

### Interactive Elements
- **Transitions**: All use `0.2s ease`
- **Hover**: Usually background color or opacity change
- **Active**: `transform: scale(0.98)` for buttons
- **Disabled**: `opacity: 0.6` or `cursor: not-allowed`
- **Focus**: Border color + subtle shadow (e.g., `0 0 0 3px rgba(79, 70, 229, 0.1)`)
