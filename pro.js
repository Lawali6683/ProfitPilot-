export async function callAI(data, type) {
    try {
        const response = await fetch("https://propitpilot.pages.dev/api/pro", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payload: data, password: "@haruna66", type: type })
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        return result.text;
    } catch (err) {
        showNotify("Connection error. Please try again!", "bg-red-600");
        return null;
    }
}

export function showNotify(msg, color = "bg-blue-600") {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = "fixed top-5 right-5 z-50 pointer-events-none";
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `${color} text-white px-6 py-4 rounded-xl shadow-2xl mb-3 transition-all duration-500 transform translate-x-10 opacity-0 flex items-center gap-3 pointer-events-auto`;
    toast.innerHTML = `<i class="fas fa-bell"></i> <span class="font-medium">${msg}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('translate-x-10', 'opacity-0');
        toast.classList.add('translate-x-0', 'opacity-100');
    }, 100);

    setTimeout(() => {
        toast.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}
