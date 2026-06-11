// Manages navigation link visibility based on login status and user role
document.addEventListener('DOMContentLoaded', function() {
    const tipUporabnikaRaw = localStorage.getItem('tip_uporabnika');
    const prijavljenEmail = localStorage.getItem('prijavljenEmail');
    const isLoggedIn = !!prijavljenEmail;
    const isAdmin = isLoggedIn && (parseInt(tipUporabnikaRaw) === 1);
 
  // --- NAVIGACIJA ---
 
  // Always hide Admin + Moj profil by default, reveal based on role below
  document.querySelectorAll('a[href="obcina-profil.html"]').forEach(l => l.closest('li')?.classList.add('d-none'));
  document.querySelectorAll('a[href="profil.html"]').forEach(l => l.closest('li')?.classList.add('d-none'));
 
  if (isLoggedIn) {
    // Hide "Prijava" for everyone who is logged in
    document.querySelectorAll('a[href="prijava.html"]').forEach(l => l.closest('li')?.classList.add('d-none'));
 
    if (isAdmin) {
      // Admin: show Admin link, keep Moj profil hidden
      document.querySelectorAll('a[href="obcina-profil.html"]').forEach(l => l.closest('li')?.classList.remove('d-none'));
    } else {
      // Regular user: show Moj profil, keep Admin hidden
      document.querySelectorAll('a[href="profil.html"]').forEach(l => l.closest('li')?.classList.remove('d-none'));
    }
  }
 
  // --- GUMB "DODAJ PREDLOG" na predlogi.html ---
  // Vidno samo za prijavljene navadne uporabnike; skrito za admina in neprijavljene
  const dodajPredlogSection = document.querySelector('.gumbi-dodaj');
  if (dodajPredlogSection) {
    if (isLoggedIn && !isAdmin) {
      dodajPredlogSection.classList.remove('d-none'); // Pokaži za navadnega uporabnika
    } else {
      dodajPredlogSection.classList.add('d-none');    // Skrij za admina in neprijavljene
    }
  }
 
  // --- ADMIN PANEL na obcina.html ---
  // Skrij formo za dodajanje predlogov če ni admin
  if (!isAdmin) {
    const adminPanel = document.querySelector('.admin-panel');
    if (adminPanel) {
      adminPanel.classList.add('d-none');
    }
  }
});
 