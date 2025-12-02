gsap.registerPlugin(ScrollTrigger);

// --- 1. HERO SECTION (Pinned) ---
const heroTl = gsap.timeline({
  scrollTrigger: {
    trigger: ".hero-section",
    start: "top top",
    end: "+=2000", // Pinned for 2000px scroll
    pin: true,
    scrub: 1,
    anticipatePin: 1
  }
});

gsap.set(".glass-container", { scale: 0.6, opacity: 0 });
gsap.set(".border-frame", { opacity: 0, scale: 1.05 });
gsap.set("#uni", { x: 0, opacity: 1 });
gsap.set("#vibe", { x: 0, opacity: 1 });

heroTl.to("#uni", { x: -600, opacity: 0, scale: 0.8, duration: 2 }, "start")
      .to("#vibe", { x: 600, opacity: 0, scale: 0.8, duration: 2 }, "start")
      .to(".glass-container", { scale: 1, opacity: 1, duration: 2.5, ease: "elastic.out(1, 0.75)" }, "-=1.5")
      .to(".border-frame", { opacity: 1, scale: 1, duration: 1.5 }, "-=1.0")

      .from(".hero-btns", { y: 20, opacity: 0, duration: 1 }, "-=0.5");


// --- 2. 3D SCROLL ANIMATION ---
const container = document.getElementById("containerScroll");
const header = document.getElementById("header");
const card = document.getElementById("card");

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function updateScrollAnimation() {
  if (!container || !header || !card) return;
  const rect = container.getBoundingClientRect();
  
  // Logic: 0 to 1 based on container position
  let progress = 1 - (rect.bottom / (window.innerHeight + rect.height));
  progress = Math.min(Math.max(progress, 0), 1);

  const isMobile = window.innerWidth <= 768;
  const scaleStart = isMobile ? 0.7 : 1.05;
  const scaleEnd = isMobile ? 0.9 : 1;

  const rotateX = lerp(20, 0, progress);
  const scale = lerp(scaleStart, scaleEnd, progress);
  const translateHeader = lerp(0, -100, progress);

  // Apply transforms
  header.style.transform = `translateY(${translateHeader}px)`;
  card.style.transform = `rotateX(${rotateX}deg) scale(${scale})`;
}

// Attach listener
window.addEventListener("scroll", updateScrollAnimation);
window.addEventListener("resize", updateScrollAnimation);
updateScrollAnimation();


// --- 3. HORIZONTAL SCROLL (Calculated) ---
const horizontalSection = document.querySelector(".horizontal-section");
const horizontalWrapper = document.querySelector(".horizontal-wrapper");

if (horizontalSection && horizontalWrapper) {
  // Get the total scroll width needed: (total width) - (viewport width)
  const getScrollAmount = () => -(horizontalWrapper.scrollWidth - window.innerWidth);

  gsap.to(horizontalWrapper, {
    x: getScrollAmount,
    ease: "none",
    scrollTrigger: {
      trigger: ".horizontal-section",
      start: "top top",
      end: () => `+=${horizontalWrapper.scrollWidth - window.innerWidth}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true // Recalculate on resize
    }
  });
}


// --- 4. FLOATING NAVBAR ---
const navbar = document.querySelector(".floating-nav");
if (navbar) {
  ScrollTrigger.create({
    trigger: ".container-scroll", // Trigger when the problem section starts
    start: "top 80%",
    onEnter: () => gsap.to(navbar, { y: 0, duration: 0.5, ease: "power3.out" }),
    onLeaveBack: () => gsap.to(navbar, { y: "-100%", duration: 0.5, ease: "power3.in" }),
  });
}


// --- 5. CALCULATOR ---
const inputA = document.getElementById("input-a");
const inputP = document.getElementById("input-p");
const inputC = document.getElementById("input-c");
const scoreRing = document.getElementById("score-ring");
const finalScoreEl = document.getElementById("final-score");
const MAX_DASH = 565; // Circumference of circle with r=90

function calculateEI() {
  if(!inputA || !inputP || !inputC) return;
  
  const A = parseInt(inputA.value); 
  const P = parseInt(inputP.value); 
  const C = parseInt(inputC.value); 

  document.getElementById("val-a").innerText = A + "%";
  document.getElementById("val-p").innerText = P + "/100";
  document.getElementById("val-c").innerText = C + "/100";

  let rawScore = (A * 0.4) + (P * 0.4) + (C * 0.2); // Result 0-100
  let finalScore = Math.round(rawScore * 10); // Result 0-1000

  finalScoreEl.innerText = finalScore;
  
  // Calculate stroke offset (inverse)
  // offset = MAX - (percent * MAX)
  const offset = MAX_DASH - (rawScore / 100) * MAX_DASH;
  scoreRing.style.strokeDashoffset = offset;
}

if(inputA) {
  inputA.addEventListener("input", calculateEI);
  inputP.addEventListener("input", calculateEI);
  inputC.addEventListener("input", calculateEI);
  calculateEI(); // Init
}


// --- 6. BACKGROUND BLOBS ---
gsap.to(".blob", {
  y: "random(-50, 50)",
  x: "random(-50, 50)",
  scale: "random(0.9, 1.1)",
  duration: "random(5, 10)",
  ease: "sine.inOut",
  repeat: -1,
  yoyo: true,
  stagger: 1
});

// Interactive Parallax
window.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 2; 
  const y = (e.clientY / window.innerHeight - 0.5) * 2;
  gsap.to(".blob-1", { x: x * 60, y: y * 60, duration: 2, overwrite: "auto" });
  gsap.to(".blob-2", { x: x * -50, y: y * -50, duration: 2.5, overwrite: "auto" });
});


// --- 7. RECRUITER SEARCH LOGIC ---
const searchInput = document.getElementById('recruiterSearch');
const candidateRows = document.querySelectorAll('.candidate-row');
const chips = document.querySelectorAll('.filter-chip');

function filterCandidates(filterType) {
    // 1. Update Chips
    chips.forEach(chip => {
        if(chip.innerText.includes(filterType) || (filterType === 'all' && chip.innerText === 'All')) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });

    // 2. Filter Rows
    candidateRows.forEach(row => {
        const role = row.getAttribute('data-role');
        const text = row.innerText.toLowerCase();
        
        let shouldShow = false;
        
        // Logic
        if(filterType === 'all') shouldShow = true;
        else if (['Dev', 'Design', 'Data'].includes(filterType)) {
            if(role === filterType) shouldShow = true;
        } else {
            // Text search
            if(text.includes(filterType.toLowerCase())) shouldShow = true;
        }

        if(shouldShow) row.classList.remove('hidden');
        else row.classList.add('hidden');
    });
}

if(searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        const val = e.target.value;
        chips.forEach(c => c.classList.remove('active'));
        filterCandidates(val);
    });
}