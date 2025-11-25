# Print-Optimized Views Documentation

## Overview

The Print-Optimized Views feature provides comprehensive printing capabilities for the Instant Express Manager application. Users can print various reports, dashboards, and views with customizable layouts and options.

## Features

### 1. Print Preview
- **Component**: `PrintPreview`
- **Location**: `frontend/src/components/common/PrintPreview.tsx`
- **Purpose**: Preview content before printing
- **Usage**: Available in Planner and Dashboard pages

### 2. Print Summary Reports
- **Component**: `PrintSummaryReports`
- **Location**: `frontend/src/components/common/PrintSummaryReports.tsx`
- **Purpose**: Generate and print various financial summary reports
- **Report Types**:
  - **Monthly Summary**: Overview of income, expenses, savings, and account balances
  - **Income Breakdown**: Income categorized by category with percentages
  - **Expense Breakdown**: Expenses by category and bucket with percentages
  - **Savings Summary**: Savings by destination with percentages
  - **Account Balances**: All account balances with bank information
  - **Full Report**: Complete financial report with all sections

### 3. Custom Print Layouts
- **Component**: `PrintLayouts`
- **Location**: `frontend/src/components/common/PrintLayouts.tsx`
- **Purpose**: Customize print layout with various options
- **Options**:
  - **Orientation**: Portrait or Landscape
  - **Paper Size**: A4, Letter, or Legal
  - **Layout Style**: Compact, Detailed, Minimal, or Custom
  - **Display Options**:
    - Show/Hide Headers
    - Show/Hide Footers
    - Show/Hide Page Numbers
    - Show/Hide Date
    - Show/Hide Metadata
    - Compact Mode
    - Hide Charts
    - Hide Empty Sections

## Implementation Details

### Print Styles

Print styles are defined in `frontend/src/index.css` under the `@media print` section. Key features:

- **Hide Non-Essential Elements**: Navigation, buttons, tooltips, and interactive elements are hidden
- **Optimize Layout**: Full-width containers, proper spacing, and readable fonts
- **Table Optimization**: Proper borders, spacing, and page break handling
- **Chart Optimization**: Page break avoidance for charts
- **Print Headers/Footers**: Custom headers and footers with metadata

### Print Preview Component

The `PrintPreview` component:
- Opens content in a dialog for preview
- Creates a new window for printing
- Copies all styles from the main document
- Handles print dialog and window closing

### Print Summary Reports Component

The `PrintSummaryReports` component:
- Filters transactions by selected month
- Calculates metrics using `calculateDashboardMetrics`
- Generates breakdowns by category, bucket, and destination
- Formats currency using Indian number format (INR)
- Provides preview before printing

### Custom Print Layouts Component

The `PrintLayouts` component:
- Allows customization of print options
- Applies custom CSS based on selected options
- Provides real-time preview
- Supports different paper sizes and orientations

## Usage Examples

### Dashboard Print Preview

```tsx
import { PrintPreview } from '../components/common/PrintPreview';

const [printPreviewOpen, setPrintPreviewOpen] = useState(false);

<Button onClick={() => setPrintPreviewOpen(true)}>
  Print Preview
</Button>

<PrintPreview
  open={printPreviewOpen}
  onClose={() => setPrintPreviewOpen(false)}
  title="Dashboard Print Preview"
>
  {/* Content to print */}
</PrintPreview>
```

### Print Summary Reports

```tsx
import { PrintSummaryReports } from '../components/common/PrintSummaryReports';

const [printReportsOpen, setPrintReportsOpen] = useState(false);

<Button onClick={() => setPrintReportsOpen(true)}>
  Print Reports
</Button>

<PrintSummaryReports
  open={printReportsOpen}
  onClose={() => setPrintReportsOpen(false)}
  selectedMonthId={selectedMonthId}
/>
```

### Custom Print Layouts

```tsx
import { PrintLayouts } from '../components/common/PrintLayouts';

const [printLayoutsOpen, setPrintLayoutsOpen] = useState(false);

<Button onClick={() => setPrintLayoutsOpen(true)}>
  Custom Print Layout
</Button>

<PrintLayouts
  open={printLayoutsOpen}
  onClose={() => setPrintLayoutsOpen(false)}
  title="Custom Print Layout"
>
  {/* Content to print with custom layout */}
</PrintLayouts>
```

## Print Styles Classes

### Utility Classes

- `.no-print`: Hide element when printing
- `.print-only`: Show element only when printing
- `.print-header`: Styled header for print
- `.print-footer`: Styled footer for print
- `.print-metadata`: Metadata text for print
- `.print-date`: Date text for print
- `.print-summary`: Summary section with page break
- `.print-page-break`: Force page break after element
- `.print-page-break-avoid`: Avoid page break inside element

### Layout Classes

- `.compact-print`: Compact mode styling
- `.hide-charts-print`: Hide charts in print
- `.hide-empty-print`: Hide empty sections in print
- `.print-optimized`: Optimized spacing for print
- `.print-summary-card`: Styled summary card
- `.print-report-header`: Report header styling
- `.print-report-section`: Report section styling

## Best Practices

1. **Always Use Print Preview**: Preview content before printing to ensure proper formatting
2. **Test Different Layouts**: Try different layout options to find the best fit
3. **Use Compact Mode**: For large datasets, use compact mode to fit more content
4. **Hide Charts When Needed**: Charts can be resource-intensive; hide them if not needed
5. **Page Break Management**: Use page break classes to control where pages break
6. **Currency Formatting**: Always use Indian number format (INR) for currency
7. **Date Formatting**: Use consistent date formatting across all reports

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (may have minor styling differences)
- **Mobile Browsers**: Limited support (use desktop browsers for printing)

## Known Limitations

1. **Charts in Print**: Some charts may not render perfectly in print; consider hiding them
2. **Mobile Printing**: Mobile browsers have limited print support
3. **Page Breaks**: Complex layouts may have unexpected page breaks
4. **Colors**: Print is typically black and white; colors may not be visible

## Future Enhancements

1. **PDF Export**: Direct PDF export without print dialog
2. **Email Reports**: Send reports via email
3. **Scheduled Reports**: Automatically generate and print reports
4. **Custom Templates**: User-defined print templates
5. **Batch Printing**: Print multiple reports at once

## Troubleshooting

### Print Preview Not Opening
- Check browser popup blocker settings
- Ensure JavaScript is enabled
- Try a different browser

### Content Not Printing Correctly
- Check print styles in `index.css`
- Verify `.no-print` classes are applied correctly
- Test with different browsers

### Page Breaks Not Working
- Use `.print-page-break` and `.print-page-break-avoid` classes
- Adjust margins in print settings
- Try different paper sizes

### Charts Not Printing
- Charts may be hidden by default in print
- Use `hideCharts: false` option in PrintLayouts
- Consider exporting charts as images separately

