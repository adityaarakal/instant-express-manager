import { Box, Button, Paper, Stack, Typography, Link, Chip, useMediaQuery, useTheme } from '@mui/material';
import type { ReactNode } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import LaunchIcon from '@mui/icons-material/Launch';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
}

export interface EmptyStateTip {
  text: string;
  icon?: ReactNode;
}

export interface EmptyStateLink {
  label: string;
  href: string;
  external?: boolean;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  actions?: EmptyStateAction[]; // Multiple actions
  tips?: EmptyStateTip[]; // Helpful tips
  links?: EmptyStateLink[]; // Links to documentation or related pages
  quickStart?: string[]; // Quick-start workflow steps
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  actions,
  tips,
  links,
  quickStart,
}: EmptyStateProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Support both single action and multiple actions
  const allActions = actions || (action ? [action] : []);

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 3, sm: 6 }, 
        borderRadius: 3, 
        textAlign: 'center', 
        border: 1, 
        borderColor: 'divider',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Stack spacing={{ xs: 2, sm: 3 }} alignItems="center" sx={{ width: '100%' }}>
        {icon && (
          <Box 
            sx={{ 
              color: 'text.secondary', 
              opacity: 0.7,
              '& svg': {
                fontSize: { xs: 48, sm: 64 },
              },
            }}
          >
            {icon}
          </Box>
        )}
        
        <Stack spacing={{ xs: 0.75, sm: 1 }} alignItems="center" sx={{ width: '100%', px: { xs: 1, sm: 2 } }}>
          <Typography 
            variant="h6" 
            color="text.primary" 
            fontWeight="medium"
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem' },
              textAlign: 'center',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                maxWidth: { xs: '100%', sm: 500 },
                width: '100%',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
                textAlign: 'center',
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                px: { xs: 1, sm: 0 },
              }}
            >
              {description}
            </Typography>
          )}
        </Stack>

        {/* Quick Start Steps */}
        {quickStart && quickStart.length > 0 && (
          <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 500 }, textAlign: 'left', px: { xs: 1, sm: 2 } }}>
            <Typography 
              variant="subtitle2" 
              color="text.secondary" 
              sx={{ 
                mb: { xs: 0.75, sm: 1 }, 
                textAlign: 'left',
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              }}
            >
              Quick Start:
            </Typography>
            <Stack spacing={{ xs: 0.75, sm: 1 }} sx={{ width: '100%' }}>
              {quickStart.map((step, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 0.75, sm: 1 }, width: '100%' }}>
                  <Chip 
                    label={index + 1} 
                    size="small" 
                    color="primary" 
                    sx={{ 
                      minWidth: { xs: 20, sm: 24 }, 
                      height: { xs: 20, sm: 24 }, 
                      fontSize: { xs: '0.6875rem', sm: '0.75rem' }, 
                      flexShrink: 0,
                      '& .MuiChip-label': {
                        px: { xs: 0.5, sm: 0.75 },
                      },
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      flex: 1,
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      textAlign: 'left',
                      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                    }}
                  >
                    {step}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Actions */}
        {allActions.length > 0 && (
          <Stack 
            direction={isMobile || allActions.length > 1 ? 'column' : 'row'} 
            spacing={{ xs: 1, sm: 1.5 }} 
            sx={{ 
              width: '100%', 
              maxWidth: { xs: '100%', sm: 400 },
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {allActions.map((act, index) => (
              <Button
                key={index}
                variant={act.variant || 'contained'}
                color={act.color || 'primary'}
                startIcon={act.icon}
                onClick={act.onClick}
                fullWidth={isMobile || allActions.length > 1}
                sx={{ 
                  mt: index === 0 ? 0 : 0,
                  minHeight: { xs: 44, sm: 40 },
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  px: { xs: 1.5, sm: 2 },
                  ...(allActions.length === 1 && !isMobile && {
                    minWidth: 200,
                  }),
                }}
              >
                {act.label}
              </Button>
            ))}
          </Stack>
        )}

        {/* Tips */}
        {tips && tips.length > 0 && (
          <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 500 }, mt: { xs: 0.75, sm: 1 }, px: { xs: 1, sm: 2 } }}>
            <Stack spacing={{ xs: 1, sm: 1.5 }} alignItems="flex-start" sx={{ width: '100%' }}>
              {tips.map((tip, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 0.75, sm: 1 }, width: '100%' }}>
                  {tip.icon || (
                    <InfoIcon 
                      sx={{ 
                        fontSize: { xs: 16, sm: 18 }, 
                        color: 'info.main', 
                        mt: { xs: 0.25, sm: 0.5 }, 
                        flexShrink: 0 
                      }} 
                    />
                  )}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      flex: 1,
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      hyphens: 'auto',
                      textAlign: 'left',
                      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                    }}
                  >
                    {tip.text}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Links */}
        {links && links.length > 0 && (
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1, sm: 2 }} 
            sx={{ 
              mt: { xs: 0.75, sm: 1 }, 
              flexWrap: 'wrap', 
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                underline="hover"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 0.5, sm: 0.5 },
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                  color: 'primary.main',
                  minHeight: { xs: 44, sm: 'auto' },
                  px: { xs: 1, sm: 0 },
                }}
              >
                {link.label}
                {link.external && <LaunchIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />}
              </Link>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

