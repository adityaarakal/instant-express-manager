# Forecasting & Projections Feature

## Overview

The Forecasting & Projections feature provides advanced financial planning capabilities, including cash flow predictions, scenario planning (what-if analysis), savings goal tracking, and budget recommendations.

## Features

### 1. Cash Flow Projections
- **Automatic Calculation**: Based on historical transaction averages and recurring templates
- **Time Horizon**: Project 3, 6, 12, or 24 months ahead
- **Confidence Levels**: High, Medium, or Low based on data availability
- **Visualization**: Interactive line chart showing income, expenses, savings, and balance trends
- **Scenario Support**: Apply different scenarios to see how assumptions affect projections

### 2. Scenario Planning (What-If Analysis)
- **Create Scenarios**: Model different financial situations
- **Adjustments**: Apply multipliers to income, expenses, or savings
- **Compare**: See how different scenarios affect cash flow projections
- **Duplicate**: Easily create variations of existing scenarios
- **Manage**: Edit, delete, or duplicate scenarios

### 3. Savings Goals Tracking
- **Goal Creation**: Set target amounts and dates
- **Progress Monitoring**: Track current progress towards goals
- **On-Track Analysis**: Determine if you're on track to meet goals
- **Monthly Contribution**: Set and track expected monthly contributions
- **Visual Progress**: Progress bars and percentage indicators

### 4. Budget Recommendations
- **Personalized Suggestions**: Based on spending patterns over the last 6 months
- **Category Analysis**: Identifies categories with high spending
- **Savings Potential**: Shows how much you could save per month
- **Priority Levels**: High, Medium, or Low priority recommendations
- **Actionable Insights**: Clear reasoning for each recommendation

## Implementation Details

### Files Created

1. **`frontend/src/store/useForecastingStore.ts`**
   - Zustand store for managing forecasting data
   - Stores savings goals, scenarios, projections, and budget recommendations
   - Persists data to IndexedDB via localforage

2. **`frontend/src/utils/forecasting.ts`**
   - Core forecasting algorithms
   - Cash flow projection generation
   - Budget recommendation engine
   - Savings goal progress calculation
   - Historical data analysis functions

3. **`frontend/src/pages/Forecasting.tsx`**
   - Main forecasting page with tabbed interface
   - Integrates all forecasting features
   - Manages state and data flow

4. **`frontend/src/components/forecasting/CashFlowProjectionChart.tsx`**
   - Recharts-based line chart for cash flow visualization
   - Shows income, expenses, savings, and balance trends
   - Responsive design for mobile and desktop

5. **`frontend/src/components/forecasting/ScenariosPanel.tsx`**
   - UI for creating and managing scenarios
   - Scenario creation/editing dialog
   - Scenario list with actions

6. **`frontend/src/components/forecasting/SavingsGoalsPanel.tsx`**
   - UI for managing savings goals
   - Goal creation/editing dialog
   - Progress tracking and visualization

7. **`frontend/src/components/forecasting/BudgetRecommendationsPanel.tsx`**
   - UI for displaying budget recommendations
   - Card-based layout with priority indicators
   - Savings potential calculations

### Files Modified

1. **`frontend/src/routes/AppRoutes.tsx`**
   - Added `/forecasting` route

2. **`frontend/src/components/layout/AppLayout.tsx`**
   - Added "Forecasting" navigation item with TrendingUp icon

## Usage

### Accessing Forecasting

1. Navigate to **Forecasting** from the main navigation menu
2. The page opens with the **Cash Flow** tab active

### Cash Flow Projections

1. Select the number of months to project (3, 6, 12, or 24)
2. Optionally select a scenario to apply different assumptions
3. View the interactive chart and detailed table
4. Check confidence levels for each month's projection

### Creating Scenarios

1. Go to the **Scenarios** tab
2. Click **Create Scenario**
3. Enter scenario name and description
4. Set multipliers for income, expenses, or savings (e.g., 1.1 for 10% increase)
5. Save the scenario
6. Apply it in the Cash Flow tab to see its impact

### Managing Savings Goals

1. Go to the **Savings Goals** tab
2. Click **Add Goal**
3. Enter goal name, target amount, and target date
4. Optionally set monthly contribution
5. View progress bars and on-track status
6. Edit or delete goals as needed

### Budget Recommendations

1. Go to the **Budget Tips** tab
2. Review personalized recommendations
3. See current spending vs. recommended spending
4. Check savings potential for each category
5. Prioritize high-impact recommendations

## Technical Details

### Cash Flow Projection Algorithm

1. **Base Calculations**:
   - Average monthly income from last 6 months of transactions
   - Average monthly expenses from last 6 months
   - Average monthly savings from last 6 months

2. **Recurring Template Projections**:
   - Projects income from active recurring income templates
   - Projects expenses from active recurring expense templates
   - Projects savings from active recurring savings templates
   - Accounts for frequency (Monthly, Weekly, Yearly, Quarterly)

3. **Scenario Application**:
   - Applies multipliers to base calculations
   - Adjusts for category-specific changes
   - Recalculates net cash flow and cumulative balance

4. **Confidence Levels**:
   - **High**: Has recurring templates and historical data
   - **Medium**: Has historical data but limited recurring templates
   - **Low**: Limited or no historical data

### Budget Recommendation Algorithm

1. **Data Analysis**:
   - Analyzes expenses from last 6 months
   - Groups by category
   - Calculates monthly averages

2. **Recommendation Generation**:
   - Identifies categories >20% of total spending
   - Suggests 10% reduction for high-spending categories
   - Calculates savings potential
   - Assigns priority based on percentage of total spending

3. **Priority Levels**:
   - **High**: Category represents >30% of total spending
   - **Medium**: Category represents 20-30% of total spending
   - **Low**: Category represents <20% of total spending

### Savings Goal Progress Calculation

1. **Current Amount**: Sum of all completed savings/investment transactions
2. **Progress**: (Current / Target) × 100
3. **Months Remaining**: Calculated from target date
4. **Monthly Needed**: (Target - Current) / Months Remaining
5. **On Track**: Monthly needed ≤ Current monthly average

## Data Storage

### Savings Goals
- Stored in Zustand persist (IndexedDB)
- Includes: name, target amount, target date, monthly contribution, status

### Scenarios
- Stored in Zustand persist (IndexedDB)
- Includes: name, description, assumptions (multipliers and adjustments)

### Projections
- Computed on-demand, not stored
- Regenerated when:
  - Months ahead changes
  - Historical data changes
  - Recurring templates change
  - Scenario selection changes

### Budget Recommendations
- Computed on-demand, not stored
- Regenerated when expense transactions change

## Future Enhancements

Potential improvements:
1. **Export Projections**: Export projections to CSV/Excel
2. **Goal Milestones**: Set intermediate milestones for long-term goals
3. **Scenario Comparison**: Side-by-side comparison of multiple scenarios
4. **Historical Accuracy**: Track projection accuracy over time
5. **Custom Categories**: Allow custom category adjustments in scenarios
6. **Goal Alerts**: Notifications when goals are at risk
7. **Budget Templates**: Pre-defined budget templates
8. **AI Recommendations**: Machine learning-based recommendations

## Related Features

- **Projections Integration**: Import projections from CSV/Excel (existing feature)
- **Recurring Templates**: Used for projection calculations
- **Dashboard Metrics**: Shares some calculation logic
- **Analytics**: Complementary feature for historical analysis

