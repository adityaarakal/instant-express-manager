import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Paper,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SettingsIcon from '@mui/icons-material/Settings';
import { useOnboardingStore } from '../../store/useOnboardingStore';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  action?: {
    label: string;
    route?: string;
  };
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Instant Expense Manager!',
    description: 'Let\'s get you started with managing your finances',
    icon: <AccountBalanceIcon />,
    content: (
      <Stack spacing={2}>
        <Typography variant="body1">
          This app helps you track and manage all your financial data in one place - no Excel required!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We'll guide you through the key features in just a few steps.
        </Typography>
      </Stack>
    ),
  },
  {
    id: 'banks-accounts',
    title: 'Banks & Accounts',
    description: 'Start by adding your banks and accounts',
    icon: <AccountBalanceWalletIcon />,
    content: (
      <Stack spacing={2}>
        <Typography variant="body1">
          <strong>Step 1:</strong> Add your banks (e.g., ICICI, HDFC, Axis)
        </Typography>
        <Typography variant="body1">
          <strong>Step 2:</strong> Add bank accounts with their current balances
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          💡 Tip: The initial balance you set will be preserved and included in all calculations.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          💡 Tip: Account balances automatically update when you mark transactions as received/paid.
        </Typography>
      </Stack>
    ),
    action: {
      label: 'Go to Banks',
      route: '/banks',
    },
  },
  {
    id: 'transactions',
    title: 'Transactions',
    description: 'Track your income, expenses, and savings',
    icon: <ReceiptIcon />,
    content: (
      <Stack spacing={2}>
        <Typography variant="body1">
          Track three types of transactions:
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <li>
            <strong>Income:</strong> Money received (salary, gifts, etc.)
          </li>
          <li>
            <strong>Expenses:</strong> Money spent (bills, shopping, etc.)
          </li>
          <li>
            <strong>Savings/Investments:</strong> Money moved to savings or investments
          </li>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          💡 Tip: Transactions start as "Pending" - mark them as "Received"/"Paid"/"Completed" when they actually occur.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          💡 Tip: Account balances update automatically based on transaction status.
        </Typography>
      </Stack>
    ),
    action: {
      label: 'Go to Transactions',
      route: '/transactions',
    },
  },
  {
    id: 'planner',
    title: 'Financial Planner',
    description: 'Plan your monthly expenses with buckets',
    icon: <CalendarMonthIcon />,
    content: (
      <Stack spacing={2}>
        <Typography variant="body1">
          The Planner helps you allocate your money into different buckets (categories) each month.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          💡 Tip: Buckets with past due dates are automatically zeroed out.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          💡 Tip: You can override zeroed amounts if needed.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          💡 Tip: Use the duplicate month feature to copy allocations from previous months.
        </Typography>
      </Stack>
    ),
    action: {
      label: 'Go to Planner',
      route: '/planner',
    },
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    description: 'Understand your financial patterns',
    icon: <TrendingUpIcon />,
    content: (
      <Stack spacing={2}>
        <Typography variant="body1">
          Get insights into your spending patterns, income trends, and savings progress.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          💡 Tip: View charts by different time periods and categories.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          💡 Tip: Export your data for external analysis.
        </Typography>
      </Stack>
    ),
    action: {
      label: 'Go to Analytics',
      route: '/analytics',
    },
  },
  {
    id: 'settings',
    title: 'Settings & Features',
    description: 'Customize your experience',
    icon: <SettingsIcon />,
    content: (
      <Stack spacing={2}>
        <Typography variant="body1">
          Explore powerful features:
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <li>
            <strong>EMIs:</strong> Track recurring installments
          </li>
          <li>
            <strong>Recurring Templates:</strong> Set up automatic transaction generation
          </li>
          <li>
            <strong>Backup/Restore:</strong> Keep your data safe
          </li>
          <li>
            <strong>Keyboard Shortcuts:</strong> Press <kbd>?</kbd> to see all shortcuts
          </li>
          <li>
            <strong>Dark Mode:</strong> Toggle theme in the header
          </li>
        </Box>
      </Stack>
    ),
    action: {
      label: 'Go to Settings',
      route: '/settings',
    },
  },
];

export function OnboardingDialog() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { hasCompletedOnboarding, currentStep, setHasCompletedOnboarding, setCurrentStep } = useOnboardingStore();
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    // Show onboarding if not completed
    if (!hasCompletedOnboarding) {
      setOpen(true);
      setActiveStep(currentStep);
    } else {
      setOpen(false);
    }
  }, [hasCompletedOnboarding, currentStep]);

  // Listen for restart requests from Settings page
  useEffect(() => {
    // Check periodically for changes (since we can't use storage events with IndexedDB)
    const interval = setInterval(() => {
      const store = useOnboardingStore.getState();
      if (!store.hasCompletedOnboarding && !open) {
        setOpen(true);
        setActiveStep(store.currentStep);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [open]);

  const handleNext = () => {
    const newStep = activeStep + 1;
    setActiveStep(newStep);
    setCurrentStep(newStep);
    
    if (newStep >= onboardingSteps.length) {
      handleComplete();
    }
  };

  const handleBack = () => {
    const newStep = activeStep - 1;
    setActiveStep(newStep);
    setCurrentStep(newStep);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setHasCompletedOnboarding(true);
    setOpen(false);
  };

  const handleClose = () => {
    // Don't allow closing without completing or skipping
    handleSkip();
  };

  if (hasCompletedOnboarding && !open) {
    return null;
  }

  const currentStepData = onboardingSteps[activeStep];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          backgroundColor: (theme) => theme.palette.background.paper,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: { xs: 1.5, sm: 2 },
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
          Getting Started
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ minWidth: 40, minHeight: 40 }}
          aria-label="Close onboarding"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, '&.MuiDialogContent-root': { pt: { xs: 2, sm: 3 } } }}>
        {!isMobile && (
          <Box sx={{ mb: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {onboardingSteps.map((step, index) => (
                <Step key={step.id} completed={index < activeStep} active={index === activeStep}>
                  <StepLabel
                    StepIconComponent={({ active, completed }) => (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: (theme) =>
                            completed
                              ? theme.palette.success.main
                              : active
                                ? theme.palette.primary.main
                                : theme.palette.action.disabledBackground,
                          color: (theme) =>
                            completed || active
                              ? theme.palette.common.white
                              : theme.palette.action.disabled,
                        }}
                      >
                        {completed ? (
                          <CheckCircleIcon fontSize="small" />
                        ) : (
                          step.icon
                        )}
                      </Box>
                    )}
                  >
                    <Typography variant="caption" sx={{ fontWeight: index === activeStep ? 600 : 400, fontSize: '0.75rem' }}>
                      {step.title}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        <Paper
          elevation={2}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.grey[800]
                : theme.palette.grey[50],
          }}
        >
          <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center', mb: 2 }}>
            <Box
              sx={{
                width: { xs: 56, sm: 64 },
                height: { xs: 56, sm: 64 },
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (theme) => theme.palette.primary.main,
                color: (theme) => theme.palette.primary.contrastText,
                mb: 1,
              }}
            >
              {currentStepData.icon}
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              {currentStepData.title}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.875rem', sm: '1rem' },
                maxWidth: '600px',
              }}
            >
              {currentStepData.description}
            </Typography>
          </Stack>

          <Box
            sx={{
              mt: 3,
              p: { xs: 2, sm: 2.5 },
              borderRadius: 1,
              backgroundColor: (theme) => theme.palette.background.paper,
            }}
          >
            {currentStepData.content}
          </Box>

          {isMobile && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
              {onboardingSteps.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: (theme) =>
                      index === activeStep
                        ? theme.palette.primary.main
                        : index < activeStep
                          ? theme.palette.success.main
                          : theme.palette.action.disabled,
                  }}
                />
              ))}
            </Box>
          )}
        </Paper>
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <Button
          onClick={handleSkip}
          color="inherit"
          startIcon={<SkipNextIcon />}
          sx={{
            minHeight: { xs: 44, sm: 48 },
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            order: { xs: 2, sm: 0 },
          }}
        >
          Skip Tour
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<ArrowBackIcon />}
          sx={{
            minHeight: { xs: 44, sm: 48 },
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
          }}
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          variant="contained"
          endIcon={activeStep === onboardingSteps.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
          sx={{
            minHeight: { xs: 44, sm: 48 },
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            minWidth: { xs: 120, sm: 140 },
          }}
        >
          {activeStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


