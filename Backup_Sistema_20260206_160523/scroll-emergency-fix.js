/**
 * SCROLL EMERGENCY FIX - Local testing only
 * Diagnoses and temporarily fixes scroll blocking issues
 * Fully reversible - all changes stored in window.__scrollFix
 * 
 * Usage in Console:
 *   ScrollEmergencyFix.diagnose()       - identify blockers
 *   ScrollEmergencyFix.fix()            - apply quick fixes
 *   ScrollEmergencyFix.revert()         - undo all changes
 *   ScrollEmergencyFix.status()         - show current state
 */

(function() {
  'use strict';

  window.__scrollFix = window.__scrollFix || {
    applied: false,
    changes: [],
    originals: {},
    overlaySelectors: [
      '.modal-overlay',
      '.mobile-overlay',
      '.modal-dialog-overlay',
      '.smart-loading-overlay',
      '.modal-content:not(.show)',
      '[role="dialog"]:not([aria-hidden="false"])',
      '.admin-nav.open + div' // overlay behind open menu
    ],
    problematicSelectors: [
      'html[style*="overflow"]',
      'body[style*="overflow: hidden"]',
      'body[style*="position: fixed"]',
      '.admin-content[style*="overflow: hidden"]',
      '.gallery-grid[style*="overflow: hidden"]'
    ]
  };

  const fix = window.__scrollFix;

  function log(...args) {
    console.log('[ScrollEmergencyFix]', ...args);
  }

  function diagnose() {
    log('=== DIAGNOSIS START ===');
    
    const issues = [];

    // Check html/body scroll/position
    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    
    if (htmlStyle.overflow === 'hidden' || getComputedStyle(document.documentElement).overflow === 'hidden') {
      issues.push('❌ HTML has overflow:hidden');
    }
    if (bodyStyle.overflow === 'hidden' || getComputedStyle(document.body).overflow === 'hidden') {
      issues.push('❌ BODY has overflow:hidden');
    }
    if (bodyStyle.position === 'fixed') {
      issues.push('❌ BODY has position:fixed (breaks scroll lock)');
    }

    // Check for visible overlays covering viewport
    const centerX = Math.round(innerWidth / 2);
    const centerY = Math.round(innerHeight / 2);
    const elementsAtCenter = document.elementsFromPoint(centerX, centerY) || [];
    
    const blockers = elementsAtCenter
      .filter(el => {
        const rect = el.getBoundingClientRect();
        const isLarge = rect.width > 100 && rect.height > 100;
        const hasPointerEvents = getComputedStyle(el).pointerEvents !== 'none';
        return isLarge && hasPointerEvents && el !== document.documentElement && el !== document.body;
      })
      .slice(0, 5);

    if (blockers.length > 0) {
      issues.push(`⚠️ Found ${blockers.length} large element(s) at center (potential blockers):`);
      blockers.forEach((el, i) => {
        const cs = getComputedStyle(el);
        issues.push(`  [${i+1}] ${el.tagName}#${el.id || '(no-id)'}.${el.className} - position:${cs.position}, pointerEvents:${cs.pointerEvents}, touchAction:${cs.touchAction || 'none'}`);
      });
    }

    // Check for modal-type overlays
    const overlays = document.querySelectorAll(fix.overlaySelectors.join(', '));
    if (overlays.length > 0) {
      issues.push(`ℹ️ Found ${overlays.length} overlay element(s):`);
      overlays.forEach((ov, i) => {
        const cs = getComputedStyle(ov);
        const vis = cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
        issues.push(`  [${i+1}] ${ov.tagName}#${ov.id || '(no-id)'} - visible:${vis}, display:${cs.display}, pointerEvents:${cs.pointerEvents}`);
      });
    }

    if (issues.length === 0) {
      issues.push('✅ No obvious scroll blockers detected');
    }

    log(issues.join('\n'));
    log('=== DIAGNOSIS END ===');
    return issues;
  }

  function fix_scroll() {
    if (fix.applied) {
      log('⚠️ Already applied - call revert() first if you want to re-apply');
      return false;
    }

    log('🔧 Applying scroll fixes...');
    fix.changes = [];

    // 1. Unlock body if fixed
    if (document.body.style.position === 'fixed') {
      fix.changes.push({ el: document.body, prop: 'position', val: document.body.style.position });
      document.body.style.position = '';
      log('  ✓ Unlocked body position');
    }

    // 2. Allow scroll on html/body
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    if (htmlOverflow) {
      fix.changes.push({ el: document.documentElement, prop: 'overflow', val: htmlOverflow });
      document.documentElement.style.overflow = '';
    }
    if (bodyOverflow) {
      fix.changes.push({ el: document.body, prop: 'overflow', val: bodyOverflow });
      document.body.style.overflow = '';
    }

    // 3. Disable blocking overlays (pointer-events:none)
    const overlayDoms = document.querySelectorAll(fix.overlaySelectors.join(', '));
    overlayDoms.forEach(ov => {
      const pointerEvents = ov.style.pointerEvents;
      const visibility = ov.style.visibility;
      if (pointerEvents !== 'none') {
        fix.changes.push({ el: ov, prop: 'pointerEvents', val: pointerEvents });
        ov.style.pointerEvents = 'none';
      }
      if (visibility !== 'hidden') {
        fix.changes.push({ el: ov, prop: 'visibility', val: visibility });
        ov.style.visibility = 'hidden';
      }
    });

    // 4. Apply touch-action and scroll help to main containers
    const scrollContainers = document.querySelectorAll('#appointmentsList, .content-area, .admin-content, .gallery-grid, main');
    scrollContainers.forEach(container => {
      const touchAction = container.style.touchAction;
      const webkitOverflow = container.style.webkitOverflowScrolling;
      if (touchAction !== 'pan-y') {
        fix.changes.push({ el: container, prop: 'touchAction', val: touchAction });
        container.style.touchAction = 'pan-y';
      }
      if (webkitOverflow !== 'touch') {
        fix.changes.push({ el: container, prop: 'webkitOverflowScrolling', val: webkitOverflow });
        container.style.webkitOverflowScrolling = 'touch';
      }
    });

    fix.applied = true;
    log(`✅ Applied ${fix.changes.length} fixes. Test scroll now.`);
    return true;
  }

  function revert() {
    if (!fix.applied) {
      log('ℹ️ Nothing to revert');
      return false;
    }

    log('⏮️ Reverting changes...');
    fix.changes.forEach(change => {
      try {
        if (change.val === '' || change.val === undefined) {
          change.el.style[change.prop] = '';
        } else {
          change.el.style[change.prop] = change.val;
        }
      } catch (e) {
        console.warn(`Failed to revert ${change.prop}:`, e);
      }
    });

    fix.changes = [];
    fix.applied = false;
    log(`✅ Reverted all changes`);
    return true;
  }

  function status() {
    log('=== STATUS ===');
    log(`Applied: ${fix.applied}`);
    log(`Changes recorded: ${fix.changes.length}`);
    if (fix.applied) {
      log('To revert, call: ScrollEmergencyFix.revert()');
    } else {
      log('To apply fixes, call: ScrollEmergencyFix.fix()');
    }
  }

  // Expose API
  window.ScrollEmergencyFix = {
    diagnose,
    fix: fix_scroll,
    revert,
    status
  };

  log('✓ Loaded. Run ScrollEmergencyFix.diagnose() to identify issues, then ScrollEmergencyFix.fix() to apply.');
})();
