// =============================================
// 히트분양 - 메인 앱 로직 (디버깅 포함)
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('히트분양 앱 시작');
    console.log('Supabase URL:', SUPABASE_URL);
    console.log('Supabase Key 길이:', SUPABASE_ANON_KEY.length);

    // 연결 테스트
    try {
        const { data: testData, error: testError } = await supabase
            .from('job_posts')
            .select('id, title')
            .limit(1);

        console.log('DB 연결 테스트:', testData, testError);

        if (testError) {
            document.getElementById('bestJobs').innerHTML = 
                '<p style="color:red;padding:20px;">DB 연결 에러: ' + testError.message + '</p>';
            return;
        }

        if (!testData || testData.length === 0) {
            document.getElementById('bestJobs').innerHTML = 
                '<p style="color:orange;padding:20px;">데이터가 없습니다. Supabase에 데이터를 확인하세요.</p>';
            return;
        }
    } catch (e) {
        console.error('연결 실패:', e);
        document.getElementById('bestJobs').innerHTML = 
            '<p style="color:red;padding:20px;">Supabase 연결 실패: ' + e.message + '</p>';
        return;
    }

    // 데이터 로드
    await loadAdSlider();
    await loadBestJobs();
    await loadSuperiorJobs();
    await loadPremiumJobs();
    await loadNormalJobs();
    await loadNotices();
    loadStats();
    checkAuth();
});

// ---- AD 슬라이더 ----
let currentSlide = 0;
let adSlideCount = 0;

async function loadAdSlider() {
    const { data, error } = await supabase
        .from('job_posts')
        .select('*')
        .eq('ad_grade', 'ad')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log('AD 데이터:', data, error);
    if (error || !data || data.length === 0) return;

    const track = document.getElementById('sliderTrack');
    const dots = document.getElementById('sliderDots');
    if (!track || !dots) return;

    adSlideCount = data.length;

    track.innerHTML = data.map(function(job) {
        return '<div class="ad-item" onclick="goToJob(' + job.id + ')">' +
            '<span class="ad-badge">AD</span>' +
            '<div>' +
            '<div class="ad-text">' + escapeHtml(job.title) + '</div>' +
            '<div class="ad-sub">' + escapeHtml(job.description || '') + '</div>' +
            '</div></div>';
    }).join('');

    dots.innerHTML = data.map(function(_, i) {
        return '<div class="slider-dot ' + (i === 0 ? 'active' : '') + '" onclick="goToSlide(' + i + ')"></div>';
    }).join('');

    setInterval(function() { slideAd(1); }, 4000);
}

function slideAd(dir) {
    if (adSlideCount === 0) return;
    currentSlide = (currentSlide + dir + adSlideCount) % adSlideCount;
    goToSlide(currentSlide);
}

function goToSlide(index) {
    currentSlide = index;
    var track = document.getElementById('sliderTrack');
    if (track) track.style.transform = 'translateX(-' + (index * 100) + '%)';

    var dots = document.querySelectorAll('.slider-dot');
    for (var i = 0; i < dots.length; i++) {
        if (i === index) {
            dots[i].classList.add('active');
        } else {
            dots[i].classList.remove('active');
        }
    }
}

// ---- 베스트 현장 ----
async function loadBestJobs() {
    const { data, error } = await supabase
        .from('job_posts')
        .select('*')
        .eq('status', 'active')
        .order('view_count', { ascending: false })
        .limit(3);

    console.log('베스트 데이터:', data, error);
    if (error || !data || data.length === 0) return;

    var el = document.getElementById('bestJobs');
    if (!el) return;

    el.innerHTML = data.map(function(job) {
        return '<div class="best-card" onclick="goToJob(' + job.id + ')">' +
            '<div class="best-card-title">' + escapeHtml(job.site_name) + '</div>' +
            '<div class="best-card-info">' +
            renderTags(job) +
            '<span class="meta-badge">' + escapeHtml(job.recruit_position) + '</span>' +
            '<span class="meta-badge highlight">' + escapeHtml(job.commission_type) + '</span>' +
            (job.daily_pay ? '<span class="meta-badge">일비 ' + escapeHtml(job.daily_pay) + '</span>' : '') +
            '<span class="meta-badge">' + escapeHtml(job.experience) + '</span>' +
            '</div>' +
            '<div class="best-card-company">' + escapeHtml(job.company || '') + '</div>' +
            '</div>';
    }).join('');
}

// ---- 등급별 구인공고 ----
async function loadSuperiorJobs() {
    var data = await fetchJobsByGrade('superior', 6);
    console.log('슈페리어 데이터:', data);
    var el = document.getElementById('superiorJobs');
    if (el && data.length > 0) el.innerHTML = data.map(renderJobCard).join('');
}

async function loadPremiumJobs() {
    var data = await fetchJobsByGrade('premium', 8);
    console.log('프리미엄 데이터:', data);
    var el = document.getElementById('premiumJobs');
    if (el && data.length > 0) el.innerHTML = data.map(renderJobCard).join('');
}

async function loadNormalJobs() {
    const { data, error } = await supabase
        .from('job_posts')
        .select('*')
        .in('ad_grade', ['basic', 'normal'])
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(8);

    console.log('베이직/일반 데이터:', data, error);
    var el = document.getElementById('normalJobs');
    if (!error && data && data.length > 0 && el) {
        el.innerHTML = data.map(renderJobCard).join('');
    }
}

async function fetchJobsByGrade(grade, limit) {
    const { data, error } = await supabase
        .from('job_posts')
        .select('*')
        .eq('ad_grade', grade)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error(grade + ' 에러:', error);
        return [];
    }
    return data || [];
}

// ---- 구인카드 렌더링 ----
function renderJobCard(job) {
    var gradeLabels = {
        ad: 'AD', premium: '프리미엄', superior: '슈페리어', basic: '베이직', normal: ''
    };

    var gradeTag = '';
    if (job.ad_grade !== 'normal') {
        gradeTag = '<span class="tag tag-grade tag-grade-' + job.ad_grade + '">' + gradeLabels[job.ad_grade] + '</span>';
    }

    return '<div class="job-card" data-grade="' + job.ad_grade + '" onclick="goToJob(' + job.id + ')">' +
        '<div class="job-card-header"><div class="job-tags">' +
        gradeTag + renderTags(job) +
        '</div></div>' +
        '<div class="job-card-title">' + escapeHtml(job.title) + '</div>' +
        '<div class="job-card-meta">' +
        '<span class="meta-badge">' + escapeHtml(job.recruit_position) + '</span>' +
        '<span class="meta-badge highlight">' + escapeHtml(job.commission_type) + '</span>' +
        (job.daily_pay ? '<span class="meta-badge">일비 ' + escapeHtml(job.daily_pay) + '</span>' : '') +
        (job.dormitory_pay ? '<span class="meta-badge">숙소비 ' + escapeHtml(job.dormitory_pay) + '</span>' : '') +
        '<span class="meta-badge">' + escapeHtml(job.experience) + '</span>' +
        '</div>' +
        '<div class="job-card-bottom">' +
        '<span class="job-card-company">' + escapeHtml(job.company || '') + '</span>' +
        '<span>' + escapeHtml(job.location_sido) + ' ' + escapeHtml(job.location_sigungu || '') + '</span>' +
        '</div></div>';
}

function renderTags(job) {
    var tags = '';
    if (job.is_new) tags += '<span class="tag tag-new">신규</span>';
    if (job.is_hot) tags += '<span class="tag tag-hot">HOT</span>';
    if (job.is_urgent) tags += '<span class="tag tag-urgent">급구</span>';
    if (job.is_jackpot) tags += '<span class="tag tag-jackpot">대박</span>';
    if (job.is_discount) tags += '<span class="tag tag-discount">할인</span>';
    if (job.is_few) tags += '<span class="tag tag-few">소수</span>';
    return tags;
}

// ---- 공지사항 ----
async function loadNotices() {
    const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10);

    console.log('공지 데이터:', data, error);
    if (error || !data) return;

    var notices = [];
    var news = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i].category === '공지') {
            notices.push(data[i]);
        } else {
            news.push(data[i]);
        }
    }

    var noticeEl = document.getElementById('noticeList');
    var newsEl = document.getElementById('newsList');

    if (noticeEl) {
        noticeEl.innerHTML = notices.length > 0 ? notices.map(function(n) {
            return '<li><span><span class="notice-cat">' + escapeHtml(n.category) + '</span> ' +
                escapeHtml(n.title) + '</span>' +
                '<span class="notice-date">' + formatDate(n.created_at) + '</span></li>';
        }).join('') : '<li>등록된 공지가 없습니다.</li>';
    }

    if (newsEl) {
        newsEl.innerHTML = news.length > 0 ? news.map(function(n) {
            return '<li><span><span class="notice-cat">' + escapeHtml(n.category) + '</span> ' +
                escapeHtml(n.title) + '</span>' +
                '<span class="notice-date">' + formatDate(n.created_at) + '</span></li>';
        }).join('') : '<li>등록된 뉴스가 없습니다.</li>';
    }
}

// ---- 통계 ----
function loadStats() {
    var visitors = Math.floor(Math.random() * 3000) + 2000;
    animateNumber('statVisitors', visitors);
    animateNumber('statNew', 239);
    var totalEl = document.getElementById('statTotal');
    if (totalEl) totalEl.textContent = '314,199';
}

function animateNumber(id, target) {
    var el = document.getElementById(id);
    if (!el) return;
    var current = 0;
    var step = Math.ceil(target / 40);
    var timer = setInterval(function() {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = current.toLocaleString();
    }, 30);
}

// ---- 인증 ----
async function checkAuth() {
    try {
        const { data } = await supabase.auth.getUser();
        var authEl = document.getElementById('headerAuth');
        if (data && data.user && authEl) {
            authEl.innerHTML = '<span style="color:#fff;">환영합니다!</span>' +
                '<a href="pages/mypage.html">마이페이지</a>' +
                '<a href="#" onclick="logout()">로그아웃</a>';
        }
    } catch(e) {
        console.log('인증 체크 에러:', e);
    }
}

async function logout() {
    await supabase.auth.signOut();
    location.reload();
}

// ---- 유틸 ----
function goToJob(id) {
    location.href = 'pages/job-detail.html?id=' + id;
}

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateStr) {
    var d = new Date(dateStr);
    return (d.getMonth() + 1) + '.' + d.getDate();
}

function toggleMenu() {
    var nav = document.getElementById('mainNav');
    if (nav) nav.classList.toggle('open');
}
