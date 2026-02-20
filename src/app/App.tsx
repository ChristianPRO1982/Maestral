import { TestHarnessPage } from './TestHarnessPage';

function PlaceholderHome(): JSX.Element {
  return (
    <main className="app-shell">
      <section className="placeholder-card">
        <h1>Maestral</h1>
        <p>App shell initialized. Product features will arrive in upcoming sprints.</p>
        <p>
          Open <code>/test-harness</code> to run Sprint 2 local pairing checks.
        </p>
      </section>
    </main>
  );
}

function NotFound(): JSX.Element {
  return (
    <main className="app-shell">
      <section className="placeholder-card">
        <h1>Not Found</h1>
        <p>
          This route is not defined. Try <code>/test-harness</code>.
        </p>
      </section>
    </main>
  );
}

export function App(): JSX.Element {
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/test-harness') {
    return <TestHarnessPage />;
  }

  if (normalizedPath === '/') {
    return <PlaceholderHome />;
  }

  return <NotFound />;
}
