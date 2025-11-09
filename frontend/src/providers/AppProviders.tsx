import { PropsWithChildren, useMemo } from 'react'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { CssBaseline, StyledEngineProvider, ThemeProvider } from '@mui/material'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'
import { muiTheme } from '../theme'

export const AppProviders = ({ children }: PropsWithChildren) => {
  const emotionCache = useMemo(() => createCache({ key: 'mui', prepend: true }), [])

  return (
    <CacheProvider value={emotionCache}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  )
}
