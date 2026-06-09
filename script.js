(() => {
  const viewport = document.getElementById('viewport');
  const canvas = document.getElementById('canvas');
  const dialog = document.getElementById('infoDialog');
  const dialogTitle = document.getElementById('dialogTitle');
  const dialogText = document.getElementById('dialogText');
  const closeDialog = document.getElementById('closeDialog');
  const hubListModal = document.getElementById('hubListModal');
  const hubListClose = document.getElementById('hubListClose');

  const base = { w: 931, h: 1810 };
  const state = { scale: 1, minScale: 0.35, maxScale: 3.2, x: 0, y: 0 };
  const pointers = new Map();
  let pinchStart = null;
  let fitScale = 1;

  const explore = {
    '다윗 즉위': {
      link: '사무엘의 기름부음에서 다윗 왕권으로 이어집니다. 왕의 자격은 혈통이나 외형보다 하나님을 향한 마음과 순종으로 드러납니다.',
      integrated: '목자 다윗 → 기름부음 → 왕권 확립 → 다윗언약 → 메시아 왕권으로 이어지는 큰 흐름입니다.'
    },
    '예루살렘 정복': {
      link: '다윗은 예루살렘을 정복하여 남북 지파를 아우르는 중립적 수도를 세웁니다. 왕국의 정치적 중심이 시온으로 모입니다.',
      integrated: '예루살렘은 왕권·성전·예배·메시아 약속이 만나는 중심 도시가 됩니다.'
    },
    '언약궤 이전': {
      link: '언약궤가 예루살렘으로 옮겨지며 왕국의 중심은 군사력이나 제도가 아니라 하나님의 임재임을 보여줍니다.',
      integrated: '성막의 임재 → 언약궤 → 시온 → 성전 → 그리스도 안의 임재로 연결됩니다.'
    },
    '성전 건축': {
      link: '솔로몬 성전은 통일왕국 영광의 절정입니다. 예배 중심이 세워지고 이스라엘의 신앙 질서가 가시화됩니다.',
      integrated: '성막에서 시작된 임재와 예배의 흐름이 성전에서 제도화되고, 이후 예수 그리스도와 교회로 확장됩니다.'
    },
    '왕국 분열': {
      link: '솔로몬 이후 왕국은 북이스라엘과 남유다로 갈라집니다. 통일왕국의 황금기는 끝나고 분열왕국의 긴 쇠퇴가 시작됩니다.',
      integrated: '왕국 분열은 언약 불순종의 결과이면서도, 심판과 회복과 메시아 약속으로 이어지는 전환점입니다.'
    }
  };

  function clampPan() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const sw = base.w * state.scale;
    const sh = base.h * state.scale;
    const xMargin = 80;
    if (sw <= vw) state.x = (vw - sw) / 2;
    else state.x = Math.min(xMargin, Math.max(vw - sw - xMargin, state.x));
    if (sh <= vh) state.y = 0;
    else state.y = Math.min(0, Math.max(vh - sh + 12, state.y));
  }
  function apply() { clampPan(); canvas.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`; }
  function fitView() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    state.minScale = Math.min(vw / base.w, vh / base.h) * 0.88;
    fitScale = Math.max(vw / base.w, state.minScale);
    state.scale = fitScale;
    state.x = (vw - base.w * state.scale) / 2;
    state.y = 0;
    apply();
  }
  function midpoint(a,b){ return {x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2}; }
  function distance(a,b){ return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY); }
  function beginPinch(){
    const [a,b]=[...pointers.values()]; const rect=viewport.getBoundingClientRect(); const mid=midpoint(a,b);
    const px=mid.x-rect.left, py=mid.y-rect.top;
    pinchStart={dist:distance(a,b),scale:state.scale,contentX:(px-state.x)/state.scale,contentY:(py-state.y)/state.scale};
  }
  viewport.addEventListener('pointerdown', e=>{
    if(e.target.closest('button, a')) return;
    e.preventDefault(); viewport.setPointerCapture(e.pointerId); pointers.set(e.pointerId,e); viewport.classList.add('dragging');
    if(pointers.size===2) beginPinch();
  });
  viewport.addEventListener('pointermove', e=>{
    if(!pointers.has(e.pointerId)) return; e.preventDefault(); const prev=pointers.get(e.pointerId); pointers.set(e.pointerId,e);
    if(pointers.size===1 && !pinchStart){ state.x += e.clientX-prev.clientX; state.y += e.clientY-prev.clientY; apply(); return; }
    if(pointers.size===2 && pinchStart){
      const [a,b]=[...pointers.values()]; const rect=viewport.getBoundingClientRect(); const mid=midpoint(a,b); const px=mid.x-rect.left, py=mid.y-rect.top; const ratio=distance(a,b)/pinchStart.dist;
      state.scale=Math.min(state.maxScale,Math.max(state.minScale,pinchStart.scale*ratio));
      state.x=px-pinchStart.contentX*state.scale; state.y=py-pinchStart.contentY*state.scale; apply();
    }
  });
  function endPointer(e){ pointers.delete(e.pointerId); if(pointers.size===2) beginPinch(); else pinchStart=null; if(pointers.size===0) viewport.classList.remove('dragging'); }
  viewport.addEventListener('pointerup', endPointer); viewport.addEventListener('pointercancel', endPointer);

  document.querySelectorAll('.button-set button').forEach(btn=>{
    btn.addEventListener('click', e=>{
      e.stopPropagation(); const group=btn.closest('.button-set'); const eventName=group.dataset.event; const kind=btn.dataset.kind;
      dialogTitle.textContent = kind === 'link' ? `${eventName} 연결탐험` : `${eventName} 통합탐험`;
      dialogText.textContent = explore[eventName]?.[kind] || '통일왕국 탐험 내용을 연결합니다.';
      dialog.showModal();
    });
  });

  document.querySelectorAll('.footer button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const key=btn.dataset.footer;
      if(key==='hub'){ hubListModal?.classList.add('show'); hubListModal?.setAttribute('aria-hidden','false'); return; }
      if(key==='all'){ fitView(); return; }
      if(key==='prev'){ dialogTitle.textContent='사사시대 Matrix'; dialogText.textContent='사사시대 Matrix 주소가 확정되면 이 버튼에 연결하면 됩니다.'; dialog.showModal(); return; }
      if(key==='next'){ dialogTitle.textContent='분열왕국 Matrix'; dialogText.textContent='분열왕국 Matrix 주소가 확정되면 이 버튼에 연결하면 됩니다.'; dialog.showModal(); return; }
      dialogTitle.textContent='홈'; dialogText.textContent='CEN Bible 메인 주소가 확정되면 이 버튼에 연결하면 됩니다.'; dialog.showModal();
    });
  });
  closeDialog.addEventListener('click', ()=>dialog.close());

  hubListClose?.addEventListener('click', ()=>{
    hubListModal.classList.remove('show');
    hubListModal.setAttribute('aria-hidden','true');
  });
  hubListModal?.addEventListener('click', (e)=>{
    if(e.target === hubListModal){
      hubListModal.classList.remove('show');
      hubListModal.setAttribute('aria-hidden','true');
    }
  });

  window.addEventListener('resize', fitView); window.addEventListener('load', fitView);
  if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{})); }
})();
