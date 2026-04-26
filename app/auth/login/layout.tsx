// @ts-nocheck
/**
 * Auth UI shell only. Session lives in a single root AuthProvider (app/layout.tsx);
 * do not wrap login in another provider or login state is lost on navigation.
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-white min-h-screen">{children}</div>;
} 