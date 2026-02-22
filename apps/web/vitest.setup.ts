import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Inject jest-dom matchers into vitest
expect.extend(matchers);

// Optional: Mock next/router or next/navigation here if unit testing React components
