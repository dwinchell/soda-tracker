import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://vmqnbpqkficfxlyighzb.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_7QhBJFfgAJFwe6Y2Gxdoxg_-8ZBEuWS'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login');
const output = document.getElementById('output');

loginBtn.addEventListener('click', async () => {
  output.textContent = 'Signing in…';

  const email = emailInput.value;
  const password = passwordInput.value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    output.textContent = `Error:\n${error.message}`;
    return;
  }

  const user = data.user;

  output.textContent = `Signed in\n\nauth.uid():\n${user.id}`;
});

