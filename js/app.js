(function(){
  const STORAGE_KEY = 'lvl_auditions';
  const ADMIN_ID = 'OPENED';
  const ADMIN_PW = 'NOW_0123';

  // Helpers
  const $ = (s, el=document)=> el.querySelector(s);
  const $$ = (s, el=document)=> Array.from(el.querySelectorAll(s));
  const now = ()=> new Date().toISOString();
  function getSubmissions(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }catch(e){return[]} }
  function saveSubmissions(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)) }

  // Toast
  const toastEl = $('#toast');
  let toastTimer = null;
  function toast(msg, ms=2500){ if(!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('show'); toastEl.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = setTimeout(()=>{ toastEl.classList.remove('show'); }, ms); }

  function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]||c)); }
  function encodeAttr(s){ return encodeURI(s||'') }

  // Modal utilities with focus management
  function trapFocus(mod){
    const focusable = Array.from(mod.querySelectorAll('a[href],button,textarea,input,select,[tabindex]:not([tabindex="-1"])'))
      .filter(el=>!el.hasAttribute('disabled'));
    if(!focusable.length) return ()=>{};
    const first = focusable[0]; const last = focusable[focusable.length-1];
    function keyHandler(e){ if(e.key==='Tab'){ if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); } } else if(e.key==='Escape'){ closeModal(mod); } }
    document.addEventListener('keydown', keyHandler);
    return ()=> document.removeEventListener('keydown', keyHandler);
  }

  function openModal(mod, focusSelector){ if(!mod) return; mod.classList.remove('hidden'); mod.classList.add('open'); mod.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; const panel = mod.querySelector('.modal-panel'); const toFocus = focusSelector ? panel.querySelector(focusSelector) : panel.querySelector('input,textarea,button'); if(toFocus) toFocus.focus(); return trapFocus(mod); }
  function closeModal(mod){ if(!mod) return; mod.classList.add('hidden'); mod.classList.remove('open'); mod.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

  // INDEX PAGE
  const auditionBtn = $('#auditionBtn');
  const modal = $('#auditionModal');
  const closeModalBtn = $('#closeModal');
  const form = $('#auditionForm');
  const formError = $('#formError');
  const cancelSubmit = $('#cancelSubmit');
  let releaseTrap = null;

  if(auditionBtn && modal){ auditionBtn.addEventListener('click', ()=> { releaseTrap = openModal(modal); }); }
  if(closeModalBtn) closeModalBtn.addEventListener('click', ()=> { closeModal(modal); if(releaseTrap) releaseTrap(); auditionBtn.focus(); });
  if(cancelSubmit) cancelSubmit.addEventListener('click', ()=>{ closeModal(modal); if(releaseTrap) releaseTrap(); auditionBtn.focus(); });
  if(modal) modal.addEventListener('click', (e)=>{ if(e.target===modal){ closeModal(modal); if(releaseTrap) releaseTrap(); auditionBtn.focus(); } });

  // improved validation with per-field feedback
  function showFieldError(el, msg){ let next = el.nextElementSibling; if(next && next.classList && next.classList.contains('field-error')){ next.textContent = msg; } else { const err = document.createElement('div'); err.className='field-error'; err.style.color='#800'; err.style.marginTop='6px'; err.textContent = msg; el.parentNode.appendChild(err); } el.setAttribute('aria-invalid','true'); }
  function clearFieldErrors(formEl){ $$('.field-error', formEl).forEach(n=>n.remove()); $$('[aria-invalid="true"]', formEl).forEach(n=>n.removeAttribute('aria-invalid')); }

  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault(); formError.textContent=''; clearFieldErrors(form);
      const name = form.name.value.trim();
      const age = form.age.value.trim();
      const lyrics = form.lyrics.value.trim();
      const snowman = form.snowman.value.trim();
      let ok = true;
      if(!name){ showFieldError(form.name, '이름을 입력해주세요.'); ok=false; }
      if(!age){ showFieldError(form.age, '가상 나이를 입력해주세요.'); ok=false; }
      else if(!/^\d+$/.test(age)){ showFieldError(form.age, '가상 나이는 숫자만 입력해주세요.'); ok=false; }
      if(!lyrics){ showFieldError(form.lyrics, '작사본을 입력해주세요.'); ok=false; }
      if(snowman && !/^https?:\/\//.test(snowman)){ showFieldError(form.snowman, '링크는 https:// 또는 http:// 로 시작해야 합니다.'); ok=false; }
      if(!ok){ formError.textContent = '입력 항목을 확인해주세요.'; return; }
      const entry = { id: Date.now(), name, age, lyrics, snowman, createdAt: new Date().toISOString() };
      const subs = getSubmissions(); subs.unshift(entry); saveSubmissions(subs);
      form.reset(); closeModal(modal); if(releaseTrap) releaseTrap(); auditionBtn.focus(); toast('전송되었습니다.');
    });

    // live validation
    ['name','age','lyrics','snowman'].forEach(id=>{
      const el = form.querySelector(`[name="${id}"]`);
      if(!el) return;
      el.addEventListener('input', ()=>{ const next = el.nextElementSibling; if(next && next.classList && next.classList.contains('field-error')) next.remove(); el.removeAttribute('aria-invalid'); formError.textContent=''; });
    });
  }

  // ADMIN PAGE
  const loginForm = $('#loginForm');
  const loginMsg = $('#loginMsg');
  const adminPanel = $('#adminPanel');
  const subList = $('#subList');
  const logoutBtn = $('#logout');
  const clearAllBtn = $('#clearAll');
  const exportCsvBtn = $('#exportCsv');
  const searchInput = $('#search');
  const countEl = $('#count');
  const viewModal = $('#viewModal');
  const viewContent = $('#viewContent');
  const closeView = $('#closeView');
  let releaseViewTrap = null;

  function renderSubs(filter=''){
    if(!subList) return;
    const subs = getSubmissions().filter(s=>{
      if(!filter) return true;
      const q = filter.toLowerCase();
      return (s.name||'').toLowerCase().includes(q) || (s.lyrics||'').toLowerCase().includes(q);
    });
    countEl.textContent = `(${subs.length})`;
    if(subs.length===0){ subList.innerHTML = '<p>등록된 신청이 없습니다.</p>'; return; }
    subList.innerHTML='';
    subs.forEach(s=>{
      const item = document.createElement('div'); item.className='subitem';
      const left = document.createElement('div'); left.className='subcontent';
      left.innerHTML = `<strong>${escapeHtml(s.name)}</strong><div class="submeta">가상 나이: ${escapeHtml(s.age)} · ${new Date(s.createdAt).toLocaleString()}</div><div class="excerpt">${escapeHtml((s.lyrics||'').slice(0,200))}${(s.lyrics||'').length>200?'…':''}</div>`;
      const right = document.createElement('div'); right.className='subactions';
      const view = document.createElement('button'); view.className='btn'; view.textContent='View'; view.addEventListener('click', ()=>{
        viewContent.innerHTML = `<h3>${escapeHtml(s.name)}</h3><div class="submeta">가상 나이: ${escapeHtml(s.age)} · ${new Date(s.createdAt).toLocaleString()}</div><pre>${escapeHtml(s.lyrics)}</pre>${s.snowman?`<p><a href="${encodeAttr(s.snowman)}" target="_blank" rel="noopener">눈사람 링크</a></p>`:''}`;
        releaseViewTrap = openModal(viewModal);
      });
      const del = document.createElement('button'); del.className='btn'; del.textContent='Delete'; del.addEventListener('click', ()=>{
        if(confirm('이 항목을 삭제하시겠습니까?')){ const arr = getSubmissions().filter(x=>x.id!==s.id); saveSubmissions(arr); renderSubs(searchInput?searchInput.value:''); toast('삭제되었습니다.'); }
      });
      right.appendChild(view); right.appendChild(del);
      item.appendChild(left); item.appendChild(right);
      subList.appendChild(item);
    });
  }

  function exportCsv(){ const subs = getSubmissions(); if(subs.length===0){ toast('내보낼 항목이 없습니다.'); return }; const rows = [['id','name','age','lyrics','snowman','createdAt']]; subs.forEach(s=> rows.push([s.id,s.name.replace(/"/g,'""'),s.age,s.lyrics.replace(/"/g,'""'),s.snowman,s.createdAt])); const csv = rows.map(r=> r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n'); const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'lvl_auditions.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast('CSV 내보내기 완료'); }

  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault(); loginMsg.textContent='';
      const id = loginForm.id.value.trim(); const pw = loginForm.pw.value.trim();
      if(id===ADMIN_ID && pw===ADMIN_PW){
        sessionStorage.setItem('lvl_admin','1'); loginForm.reset(); loginForm.parentElement.classList.add('hidden'); adminPanel.classList.remove('hidden'); renderSubs(); toast('로그인되었습니다.');
      } else { loginMsg.textContent='로그인 정보가 올바르지 않습니다.'; }
    });
  }

  // persist login
  if(sessionStorage.getItem('lvl_admin')){ if(loginForm) loginForm.parentElement.classList.add('hidden'); if(adminPanel) adminPanel.classList.remove('hidden'); renderSubs(); }

  if(logoutBtn) logoutBtn.addEventListener('click', ()=>{ sessionStorage.removeItem('lvl_admin'); adminPanel.classList.add('hidden'); if(loginForm) loginForm.parentElement.classList.remove('hidden'); toast('로그아웃 되었습니다.'); });
  if(clearAllBtn) clearAllBtn.addEventListener('click', ()=>{ if(confirm('모든 신청을 삭제하시겠습니까?')){ saveSubmissions([]); renderSubs(); toast('모두 삭제되었습니다.'); } });
  if(exportCsvBtn) exportCsvBtn.addEventListener('click', exportCsv);

  if(searchInput){ let t; searchInput.addEventListener('input', ()=>{ clearTimeout(t); t=setTimeout(()=> renderSubs(searchInput.value.trim()),200); }); }

  if(closeView) closeView.addEventListener('click', ()=>{ closeModal(viewModal); if(releaseViewTrap) releaseViewTrap(); });
  if(viewModal) viewModal.addEventListener('click', (e)=>{ if(e.target===viewModal){ closeModal(viewModal); if(releaseViewTrap) releaseViewTrap(); } });

  // global keyboard: Esc closes any open modal
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ const openModals = $$('.modal.open'); openModals.forEach(m=>{ closeModal(m); }); } });

})();
