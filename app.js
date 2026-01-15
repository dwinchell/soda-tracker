import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://vmqnbpqkficfxlyighzb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7QhBJFfgAJFwe6Y2Gxdoxg_-8ZBEuWS';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login');

const authOutput = document.getElementById('auth-output');
const todayOutput = document.getElementById('today-output');

const add12Btn = document.getElementById('add-12');

const loginScreen = document.getElementById('login-screen');
const trackingScreen = document.getElementById('track-screen');

loginBtn.addEventListener('click', async () => {
    authOutput.textContent = 'Signing in…';
    todayOutput.textContent = 'Today total: —';

    const email = emailInput.value;
    const password = passwordInput.value;

    const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        authOutput.textContent = `Error:\n${error.message}`;
        return;
    }

    const user = data.user;
    authOutput.textContent = `Signed in\n\nauth.uid():\n${user.id}`;
    add12Btn.disabled = false;

    loginScreen.hidden = true;
    trackingScreen.hidden = false;

    await loadTodayTotal();
});

async function loadTodayTotal() {
    // local midnight → now
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const {data, error} = await supabase
        .from('soda_consumption')
        .select('ounces')
        .gte('created_at', startOfToday.toISOString());

    if (error) {
        todayOutput.textContent = `Today total error:\n${error.message}`;
        return;
    }

    const total = data.reduce((sum, row) => sum + Number(row.ounces), 0);

    todayOutput.textContent = `Today total: ${total} oz`;
}

add12Btn.addEventListener('click', async () => {
    add12Btn.disabled = true;

    const {error} = await supabase
        .from('soda_consumption')
        .insert({ounces: 12});

    if (error) {
        todayOutput.textContent = `Insert error:\n${error.message}`;
        add12Btn.disabled = false;
        return;
    }

    await loadTodayTotal();
    add12Btn.disabled = false;
});
