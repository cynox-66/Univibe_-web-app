/**
 * leaderboard.js
 * Handles fetching, filtering, and displaying the ranked user list from Firestore.
 */

import { getLeaderboardData } from './services/firestore.js';

document.addEventListener("DOMContentLoaded", () => {
    // Initial load
    loadLeaderboardData();
    
    // Attach search listener
    document.getElementById('lb-search').addEventListener('keyup', () => loadLeaderboardData());
});

// Attach event listeners globally after the page is loaded
window.loadLeaderboardData = async function() {
    const sortField = document.getElementById('lb-sort').value;
    const searchFilter = document.getElementById('lb-search').value.toLowerCase();
    const listContainer = document.getElementById('leaderboard-list');
    const statusEl = document.getElementById('lb-status');
    const titleEl = document.getElementById('lb-sort-title');

    listContainer.innerHTML = '';
    statusEl.innerText = "Fetching the top vibers...";
    titleEl.innerText = sortField.toUpperCase().replace('EI', 'EI Score');
    
    // 1. ASYNC FETCH: Get data sorted by the selected field (from Firestore)
    let data = await getLeaderboardData(sortField); 

    // 2. Client-side Filtering
    if (searchFilter) {
        data = data.filter(p => 
            p.name.toLowerCase().includes(searchFilter) || 
            p.major.toLowerCase().includes(searchFilter)
        );
    }
    
    if (data.length === 0) {
        statusEl.innerText = "No results found.";
        return;
    }
    
    statusEl.innerText = `Showing ${data.length} results.`;

    // 3. Render List
    data.forEach((p, index) => {
        const rank = index + 1;
        const row = document.createElement('div');
        // Add unique rank class for medal styling
        row.className = `lb-row rank-${rank}`; 
        
        // Use safe accessors for potentially missing fields
        let scoreValue = p[sortField] || 0;
        
        row.innerHTML = `
            <span class="lb-rank">#${rank}</span>
            <div class="lb-user-info">
                <div class="lb-avatar" style="background:${p.color || '#8ba37e'}">${p.name[0]}</div>
                <span>${p.name}</span>
            </div>
            <span>${p.major || 'N/A'}</span>
            <span class="lb-score">${scoreValue}</span>
        `;
        listContainer.appendChild(row);
        
        // Animate row entry
        gsap.fromTo(row, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: index * 0.05, ease: "power2.out" });
    });
}