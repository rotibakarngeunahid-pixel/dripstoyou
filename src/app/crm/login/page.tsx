import { redirect } from 'next/navigation';

// Login is unified at /login. This route now redirects there.
export default function CRMLoginRedirect() {
  redirect('/login');
}
