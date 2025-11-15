# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-15

### Added
- Initial release of Instant Express Manager
- Core financial management features (Banks, Accounts, Transactions)
- EMIs and Recurring Transactions
- Planner and Dashboard
- Analytics and Reporting
- Data Backup/Restore
- Clear All Data functionality
- Strict code quality enforcement with Git hooks
- Enforcement lock system
- GitHub Actions PR workflow
- PWA support with offline functionality

### Features
- Banks and Bank Accounts management
- Income, Expense, and Savings/Investment transactions
- Transfer transactions between accounts
- Expense and Savings/Investment EMIs
- Recurring Income, Expense, and Savings/Investment templates
- Monthly financial planning with bucket-based allocations
- Dashboard with monthly and overall metrics
- Comprehensive analytics and insights
- Automatic balance updates based on transaction status
- Data health checks and balance sync
- Keyboard shortcuts
- Dark/Light theme support
- Undo functionality for deletions

## [1.0.1] - 2025-11-15

### Fixed
- Fixed issue where recurring templates were only generating one transaction at a time
- Fixed confusing "deduction date" terminology for income transactions (now "payment date")
- Fixed date input to use day of month concept instead of specific dates
- Fixed version bump workflow to handle case-insensitive commit messages

### Changed
- Improved recurring transaction generation to use day of month (1-31) instead of full dates
- Changed recurring template UI labels to be context-aware:
  - Income: "Payment Date - Day of Month"
  - Expense: "Deduction Date - Day of Month"
  - Savings: "Transaction Date - Day of Month"
- Recurring templates now generate all transactions upfront when created (entire recurring period or 12 months)
- All auto-generated transactions default to "Pending" status (income, expense, and savings)

### Added
- Added ability to mark transactions as "Pending" from bulk actions
- Added smart status button visibility based on selected transaction statuses

[Unreleased]: https://github.com/adityaarakal/instant-express-manager/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/adityaarakal/instant-express-manager/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/adityaarakal/instant-express-manager/releases/tag/v1.0.0

