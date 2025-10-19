// Minimal registration handler — updates localStorage.adminToken and redirects to admin panel.
// Update baseUrl to your backend later.

(function () {
    const baseUrl = 'http://localhost:3000/api'; // change to your backend API when ready
    const form = document.getElementById('adminRegisterForm');
    if (!form) return;

    function setToken(token) { localStorage.setItem('adminToken', token); }

    async function safePost(url, body) {
        const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
        const res = await fetch(url, opts);
        if (!res.ok) throw await res.json().catch(() => new Error('Registration failed'));
        return await res.json();
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value.trim();
        try {
            const data = await safePost(`${baseUrl}/admin/register`, { email, password });
            if (data && data.token) setToken(data.token);
            else setToken('demo-admin-token');
            window.location.href = 'admin.html'; // existing admin panel page
        } catch (err) {
            // fallback for no backend: set demo token and continue
            setToken('demo-admin-token');
            window.location.href = 'admin.html';
        }
    });
})();