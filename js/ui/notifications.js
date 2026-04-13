// ============================================================
// NOTIFICATIONS UI MODULE
// ============================================================

export function showNotification(msg, type = 'info') {
  const notif = document.createElement('div');
  notif.className = `notif notif-${type}`;

  const bgMap = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgMap[type] || bgMap.info};
    color: white;
    padding: 14px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 9999;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;

  notif.innerHTML = `${iconMap[type]} ${msg}`;
  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

export function showUndoToast(config) {
  const { label, title, duration = 5000, onUndo, onExpire } = config;

  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 14px 20px;
    border-radius: 10px;
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    font-size: 0.88rem;
    display: flex;
    align-items: center;
    gap: 14px;
  `;

  toast.innerHTML = `
    <span>${title}</span>
    <button style="padding: 6px 14px; background: var(--primary); color: #000; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">
      ↶ Desfazer
    </button>
  `;

  const btn = toast.querySelector('button');
  let clicked = false;

  btn.onclick = () => {
    clicked = true;
    toast.remove();
    if (onUndo) onUndo();
  };

  document.body.appendChild(toast);

  setTimeout(() => {
    if (!clicked) {
      toast.remove();
      if (onExpire) onExpire();
    }
  }, duration);
}

export function initNotificationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
