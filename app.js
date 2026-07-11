// ===============================================
// GOVGUIDE AI — App JavaScript
// All screens, interactions, and chat logic
// ===============================================

// ---- DATA ----
const GRANTS_DATA = [
  {
    id: 1, icon: '🎓',
    name: 'Youth Innovation Grant',
    org: 'Ministry of Education',
    amount: '5,000,000 ₸',
    match: 95, matchType: 'high',
    deadline: 'Jul 30, 2026',
    tags: ['Student', 'Innovation', '18-29'],
    requirements: ['Kazakhstan citizen', 'Age 18-29', 'Student status', 'Business idea']
  },
  {
    id: 2, icon: '🚀',
    name: 'Astana Hub Incubation Program',
    org: 'Astana Hub',
    amount: '10,000,000 ₸',
    match: 88, matchType: 'high',
    deadline: 'Aug 1, 2026',
    tags: ['Startup', 'Tech', 'Incubator'],
    requirements: ['Tech startup idea', 'MVP or prototype', 'Team of 2+']
  },
  {
    id: 3, icon: '💼',
    name: 'Baiterek Startup Fund',
    org: 'Baiterek Holding',
    amount: '25,000,000 ₸',
    match: 76, matchType: 'med',
    deadline: 'Aug 15, 2026',
    tags: ['Business', 'Entrepreneurship', 'SME'],
    requirements: ['Business plan', 'Registered entity', 'Kazakhstan resident']
  },
  {
    id: 4, icon: '🏠',
    name: 'Young Family Housing Support',
    org: 'Housing Committee',
    amount: '15,000,000 ₸',
    match: 70, matchType: 'med',
    deadline: 'Sep 1, 2026',
    tags: ['Housing', 'Family', 'Mortgage'],
    requirements: ['Married couple', 'Under 35', 'No owned property']
  },
  {
    id: 5, icon: '🔬',
    name: 'Zhasyl Damu Eco Grant',
    org: 'Ministry of Ecology',
    amount: '8,000,000 ₸',
    match: 65, matchType: 'med',
    deadline: 'Sep 10, 2026',
    tags: ['Ecology', 'GreenTech', 'Startup'],
    requirements: ['Eco-focused project', 'Business plan', 'Impact metrics']
  },
  {
    id: 6, icon: '🎨',
    name: 'Creative Industries Grant',
    org: 'Ministry of Culture',
    amount: '3,000,000 ₸',
    match: 58, matchType: 'med',
    deadline: 'Sep 20, 2026',
    tags: ['Culture', 'Creative', 'Art'],
    requirements: ['Creative project', 'Portfolio', 'Kazakhstan citizen']
  }
];

const CHAT_RESPONSES = {
  startup: {
    text: `Based on your profile, I found <strong>3 excellent programs</strong> for starting an IT startup in Kazakhstan:`,
    programs: [
      { name: 'Astana Hub Incubation', match: '88%', matchType: 'high', org: 'Astana Hub' },
      { name: 'Youth Innovation Grant', match: '95%', matchType: 'high', org: 'Ministry of Education' }
    ],
    docs: ['Business Plan', 'ID / Passport', 'Team CVs', 'MVP Demo'],
    action: 'Generate Application Roadmap'
  },
  scholarship: {
    text: `I found <strong>4 scholarship programs</strong> matching your student profile:`,
    programs: [
      { name: 'Bolashak Scholarship', match: '92%', matchType: 'high', org: 'President\'s Fund' },
      { name: 'Youth Innovation Grant', match: '87%', matchType: 'high', org: 'Ministry of Education' }
    ],
    docs: ['Student Certificate', 'Transcript (GPA 2.5+)', 'Passport', 'Recommendation Letter'],
    action: 'View All Scholarships'
  },
  housing: {
    text: `For housing support in Kazakhstan, here are your options:`,
    programs: [
      { name: 'Young Family Housing', match: '70%', matchType: 'med', org: 'Housing Committee' },
      { name: '7-20-25 Mortgage Program', match: '65%', matchType: 'med', org: 'Baiterek' }
    ],
    docs: ['Marriage Certificate', 'Income Certificate', 'Passport', 'Application Form'],
    action: 'Check Full Eligibility'
  },
  social: {
    text: `I found several social support programs you may qualify for:`,
    programs: [
      { name: 'Low-Income Family Support', match: '80%', matchType: 'high', org: 'Ministry of Labor' },
      { name: 'Disability Assistance Program', match: '60%', matchType: 'med', org: 'Social Security' }
    ],
    docs: ['Income Certificate', 'Family Composition', 'Passport', 'Medical Certificate'],
    action: 'Start Application'
  }
};

// ---- NAV & ROUTING ----
let currentScreen = null;

function showScreen(screen) {
  document.getElementById('landingPage').style.display = 'none';
  document.getElementById('appScreens').style.display = 'block';
  window.scrollTo(0, 0);

  // Update sidebar active
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
  const nav = document.getElementById('nav-' + screen);
  if (nav) nav.classList.add('active');

  // Update mobile nav active
  document.querySelectorAll('.mbn-item').forEach(el => el.classList.remove('active'));
  const mbn = document.getElementById('mbn-' + screen);
  if (mbn) mbn.classList.add('active');

  currentScreen = screen;
  renderScreen(screen);
}

function showLanding() {
  document.getElementById('landingPage').style.display = 'block';
  document.getElementById('appScreens').style.display = 'none';
  window.scrollTo(0, 0);
}

function renderScreen(screen) {
  const content = document.getElementById('appContent');
  content.innerHTML = '';
  content.classList.add('fade-in');
  setTimeout(() => content.classList.remove('fade-in'), 500);

  switch (screen) {
    case 'dashboard': content.innerHTML = renderDashboard(); initDashboard(); break;
    case 'chat': content.innerHTML = renderChat(); initChat(); break;
    case 'eligibility': content.innerHTML = renderEligibility(); initEligibility(); break;
    case 'documents': content.innerHTML = renderDocuments(); break;
    case 'roadmap': content.innerHTML = renderRoadmap(); break;
    case 'opportunities': content.innerHTML = renderOpportunities(); initOpportunities(); break;
    case 'profile': content.innerHTML = renderProfile(); initProfile(); break;
    default: content.innerHTML = renderDashboard(); initDashboard();
  }
}

// ---- DASHBOARD ----
function renderDashboard() {
  return `
    <div class="dashboard-header fade-in">
      <div class="dash-greeting">Good evening, Aibek 👋</div>
      <div class="dash-sub">Your opportunity dashboard — <span>Updated just now</span></div>
    </div>

    <!-- AI Command Center -->
    <div class="command-center fade-in fade-in-1">
      <div class="cc-stats">
        <div class="cc-stat">
          <div class="cc-dot green"></div>
          <div class="cc-label"><strong>4 grants</strong> match your profile</div>
        </div>
        <div class="cc-stat">
          <div class="cc-dot yellow"></div>
          <div class="cc-label"><strong>2 documents</strong> still missing</div>
        </div>
        <div class="cc-stat">
          <div class="cc-dot blue"></div>
          <div class="cc-label"><strong>Deadline in 5 days</strong> — Baiterek Grant</div>
        </div>
      </div>
      <button class="cc-cta" onclick="showScreen('chat')">💬 Talk to AI</button>
    </div>

    <!-- AI Proactive Tip -->
    <div class="ai-tip fade-in fade-in-1" style="margin-bottom:20px;">
      <div class="ai-tip-header">🤖 AI Tip — Just for you</div>
      <div class="ai-tip-text">"A new Baiterek startup grant opened today. Based on your profile, you're likely eligible. Deadline: July 28. <span style="color:var(--green-light);cursor:pointer;" onclick="showScreen('opportunities')">View Grant →</span>"</div>
    </div>

    <div class="dash-grid fade-in fade-in-2">
      <div>
        <div class="dash-section-title">🎯 Recommended for You</div>
        <div class="opportunity-cards">
          ${GRANTS_DATA.slice(0, 3).map(g => `
            <div class="opp-card" onclick="showScreen('opportunities')">
              <div class="opp-icon">${g.icon}</div>
              <div class="opp-info">
                <div class="opp-name">${g.name}</div>
                <div class="opp-org">${g.org}</div>
              </div>
              <div class="opp-meta">
                <div class="opp-match ${g.matchType}">${g.match}% match</div>
                <div class="opp-deadline">⏰ ${g.deadline}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="dash-sidebar-cards">
        <div class="dash-card">
          <div class="dash-section-title">📅 Upcoming Deadlines</div>
          <div class="deadline-list">
            <div class="dl-item"><span class="dl-date">Jul 14</span><span class="dl-name">Youth Innovation Grant</span></div>
            <div class="dl-item"><span class="dl-date">Jul 20</span><span class="dl-name">Astana Hub — Round 3</span></div>
            <div class="dl-item"><span class="dl-date">Aug 1</span><span class="dl-name">Baiterek Startup Fund</span></div>
            <div class="dl-item"><span class="dl-date">Aug 15</span><span class="dl-name">Eco-Tech Grant 2026</span></div>
          </div>
        </div>
        <div class="dash-card">
          <div class="dash-section-title">✅ Today's Tasks</div>
          <div class="task-list" id="taskList">
            <div class="task-item"><div class="task-check done" onclick="toggleTask(this)"></div><span>Upload student certificate</span></div>
            <div class="task-item"><div class="task-check" onclick="toggleTask(this)"></div><span>Finish business plan draft</span></div>
            <div class="task-item"><div class="task-check" onclick="toggleTask(this)"></div><span>Submit Astana Hub application</span></div>
            <div class="task-item"><div class="task-check" onclick="toggleTask(this)"></div><span>Get income certificate</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initDashboard() {}

function toggleTask(el) {
  el.classList.toggle('done');
}

// ---- CHAT ----
let chatMessages = [
  { type: 'ai', text: 'Hello! I\'m <strong>GovGuide AI</strong> — your personal government navigator for Kazakhstan. 🇰🇿<br/><br/>Ask me about grants, scholarships, subsidies, required documents, or anything related to government programs.', time: 'Now' }
];

function renderChat() {
  return `
    <div class="chat-layout">
      <div class="chat-main">
        <div class="chat-top">
          <div class="chat-avatar" style="width:36px;height:36px;background:linear-gradient(135deg,var(--green),var(--green-dark));border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <div style="font-weight:700;font-size:0.9rem;">GovGuide AI</div>
            <div style="font-size:0.75rem;color:var(--green-light);display:flex;align-items:center;gap:4px;"><span style="width:6px;height:6px;background:var(--green);border-radius:50%;display:inline-block;"></span> Online · 500+ programs indexed</div>
          </div>
          <div style="margin-left:auto;font-size:0.78rem;color:var(--text-muted);">🔒 Secure · Private</div>
        </div>

        <div class="chat-messages" id="chatMessages">
          ${renderChatMessages()}
        </div>

        <div class="quick-chips" id="quickChips">
          <div class="quick-chip" onclick="sendQuickMessage('startup')">💼 I want to start a business</div>
          <div class="quick-chip" onclick="sendQuickMessage('scholarship')">🎓 Student scholarships</div>
          <div class="quick-chip" onclick="sendQuickMessage('housing')">🏠 Housing support</div>
          <div class="quick-chip" onclick="sendQuickMessage('social')">❤️ Social benefits</div>
        </div>

        <div class="chat-input-area">
          <textarea class="chat-input" id="chatInput" placeholder="Ask anything about grants, documents, or programs..." rows="1" onkeydown="handleChatKey(event)"></textarea>
          <button class="chat-send" onclick="sendChatMessage()" id="sendBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderChatMessages() {
  return chatMessages.map(msg => {
    if (msg.type === 'ai') {
      return `
        <div class="chat-msg">
          <div class="msg-avatar ai">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>
          </div>
          <div class="msg-content">
            <div class="msg-text">${msg.text}</div>
            ${msg.programs ? renderResultCards(msg.programs) : ''}
            ${msg.docs ? renderDocInline(msg.docs) : ''}
            ${msg.action ? `<button class="action-btn" onclick="showScreen('roadmap')">🗺️ ${msg.action}</button>` : ''}
            <div class="msg-time">${msg.time}</div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="chat-msg user">
          <div class="msg-avatar user-av">A</div>
          <div class="msg-content">
            <div class="msg-text">${msg.text}</div>
            <div class="msg-time">${msg.time}</div>
          </div>
        </div>
      `;
    }
  }).join('');
}

function renderResultCards(programs) {
  return `
    <div class="result-cards">
      ${programs.map(p => `
        <div class="result-card" onclick="showScreen('opportunities')">
          <div class="rc-name">${p.name}</div>
          <div class="rc-match ${p.matchType}">${p.match} match</div>
          <div class="rc-org">${p.org}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDocInline(docs) {
  return `
    <div class="doc-inline">
      <div class="di-title">Required Documents</div>
      <div class="di-list">
        ${docs.map(d => `<span class="di-item">☑ ${d}</span>`).join('')}
      </div>
    </div>
  `;
}

function initChat() {
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  const input = document.getElementById('chatInput');
  if (input) {
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChatMessage();
  }
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  const now = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  // Add user message
  chatMessages.push({ type: 'user', text, time: now });
  input.value = '';
  input.style.height = '48px';

  // Add thinking message
  chatMessages.push({ type: 'ai', text: '<div class="ai-typing"><span></span><span></span><span></span></div>', time: '' });
  updateChatUI();

  // Determine response
  setTimeout(() => {
    chatMessages.pop();
    const lower = text.toLowerCase();
    let response;
    if (lower.includes('startup') || lower.includes('business') || lower.includes('бизнес')) {
      response = CHAT_RESPONSES.startup;
    } else if (lower.includes('scholar') || lower.includes('student') || lower.includes('стипенд') || lower.includes('grant')) {
      response = CHAT_RESPONSES.scholarship;
    } else if (lower.includes('hous') || lower.includes('жилье') || lower.includes('квартир')) {
      response = CHAT_RESPONSES.housing;
    } else if (lower.includes('social') || lower.includes('benefit') || lower.includes('пособи')) {
      response = CHAT_RESPONSES.social;
    } else {
      response = {
        text: `I searched across <strong>500+ government programs</strong> for "<em>${text}</em>".<br/><br/>To give you a precise answer, could you tell me:<br/>• Your age<br/>• Your region<br/>• Your current status (student/employed/self-employed)?`,
        time: now
      };
    }

    chatMessages.push({
      type: 'ai',
      text: response.text,
      programs: response.programs,
      docs: response.docs,
      action: response.action,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    updateChatUI();
  }, 1500);
}

function sendQuickMessage(type) {
  const prompts = {
    startup: 'I want to start a business in Kazakhstan.',
    scholarship: 'What student scholarships are available for me?',
    housing: 'How can I get housing support?',
    social: 'What social benefits can I receive?'
  };
  document.getElementById('chatInput').value = prompts[type];
  sendChatMessage();
  // Hide quick chips after use
  const qc = document.getElementById('quickChips');
  if (qc) qc.style.display = 'none';
}

function updateChatUI() {
  const container = document.getElementById('chatMessages');
  if (container) {
    container.innerHTML = renderChatMessages();
    container.scrollTop = container.scrollHeight;
  }
}

// ---- ELIGIBILITY ----
function renderEligibility() {
  return `
    <div class="eligibility-form">
      <div class="form-title">🎯 Smart Eligibility Checker</div>
      <div class="form-sub">Enter your details and AI will instantly find all programs you qualify for.</div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Age</label>
          <input class="form-input" id="elig-age" type="number" placeholder="e.g. 22" min="14" max="90" value="22"/>
        </div>
        <div class="form-group">
          <label class="form-label">Region</label>
          <select class="form-select" id="elig-region">
            <option>Almaty</option>
            <option>Astana</option>
            <option selected>Karaganda</option>
            <option>Shymkent</option>
            <option>Aktobe</option>
            <option>Atyrau</option>
            <option>Pavlodar</option>
            <option>Kostanay</option>
            <option>East Kazakhstan</option>
            <option>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Monthly Income (₸)</label>
          <input class="form-input" id="elig-income" type="number" placeholder="e.g. 150000" value="80000"/>
        </div>
        <div class="form-group">
          <label class="form-label">Employment</label>
          <select class="form-select" id="elig-employment">
            <option selected>Student</option>
            <option>Employed</option>
            <option>Unemployed</option>
            <option>Self-employed</option>
            <option>Business owner</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:20px;">
        <label class="form-label">Status / Interests</label>
        <div class="check-group" id="statusGroup">
          <div class="check-option selected" onclick="toggleOption(this)">🎓 Student</div>
          <div class="check-option" onclick="toggleOption(this)">💼 Entrepreneur</div>
          <div class="check-option" onclick="toggleOption(this)">👨‍👩‍👧 With Family</div>
          <div class="check-option selected" onclick="toggleOption(this)">💻 Tech/IT</div>
          <div class="check-option" onclick="toggleOption(this)">🌱 Eco Projects</div>
          <div class="check-option" onclick="toggleOption(this)">🎨 Creative</div>
        </div>
      </div>
      <button class="check-btn" onclick="runEligibilityCheck()">🔍 Check My Eligibility →</button>
      <div id="eligibilityResults"></div>
    </div>
  `;
}

function initEligibility() {}

function toggleOption(el) {
  el.classList.toggle('selected');
}

function runEligibilityCheck() {
  const btn = document.querySelector('.check-btn');
  btn.textContent = '⏳ AI is checking...';
  btn.disabled = true;
  btn.style.opacity = '0.7';

  setTimeout(() => {
    btn.textContent = '🔍 Check My Eligibility →';
    btn.disabled = false;
    btn.style.opacity = '1';

    document.getElementById('eligibilityResults').innerHTML = `
      <div class="results-section">
        <div class="result-title">✅ Found ${GRANTS_DATA.length} programs for you</div>
        ${GRANTS_DATA.map(g => `
          <div class="eligibility-result">
            <div class="er-score-ring ${g.matchType === 'med' ? 'med' : ''}">${g.match}%</div>
            <div class="er-info">
              <div class="er-name">${g.icon} ${g.name}</div>
              <div class="er-org">${g.org} · ${g.amount} · Deadline: ${g.deadline}</div>
              <div class="er-chips">
                ${g.requirements.slice(0,3).map(r => `<span class="er-chip">✓ ${r}</span>`).join('')}
              </div>
            </div>
            <button class="er-apply" onclick="showScreen('opportunities')">Apply →</button>
          </div>
        `).join('')}
      </div>
    `;

    // Smooth scroll to results
    document.getElementById('eligibilityResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 2000);
}

// ---- DOCUMENTS ----
function renderDocuments() {
  return `
    <div class="doc-screen">
      <div class="doc-header">
        <div class="form-title">📋 Document Manager</div>
        <div class="form-sub">Upload and track all your documents. AI checks their validity and tells you what's missing.</div>
      </div>

      <div class="upload-zone" onclick="simulateUpload()">
        <div class="upload-icon">📄</div>
        <div class="upload-title">Drop files here or click to upload</div>
        <div class="upload-sub">Supports PDF, JPG, PNG · AI analyzes immediately</div>
      </div>

      <div class="doc-grid">
        <div class="doc-list-card">
          <div class="doc-list-title">Youth Innovation Grant — Documents</div>

          <div class="doc-item">
            <div class="doc-status ok">✓</div>
            <div>
              <div class="doc-name">Passport / National ID</div>
              <div class="doc-sub">Uploaded · Valid until 2028</div>
            </div>
            <div class="doc-action">View</div>
          </div>

          <div class="doc-item">
            <div class="doc-status ok">✓</div>
            <div>
              <div class="doc-name">Student Certificate</div>
              <div class="doc-sub">Uploaded · KarSU, 2026</div>
            </div>
            <div class="doc-action">View</div>
          </div>

          <div class="doc-item">
            <div class="doc-status warn">!</div>
            <div>
              <div class="doc-name">Academic Transcript</div>
              <div class="doc-sub">⚠️ Needs update — GPA required</div>
            </div>
            <div class="doc-action" style="color:var(--orange);">Update</div>
          </div>

          <div class="doc-item">
            <div class="doc-status error">✕</div>
            <div>
              <div class="doc-name">Business Plan</div>
              <div class="doc-sub">❌ Not uploaded yet</div>
            </div>
            <div class="doc-action" style="color:var(--green-light);">Upload</div>
          </div>

          <div class="doc-item">
            <div class="doc-status error">✕</div>
            <div>
              <div class="doc-name">Tax Registration Certificate</div>
              <div class="doc-sub">❌ Not uploaded yet</div>
            </div>
            <div class="doc-action" style="color:var(--green-light);">Upload</div>
          </div>
        </div>

        <div>
          <div class="doc-list-card" style="margin-bottom:16px;">
            <div class="doc-list-title">AI Status Report</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;padding:14px;">
                <div style="font-size:0.82rem;font-weight:700;color:var(--green-light);margin-bottom:6px;">✅ Verified (2/5)</div>
                <div style="font-size:0.78rem;color:var(--text-secondary);">Passport and Student Certificate are valid and complete.</div>
              </div>
              <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px;">
                <div style="font-size:0.82rem;font-weight:700;color:var(--orange);margin-bottom:6px;">⚠️ Needs Attention (1/5)</div>
                <div style="font-size:0.78rem;color:var(--text-secondary);">Transcript needs updated GPA statement for current semester.</div>
              </div>
              <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:14px;">
                <div style="font-size:0.82rem;font-weight:700;color:#FCA5A5;margin-bottom:6px;">❌ Missing (2/5)</div>
                <div style="font-size:0.78rem;color:var(--text-secondary);">Business Plan and Tax Certificate are required. AI can help you draft the Business Plan.</div>
              </div>
            </div>
          </div>

          <div class="doc-list-card">
            <div class="doc-list-title">Where to Get Missing Documents</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div style="font-size:0.83rem;color:var(--text-secondary);padding:10px 0;border-bottom:1px solid var(--border);">
                <div style="font-weight:600;color:var(--text-primary);margin-bottom:3px;">📋 Business Plan</div>
                <div>Use our AI Form Fill Assistant or download a template from egov.kz</div>
              </div>
              <div style="font-size:0.83rem;color:var(--text-secondary);padding:10px 0;">
                <div style="font-weight:600;color:var(--text-primary);margin-bottom:3px;">🏢 Tax Certificate</div>
                <div>Get from your local Tax Committee or via egov.kz in ~1 business day</div>
              </div>
            </div>
            <button class="action-btn" style="width:100%;" onclick="showScreen('chat')">🤖 Ask AI for Help</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function simulateUpload() {
  const zone = document.querySelector('.upload-zone');
  zone.style.borderColor = 'var(--green)';
  zone.innerHTML = `
    <div class="upload-icon">⏳</div>
    <div class="upload-title">AI is analyzing your document...</div>
    <div class="upload-sub">Extracting text · Validating · Checking requirements</div>
  `;
  setTimeout(() => {
    zone.style.borderColor = 'rgba(16,185,129,0.5)';
    zone.innerHTML = `
      <div class="upload-icon">✅</div>
      <div class="upload-title" style="color:var(--green-light);">Document Verified!</div>
      <div class="upload-sub">Business Plan detected · Looks good · Click to upload another</div>
    `;
    setTimeout(() => {
      zone.style.borderColor = 'var(--border)';
      zone.innerHTML = `
        <div class="upload-icon">📄</div>
        <div class="upload-title">Drop files here or click to upload</div>
        <div class="upload-sub">Supports PDF, JPG, PNG · AI analyzes immediately</div>
      `;
    }, 3000);
  }, 2000);
}

// ---- ROADMAP ----
function renderRoadmap() {
  const steps = [
    { status: 'done', icon: '✓', title: 'Profile Created', desc: 'Your profile is set up with region, age, and interests.', date: 'Jul 1, 2026', active: false },
    { status: 'done', icon: '✓', title: 'Eligibility Checked', desc: 'AI found 6 matching programs for your profile.', date: 'Jul 3, 2026', active: false },
    { status: 'done', icon: '✓', title: 'Passport Uploaded', desc: 'Document verified and stored securely.', date: 'Jul 5, 2026', active: false },
    { status: 'active', icon: '→', title: 'Upload Remaining Documents', desc: 'Business Plan and Tax Certificate still needed.', date: 'Due: Jul 12, 2026', active: true },
    { status: '', icon: '5', title: 'Fill Application Form', desc: 'AI will help you fill the form conversationally.', date: 'Jul 13-14, 2026', active: false },
    { status: '', icon: '6', title: 'Review & Submit', desc: 'AI checks for errors before you submit.', date: 'Jul 15, 2026', active: false },
    { status: '', icon: '⏳', title: 'Waiting Period', desc: 'Ministry reviews applications (10 business days).', date: 'Jul 15 – Jul 30', active: false },
    { status: '', icon: '🎉', title: 'Grant Decision', desc: 'You\'ll receive an email and SMS notification.', date: 'Jul 30, 2026', active: false },
  ];

  return `
    <div class="roadmap-screen">
      <div style="margin-bottom:28px;">
        <div class="form-title">🗺️ Application Roadmap</div>
        <div class="form-sub">Your step-by-step guide to applying for the Youth Innovation Grant.</div>
      </div>

      <div class="roadmap-progress">
        <div class="rp-header">
          <span class="rp-title">Youth Innovation Grant — Application</span>
          <span class="rp-pct">37.5% Complete</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 37.5%"></div>
        </div>
      </div>

      <div class="roadmap-timeline">
        ${steps.map(step => `
          <div class="roadmap-item">
            <div class="rm-dot ${step.status}">${step.icon}</div>
            <div class="rm-content ${step.status}">
              <div class="rm-step-title">${step.title}</div>
              <div class="rm-step-desc">${step.desc}</div>
              <div class="rm-step-date">📅 ${step.date}</div>
              ${step.active ? `<button class="action-btn" style="margin-top:10px;" onclick="showScreen('documents')">Upload Documents →</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ---- OPPORTUNITIES ----
let activeFilter = 'all';

function renderOpportunities() {
  return `
    <div>
      <div style="margin-bottom:24px;">
        <div class="form-title">✨ All Opportunities</div>
        <div class="form-sub">AI-curated programs matching your profile. Updated daily from 15+ sources.</div>
      </div>

      <div class="opp-filters">
        <button class="opp-filter active" onclick="filterOpps(this, 'all')">All Programs</button>
        <button class="opp-filter" onclick="filterOpps(this, 'grant')">Grants</button>
        <button class="opp-filter" onclick="filterOpps(this, 'startup')">Startups</button>
        <button class="opp-filter" onclick="filterOpps(this, 'student')">Students</button>
        <button class="opp-filter" onclick="filterOpps(this, 'housing')">Housing</button>
      </div>

      <div class="opp-grid" id="oppGrid">
        ${GRANTS_DATA.map(g => `
          <div class="opp-full-card">
            <div class="ofc-top">
              <div class="ofc-icon">${g.icon}</div>
              <div class="ofc-match-badge ${g.matchType}">${g.match}% Match</div>
            </div>
            <div class="ofc-title">${g.name}</div>
            <div class="ofc-org">${g.org}</div>
            <div class="ofc-amount">${g.amount}</div>
            <div class="ofc-tags">
              ${g.tags.map(t => `<span class="ofc-tag">${t}</span>`).join('')}
            </div>
            <div class="ofc-footer">
              <div class="ofc-deadline">⏰ Deadline: ${g.deadline}</div>
              <button class="ofc-apply" onclick="showScreen('roadmap')">Apply →</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function initOpportunities() {}

function filterOpps(btn, filter) {
  document.querySelectorAll('.opp-filter').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = filter;
  // In a real app, filter grants data
}

// ---- PROFILE ----
function renderProfile() {
  return `
    <div class="profile-layout">
      <div class="profile-card">
        <div class="profile-avatar">A</div>
        <div class="profile-name">Aibek Nurlanov</div>
        <div class="profile-role">Student · Karaganda</div>
        <div class="profile-stats">
          <div class="ps-item"><div class="ps-num">6</div><div class="ps-label">Programs</div></div>
          <div class="ps-item"><div class="ps-num">2</div><div class="ps-label">Applied</div></div>
          <div class="ps-item"><div class="ps-num">3</div><div class="ps-label">Saved</div></div>
        </div>
        <div class="profile-badges">
          <div class="pb-item">🎓 Student Status Verified</div>
          <div class="pb-item">🇰🇿 Kazakhstan Citizen</div>
          <div class="pb-item">✅ Profile 80% Complete</div>
        </div>
      </div>

      <div class="profile-details">
        <div class="pd-card">
          <div class="pd-title">Personal Information</div>
          <div class="pd-grid">
            <div class="pd-item"><div class="pd-label">Full Name</div><div class="pd-value">Aibek Nurlanov</div></div>
            <div class="pd-item"><div class="pd-label">Age</div><div class="pd-value">22 years old</div></div>
            <div class="pd-item"><div class="pd-label">Region</div><div class="pd-value">Karaganda</div></div>
            <div class="pd-item"><div class="pd-label">Status</div><div class="pd-value">Student</div></div>
            <div class="pd-item"><div class="pd-label">University</div><div class="pd-value">KarSU</div></div>
            <div class="pd-item"><div class="pd-label">Year</div><div class="pd-value">3rd Year</div></div>
          </div>
        </div>

        <div class="pd-card">
          <div class="pd-title">Interests & Focus Areas</div>
          <div class="interest-tags" id="interestTags">
            <span class="interest-tag" onclick="this.classList.toggle('selected')">🤖 AI & ML</span>
            <span class="interest-tag" onclick="this.classList.toggle('selected')">💼 Entrepreneurship</span>
            <span class="interest-tag" onclick="this.classList.toggle('selected')">🎓 Scholarships</span>
            <span class="interest-tag" onclick="this.classList.toggle('selected')">🤖 Robotics</span>
            <span class="interest-tag" onclick="this.classList.toggle('selected')">🌱 GreenTech</span>
            <span class="interest-tag" onclick="this.classList.toggle('selected')">🎨 Design</span>
            <span class="interest-tag" onclick="this.classList.toggle('selected')">📱 Mobile Apps</span>
          </div>
        </div>

        <div class="pd-card">
          <div class="pd-title">Language Preference</div>
          <div class="lang-options">
            <div class="lang-opt active" onclick="setLang(this)">🇺🇸 English</div>
            <div class="lang-opt" onclick="setLang(this)">🇰🇿 Қазақша</div>
            <div class="lang-opt" onclick="setLang(this)">🇷🇺 Русский</div>
          </div>
        </div>

        <div class="pd-card">
          <div class="pd-title">Notification Settings</div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${[
              ['🔔 New grants matching my profile', true],
              ['📅 Deadline reminders (3 days before)', true],
              ['📧 Weekly opportunity digest', false],
              ['📱 Telegram notifications', false]
            ].map(([label, on]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:0.88rem;color:var(--text-secondary);">${label}</span>
                <div class="toggle-switch ${on ? 'on' : ''}" onclick="this.classList.toggle('on')" style="width:40px;height:22px;border-radius:11px;background:${on ? 'var(--green)' : 'rgba(255,255,255,0.1)'};cursor:pointer;position:relative;transition:all 0.3s;flex-shrink:0;">
                  <div style="position:absolute;top:3px;left:${on ? '21px' : '3px'};width:16px;height:16px;background:white;border-radius:50%;transition:all 0.3s;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function initProfile() {}

function setLang(el) {
  document.querySelectorAll('.lang-opt').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
}

// ---- NAVBAR SCROLL ----
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }
});

// ---- MOBILE MENU ----
function toggleMobileMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

// ---- HERO CHAT ANIMATION ----
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const typing = document.getElementById('aiTyping');
    const response = document.getElementById('aiResponse');
    if (typing && response) {
      typing.style.display = 'none';
      response.style.display = 'block';
    }
  }, 2800);

  // Scroll animations (Intersection Observer)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.how-step, .tech-card, .feature-card, .output-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});
