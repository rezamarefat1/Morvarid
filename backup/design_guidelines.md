# Design Guidelines: Morvarid Poultry Management System

## Design Approach
**Selected Approach:** Design System (Utility-Focused)
- **Justification:** Farm management software prioritizes efficiency, data clarity, and quick task completion over visual flair
- **Reference System:** Adapted from Material Design and Fluent Design principles for data-heavy applications
- **Cultural Adaptation:** Full RTL optimization with Persian design sensibilities

## Core Design Principles
1. **Efficiency First:** Minimize clicks to complete common tasks (production entry, sales invoice creation)
2. **Data Clarity:** Clear hierarchy for numerical data and statistics
3. **Mobile Priority:** Farmers primarily use mobile devices in field conditions
4. **RTL Excellence:** Natural right-to-left flow, not just flipped LTR

## Typography

**Font Family:**
- Primary: Vazirmatn (preferred) or IranSans
- Load via CDN or local files
- Fallback: system-ui, Tahoma

**Type Scale:**
- Page Titles: text-2xl md:text-3xl font-bold
- Section Headers: text-xl md:text-2xl font-semibold
- Card Titles: text-lg font-semibold
- Body Text: text-base
- Labels/Metadata: text-sm
- Caption/Helper: text-xs

**Number Display:** Use tabular-nums for all numerical data (production counts, sales figures)

## Layout System

**Spacing Primitives:** Use Tailwind units of 3, 4, 6, 8, 12
- Component padding: p-4 md:p-6
- Section spacing: space-y-6 md:space-y-8
- Card gaps: gap-4 md:gap-6
- Page margins: px-4 md:px-6 lg:px-8

**Container Strategy:**
- Mobile: Full width with px-4 padding
- Tablet/Desktop: max-w-7xl mx-auto px-6
- Dashboard cards: Grid system - grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Component Library

### Navigation
- **Mobile:** Bottom navigation bar with 4-5 primary actions (Dashboard, Production Entry, Sales, Reports, Settings)
- **Tablet/Desktop:** Sidebar navigation (right-aligned for RTL) with expandable sections
- **Structure:** Icon + Persian label, active state with accent background

### Dashboard Cards
- **Layout:** White background with subtle shadow (shadow-sm)
- **Header:** Icon + Title + Action button/link in single row
- **Content:** Large numbers with labels below, trend indicators (↑↓)
- **Style:** Rounded corners (rounded-lg), border (border-gray-200)

### Forms (Critical Component)
- **Field Layout:** Single column on mobile, 2-column on tablet+
- **Labels:** Above inputs, font-semibold, required indicators
- **Inputs:** Large touch targets (h-11), clear borders, focus states
- **Farm Selection:** Prominent radio buttons or segmented control at top
- **Date Pickers:** Jalali calendar integration, large clickable areas
- **Number Inputs:** Right-aligned text for RTL number entry, +/- buttons for quick adjustment
- **Submit Actions:** Sticky bottom bar on mobile with primary CTA

### Data Tables
- **Mobile:** Card-based list view (not traditional table)
- **Tablet+:** Traditional table with sticky header
- **Columns:** Right-aligned for numbers, left-aligned for text/dates
- **Actions:** Icon buttons in rightmost column (leftmost visually in RTL)
- **Pagination:** Bottom-centered with page numbers

### Sales Invoices (Havaleh)
- **Preview:** Receipt-style layout with clear sections
- **Print View:** Printer-friendly formatting, A4 size consideration
- **Actions:** Share, Print, Download, Excel export buttons

### Excel Export Button
- **Placement:** Top-right of data views (top-left in RTL layout)
- **Style:** Secondary button with Excel icon
- **Label:** "خروجی اکسل" (Excel Export)

## Authentication Screens

**Login/Biometric:**
- **Layout:** Centered card on clean background
- **Logo:** Top of card, appropriate size
- **Biometric Button:** Large, prominent with fingerprint icon
- **Fallback:** Username/password fields below
- **Style:** Clean, trustworthy, professional

## Responsive Breakpoints
- Mobile: < 768px (single column, bottom nav, card lists)
- Tablet: 768px - 1024px (2-column grids, side nav option)
- Desktop: > 1024px (3-column grids, persistent sidebar)

## RTL-Specific Considerations
- Navigation: Right-side sidebar, right-to-left menu flows
- Forms: Labels and inputs aligned to right
- Icons: Position icons on right side of text
- Drawers/Modals: Slide from right side
- Progress indicators: Fill from right to left
- Breadcrumbs: Separate with ← instead of →

## Accessibility
- Large touch targets: Minimum 44x44px (h-11 w-11)
- Color contrast: WCAG AA minimum for all text
- Focus indicators: Clear outline on all interactive elements
- Screen reader: Proper ARIA labels in Persian

## Images
**No hero images required.** This is a utility application focused on data entry and management. Use icons and data visualization instead.

**Icons:**
- Use Lucide React icon library consistently
- Farm icons, chart icons, invoice icons, user icons
- Size: w-5 h-5 for inline, w-6 h-6 for buttons, w-8 h-8 for cards

## Animations
**Minimal and Purposeful:**
- Page transitions: Simple fade (no slide animations that conflict with RTL)
- Form submission: Loading spinner on button
- Success/Error: Toast notifications (top-center)
- NO decorative animations

This is a production management tool - prioritize speed and clarity over visual effects.