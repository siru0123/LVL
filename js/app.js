(function(){
  const STORAGE_KEY = 'lvl_auditions';
  const ADMIN_ID = 'OPENED';
  const ADMIN_PW = 'NOW_0123';

  function getSubmissions(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }catch(e){return[]}
  }
  function saveSubmissions(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)) }

  // Index page
  const auditionBtn = document.getElementById('auditionBtn');
  const modal = document.getElementById('auditionModal');
  const closeModal = document.getElementById('closeModal');
  const form = document.getElementById('auditionForm');
  const submitMsg = document.getElementById('submitMsg');

  if(auditionBtn && modal){
    auditionBtn.addEventListener('click', ()=> modal.classList.remove('hidden'))
    closeModal.addEventListener('click', ()=> modal.classList.add('hidden'))
    modal.addEventListener('click', (e)=>{ if(e.target === modal) modal.classList.add('hidden') })
  }

  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const entry = {
        id: Date.now(),
        name: fd.get('name') || '',
        age: fd.get('age') || '',
        lyrics: fd.get('lyrics') || '',
        snowman: fd.get('snowman') || '',
        createdAt: new Date().toISOString()
      };
      const subs = getSubmissions();
      subs.unshift(entry);
      saveSubmissions(subs);
      submitMsg.textContent = '전송되었습니다.';
      form.reset();
      setTimeout(()=>{ submitMsg.textContent=''; modal.classList.add('hidden') },1200);
    })
  }

  // Admin page
  const loginForm = document.getElementById('loginForm');
  const loginMsg = document.getElementById('loginMsg');
  const adminPanel = document.getElementById('adminPanel');
  const subList = document.getElementById('subList');
  const logoutBtn = document.getElementById('logout');
  const clearAllBtn = document.getElementById('clearAll');

  function renderSubs(){
    if(!subList) return;
    const subs = getSubmissions();
    if(subs.length===0){ subList.innerHTML = '<p>등록된 신청이 없습니다.</p>'; return }
    subList.innerHTML = '';
    subs.forEach(s=>{
      const div = document.createElement('div'); div.className='item';
      div.innerHTML = `<strong>${escapeHtml(s.name)}</strong> <div class="meta">가상 나이: ${escapeHtml(s.age)} · ${new Date(s.createdAt).toLocaleString()}</div><p>${escapeHtml(s.lyrics)}</p>${s.snowman?`<a href="${escapeAttr(s.snowman)}" target="_blank">눈사람 링크</a>`:''}`;
      const del = document.createElement('button'); del.textContent='Delete'; del.style.marginLeft='8px'; del.addEventListener('click', ()=>{
        const arr = getSubmissions().filter(x=>x.id!==s.id); saveSubmissions(arr); renderSubs();
      });
      div.appendChild(del);
      subList.appendChild(div);
    })
  }

  function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'\\\\','"':'&quot;'}[c])); }
  function escapeAttr(s){ return encodeURI(s||'') }

  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const id = loginForm.elements['id'].value;
      const pw = loginForm.elements['pw'].value;
      if(id===ADMIN_ID && pw===ADMIN_PW){
        loginForm.parentElement.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        renderSubs();
      }else{
        loginMsg.textContent = '로그인 정보가 올바르지 않습니다.';
      }
    })
  }

  if(logoutBtn){ logoutBtn.addEventListener('click', ()=>{ adminPanel.classList.add('hidden'); if(loginForm) loginForm.parentElement.classList.remove('hidden'); }) }
  if(clearAllBtn){ clearAllBtn.addEventListener('click', ()=>{ if(confirm('모든 신청을 삭제하시겠습니까?')){ saveSubmissions([]); renderSubs(); } }) }

})();
