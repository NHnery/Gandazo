type Reward = {
  title: string;
  description: string;
  category: string;
  points: number;
};

const rewards: Record<string, Reward> = {
  burger: {
    title: 'Una hamburguesa bien ganada',
    description:
      'Imagina cambiar tus puntos por una hamburguesa en un negocio de Cusco. Este premio es un ejemplo de la experiencia que estamos preparando.',
    category: 'Comida',
    points: 350,
  },
  frappe: {
    title: 'Tu próxima pausa sabe mejor',
    description:
      'Una pausa con algo rico también podría ser tu próxima recompensa. Este café helado es una muestra ilustrativa; los premios del piloto están por confirmar.',
    category: 'Bebidas',
    points: 250,
  },
  style: {
    title: 'Un look de otro nivel',
    description:
      'Descubre cómo tus partidas podrían acercarte a un nuevo look. Esta recompensa es una vista previa de las posibilidades del piloto.',
    category: 'Estilo',
    points: 500,
  },
};

const menuToggle = document.querySelector<HTMLButtonElement>('#menu-toggle');
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav');

function closeMenu(restoreFocus = false): void {
  if (!menuToggle || !mobileNav) return;
  const wasOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menú');
  mobileNav.hidden = true;
  if (restoreFocus && wasOpen) menuToggle.focus();
}

menuToggle?.addEventListener('click', () => {
  if (!menuToggle || !mobileNav) return;
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
  mobileNav.hidden = isOpen;
});

mobileNav?.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
  link.addEventListener('click', () => closeMenu());
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu(true);
});

const desktopLayout = window.matchMedia('(min-width: 681px)');
desktopLayout.addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});

const filterButtons = document.querySelectorAll<HTMLButtonElement>('[data-filter]');
const rewardCards = document.querySelectorAll<HTMLElement>('[data-reward-card]');
const filterStatus = document.querySelector<HTMLElement>('#filter-status');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    if (!filter) return;

    filterButtons.forEach((item) => {
      item.setAttribute('aria-pressed', String(item === button));
    });

    let visibleCount = 0;
    rewardCards.forEach((card) => {
      const matches = filter === 'todos' || card.dataset.category === filter;
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    if (filterStatus) {
      filterStatus.textContent = `${visibleCount} ${visibleCount === 1 ? 'recompensa ilustrativa' : 'recompensas ilustrativas'}`;
    }
  });
});

const dialogOpeners = new WeakMap<HTMLDialogElement, HTMLElement>();
const rewardDialog = document.querySelector<HTMLDialogElement>('#reward-dialog');
const businessDialog = document.querySelector<HTMLDialogElement>('#business-dialog');

function openDialog(dialog: HTMLDialogElement | null, opener: HTMLElement): void {
  if (!dialog || dialog.open) return;
  closeMenu();
  dialogOpeners.set(dialog, opener);
  dialog.showModal();
}

function setDialogText(id: string, value: string): void {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

document.querySelectorAll<HTMLElement>('[data-reward]').forEach((button) => {
  button.addEventListener('click', () => {
    const reward = rewards[button.dataset.reward ?? ''];
    if (!reward) return;

    setDialogText('reward-title', reward.title);
    setDialogText('reward-description', reward.description);
    setDialogText('reward-category', reward.category);
    setDialogText('reward-points', `${reward.points} pts`);
    openDialog(rewardDialog, button);
  });
});

document.querySelectorAll<HTMLElement>('[data-business]').forEach((button) => {
  button.addEventListener('click', () => openDialog(businessDialog, button));
});

document.querySelectorAll<HTMLElement>('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog')?.close());
});

document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const clickedOutside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (clickedOutside) dialog.close();
  });

  dialog.addEventListener('close', () => {
    const opener = dialogOpeners.get(dialog);
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    dialogOpeners.delete(dialog);
  });
});

const revealElements = document.querySelectorAll<HTMLElement>('[data-reveal]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let revealObserver: IntersectionObserver | undefined;

function revealAll(): void {
  revealObserver?.disconnect();
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -16px 0px' },
  );
  revealElements.forEach((element) => revealObserver?.observe(element));
} else {
  revealAll();
}

document.body.classList.add('js-ready');
reducedMotion.addEventListener('change', (event) => {
  if (event.matches) revealAll();
});

export {};
