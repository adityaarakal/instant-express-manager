import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that provides navigation context to ErrorBoundary
 */
export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      onReset={() => {
        navigate('/');
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

