(function() {
  const style = document.createElement('style');
  style.textContent = `
    #idejaToast { position: fixed; top: -60px; left: 50%; transform: translateX(-50%); background: #fff; border: 1px solid #c8e6c9; border-left: 4px solid #3B6D11; border-radius: 10px; padding: 10px 18px; display: flex; align-items: center; gap: 9px; box-shadow: 0 4px 14px rgba(0,0,0,0.09); z-index: 99999; transition: top 0.35s cubic-bezier(.4,0,.2,1); pointer-events: none; }
    #idejaToast.show { top: 16px; }
    #idejaPopupOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.32); display: flex; align-items: center; justify-content: center; z-index: 99999; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
    #idejaPopupOverlay.show { opacity: 1; pointer-events: auto; }
    #idejaPopupBox { background: #fff; border-radius: 12px; padding: 1.75rem; max-width: 360px; width: 90%; transform: scale(0.93); transition: transform 0.2s; text-align: center; box-shadow: 0 6px 24px rgba(0,0,0,0.10); }
    #idejaPopupOverlay.show #idejaPopupBox { transform: scale(1); }
    .btn-pop { margin: 5px; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; }
  `;
  document.head.appendChild(style);

  const toast = document.createElement('div');
  toast.id = 'idejaToast';
  toast.innerHTML = `<div class="t-text" id="idejaToastTitle"></div>`;
  document.body.appendChild(toast);

  const overlay = document.createElement('div');
  overlay.id = 'idejaPopupOverlay';
  overlay.innerHTML = `
    <div id="idejaPopupBox">
      <h5 id="idejaPopupTitle"></h5>
      <p id="idejaPopupMsg"></p>
      <div id="idejaPopupBtns"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  window.closePopup = function() { overlay.classList.remove('show'); };

  window.showSuccess = function(naslov, sporocilo, callback) {
    document.getElementById('idejaToastTitle').textContent = naslov;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); if (typeof callback === 'function') callback(); }, 2500);
  };

  window.showError = function(naslov, sporocilo) {
    document.getElementById('idejaPopupTitle').textContent = naslov;
    document.getElementById('idejaPopupMsg').textContent = sporocilo;
    document.getElementById('idejaPopupBtns').innerHTML = `<button class="btn-pop" onclick="closePopup()">V redu</button>`;
    overlay.classList.add('show');
  };

  window.showConfirmDelete = function(naslov, sporocilo, onConfirm) {
    document.getElementById('idejaPopupTitle').textContent = naslov;
    document.getElementById('idejaPopupMsg').textContent = sporocilo;
    document.getElementById('idejaPopupBtns').innerHTML = `
        <button class="btn-pop" style="background:#dc3545; color:white;" onclick="onConfirm(); closePopup();">Da</button>
        <button class="btn-pop" onclick="closePopup()">Ne</button>`;
    window.onConfirm = onConfirm;
    overlay.classList.add('show');
  };

  window.showConfirmZmagovalec = function(onConfirm) {
    document.getElementById('idejaPopupTitle').textContent = "Izberi zmagovalca";
    document.getElementById('idejaPopupMsg').textContent = "Ste prepričani, da želite izbrati ta predlog za zmagovalca?";
    document.getElementById('idejaPopupBtns').innerHTML = `
        <button class="btn-pop" style="background:#ffc107;" onclick="onConfirm(); closePopup();">Potrdi</button>
        <button class="btn-pop" onclick="closePopup()">Prekliči</button>`;
    window.onConfirm = onConfirm;
    overlay.classList.add('show');
  };
})();