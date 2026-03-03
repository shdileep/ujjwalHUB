
import { Bin } from '../types';

/**
 * Deterministically shuffles an array based on a seed.
 * Note: Since we don't need cryptographic security, a simple seed-based shuffle is fine.
 * But to keep it simple and consistent for a "Demo" feel during a session, we can just use Math.random() 
 * if we accept re-shuffling on reload, OR use a hash of the bin ID to sort.
 * 
 * Requirement: "randomly distributed among the respective sub-areas".
 * Requirement: "25 Full, 15 Half-Full, 10 Empty".
 */

export const getSpecialAreaBins = (allBins: Bin[], areaName: string): Bin[] => {
    // 1. Filter bins that belong to this special area group
    // The passed 'allBins' should already be filtered by the caller using AREA_COMPONENT_MAPPING.
    // However, to be safe, we assume 'allBins' is the candidate list for the area.

    if (allBins.length === 0) return [];

    // 2. Shuffle the bins to ensure random distribution across sub-areas
    // We create a copy to avoid mutating the original array order
    const shuffled = [...allBins].sort(() => 0.5 - Math.random());

    // 3. Select exactly 50 bins (or fewer if not enough available)
    const selectedBins = shuffled.slice(0, 50);

    // 4. Assign statuses: 25 Full, 15 Half-Full, 10 Empty
    // We create a "deck" of statuses and shuffle it, then assign to the selected bins.
    const statuses = [
        ...Array(25).fill('Full'),
        ...Array(15).fill('Half Full'),
        ...Array(10).fill('Empty')
    ];

    // Shuffle statuses
    const shuffledStatuses = statuses.sort(() => 0.5 - Math.random());

    // 5. Apply statuses to the selected bins
    // We MUST return new objects to avoid mutating the global state references directly
    // in a way that might cause issues if these bins are also part of other views.
    return selectedBins.map((bin, index) => ({
        ...bin,
        status: shuffledStatuses[index] || 'Full' // Fallback to Full if we have > 50 bins (shouldn't happen with slice) or run out of statuses
    }));
};
