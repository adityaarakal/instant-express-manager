import { Box, Button, Paper, Stack, Typography, Link, Chip } from '@mui/material';
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
  // Support both single action and multiple actions
  const allActions = actions || (action ? [action] : []);

  return (
    <Paper elevation={0} sx={{ p: 6, borderRadius: 3, textAlign: 'center', border: 1, borderColor: 'divider' }}>
      <Stack spacing={3} alignItems="center">
        {icon && <Box sx={{ color: 'text.secondary', opacity: 0.7 }}>{icon}</Box>}
        
        <Stack spacing={1} alignItems="center">
          <Typography variant="h6" color="text.primary" fontWeight="medium">
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
              {description}
            </Typography>
          )}
        </Stack>

        {/* Quick Start Steps */}
        {quickStart && quickStart.length > 0 && (
          <Box sx={{ width: '100%', maxWidth: 500, textAlign: 'left' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
              Quick Start:
            </Typography>
            <Stack spacing={1}>
              {quickStart.map((step, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Chip 
                    label={index + 1} 
                    size="small" 
                    color="primary" 
                    sx={{ minWidth: 24, height: 24, fontSize: '0.75rem' }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
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
            direction={allActions.length > 1 ? 'column' : 'row'} 
            spacing={1.5} 
            sx={{ width: '100%', maxWidth: 400 }}
            alignItems="center"
          >
            {allActions.map((act, index) => (
              <Button
                key={index}
                variant={act.variant || 'contained'}
                color={act.color || 'primary'}
                startIcon={act.icon}
                onClick={act.onClick}
                fullWidth={allActions.length > 1}
                sx={{ mt: index === 0 ? 0 : 0 }}
              >
                {act.label}
              </Button>
            ))}
          </Stack>
        )}

        {/* Tips */}
        {tips && tips.length > 0 && (
          <Box sx={{ width: '100%', maxWidth: 500, mt: 1 }}>
            <Stack spacing={1.5} alignItems="flex-start">
              {tips.map((tip, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, width: '100%' }}>
                  {tip.icon || <InfoIcon sx={{ fontSize: 18, color: 'info.main', mt: 0.5, flexShrink: 0 }} />}
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {tip.text}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Links */}
        {links && links.length > 0 && (
          <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
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
                  gap: 0.5,
                  fontSize: '0.875rem',
                  color: 'primary.main',
                }}
              >
                {link.label}
                {link.external && <LaunchIcon sx={{ fontSize: 14 }} />}
              </Link>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

