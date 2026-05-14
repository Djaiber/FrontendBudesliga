/**
 * Adidas Club Dropdown Handler
 * Manages the dropdown interaction for the Adidas Club button
 */

export function initAdidasClub(): void {
  const adidasBtn = document.getElementById('adidasBtn') as HTMLButtonElement;
  const adidasDropdown = document.getElementById('adidasDropdown') as HTMLDivElement;

  if (!adidasBtn || !adidasDropdown) {
    console.warn('Adidas Club button or dropdown not found');
    return;
  }

  // Toggle dropdown on button click
  adidasBtn.addEventListener('click', (e: Event) => {
    e.stopPropagation();
    const isOpen = adidasBtn.getAttribute('aria-expanded') === 'true';
    
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    
    if (!adidasBtn.contains(target) && !adidasDropdown.contains(target)) {
      closeDropdown();
    }
  });

  // Close dropdown with Escape key
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  function openDropdown(): void {
    adidasBtn.setAttribute('aria-expanded', 'true');
    adidasDropdown.classList.add('active');
  }

  function closeDropdown(): void {
    adidasBtn.setAttribute('aria-expanded', 'false');
    adidasDropdown.classList.remove('active');
  }
}
