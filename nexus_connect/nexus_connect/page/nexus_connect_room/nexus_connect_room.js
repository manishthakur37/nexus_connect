frappe.pages['nexus-connect-room'].on_page_load = async function(wrapper) {

    // ══════════════════════════════════════════════════════════════════
    // SDK LOAD
    // ══════════════════════════════════════════════════════════════════
    let StreamVideoClient;
    try {
        const mod = await import("https://esm.sh/@stream-io/video-client@1");
        StreamVideoClient = mod.StreamVideoClient;
    } catch (e) {
        frappe.msgprint({ title: "SDK Load Failed", message: "Stream Video SDK load nahi hua.", indicator: "red" });
        return;
    }

    // ══════════════════════════════════════════════════════════════════
    // PAGE SETUP
    // ══════════════════════════════════════════════════════════════════
    let page = frappe.ui.make_app_page({ parent: wrapper, title: 'Nexus Connect', single_column: true });

    $(page.body).html(`
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            /* Primary */
            --accent:       #7C5CFC;
            --accent-2:     #9F7AFF;
            --cyan:         #00D4FF;
        
            /* Status */
            --green:        #00E096;
            --red:          #FF4757;
            --amber:        #FFB800;
        
            /* Backgrounds */
            --bg-base:      #06080F;
            --bg-surface:   #0C0F1A;
            --bg-elevated:  #10141F;
            --bg-overlay:   #151A28;
            --bg-card:      #1C2235;
            --bg-card-2:    #242B42;
        
            /* Text */
            --text-1:       #F2F4FF;
            --text-2:       #8890B0;
            --text-3:       #454D6A;
        
            /* Borders */
            --border:       rgba(255,255,255,0.05);
            --border-md:    rgba(255,255,255,0.09);
            --border-hi:    rgba(255,255,255,0.15);
        
            /* Effects */
            --accent-dim:   rgba(124,92,252,0.15);
            --accent-glow:  rgba(124,92,252,0.35);
            --green-dim:    rgba(0,224,150,0.12);
            --red-dim:      rgba(255,71,87,0.12);
            --amber-dim:    rgba(255,184,0,0.12);
        
            /* Fonts */
            --font:         'Geist', sans-serif;
            --mono:         'Geist Mono', monospace;
        
            /* Radius */
            --r-sm:         6px;
            --r-md:         10px;
            --r-lg:         14px;
            --r-xl:         18px;
        
            /* Layout */
            --sidebar-w:    300px;
            --ctrl-h:       68px;
            --topbar-h:     54px;
        }

        .nc-root {
            display: flex;
            flex-direction: column;
            height: 80vh;
            background: var(--bg-base);
            font-family: var(--font);
            color: var(--text-1);
            overflow: hidden;
        }

        /* ─── TOPBAR ─────────────────────────────────────────── */
        .nc-top {
            height: var(--topbar-h);
            display: flex;
            align-items: center;
            padding: 0 20px;
            background: var(--bg-surface);
            border-bottom: 1px solid var(--border);
            gap: 16px;
            flex-shrink: 0;
        }
        .nc-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
        }
        .nc-logo-icon {
            width: 30px; height: 30px;
            background: var(--accent);
            border-radius: var(--r-md);
            display: flex; align-items: center; justify-content: center;
        }
        .nc-logo-icon svg { width: 16px; height: 16px; fill: #fff; }
        .nc-logo-text {
            font-size: 14px;
            font-weight: 600;
            letter-spacing: -0.2px;
            color: var(--text-1);
        }
        .nc-logo-text span { color: var(--accent); }

        .nc-divider { width: 1px; height: 22px; background: var(--border); flex-shrink: 0; }

        .nc-room-pill {
            display: flex;
            align-items: center;
            gap: 7px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: 100px;
            padding: 4px 12px 4px 8px;
            font-size: 12px;
            font-family: var(--mono);
            color: var(--text-2);
            cursor: pointer;
            transition: border-color .15s, background .15s;
        }
        .nc-room-pill:hover { border-color: var(--border-md); background: var(--bg-overlay); }
        .nc-room-pill-dot {
            width: 7px; height: 7px;
            border-radius: 50%;
            background: var(--green);
            flex-shrink: 0;
            box-shadow: 0 0 6px var(--green);
            animation: nc-pulse 2s ease-in-out infinite;
        }
        @keyframes nc-pulse {
            0%,100% { opacity: 1; }
            50%      { opacity: .4; }
        }

        .nc-top-center {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .nc-timer {
            font-family: var(--mono);
            font-size: 14px;
            color: var(--text-2);
            letter-spacing: 1px;
        }
        .nc-timer.live { color: var(--green); }

        .nc-top-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .nc-icon-btn {
            width: 34px; height: 34px;
            border-radius: var(--r-md);
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: all .15s;
            position: relative;
        }
        .nc-icon-btn:hover { background: var(--bg-hover); border-color: var(--border-md); color: var(--text-1); }
        .nc-icon-btn.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
        .nc-icon-btn .nc-badge {
            position: absolute;
            top: -3px; right: -3px;
            min-width: 16px; height: 16px;
            background: var(--red);
            border-radius: 100px;
            font-size: 9px;
            font-weight: 600;
            display: flex; align-items: center; justify-content: center;
            padding: 0 3px;
            border: 2px solid var(--bg-surface);
        }

        .nc-status-chip {
            font-size: 11px;
            font-weight: 500;
            padding: 5px 12px;
            border-radius: 100px;
            letter-spacing: .3px;
        }
        .nc-status-chip.connecting { background: var(--amber-dim); color: var(--amber); border: 1px solid rgba(245,166,35,.2); }
        .nc-status-chip.live       { background: var(--green-dim); color: var(--green); border: 1px solid rgba(34,212,122,.2); }
        .nc-status-chip.failed     { background: var(--red-dim);   color: var(--red);   border: 1px solid rgba(255,87,87,.2); }
        .nc-status-chip.left       { background: var(--bg-elevated); color: var(--text-3); border: 1px solid var(--border); }

        /* ─── BODY ───────────────────────────────────────────── */
        .nc-body {
            flex: 1;
            display: flex;
            overflow: hidden;
        }

        /* ─── MAIN STAGE ─────────────────────────────────────── */
        .nc-stage {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }

        /* ─── VIDEO GRID ─────────────────────────────────────── */
        .nc-grid-wrap {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
            overflow: hidden;
        }
        .nc-grid {
            width: 100%;
            height: 100%;
            display: grid;
            gap: 10px;
            align-content: center;
            justify-content: center;
        }
        .nc-grid.g1 { grid-template-columns: minmax(0, 720px); grid-template-rows: minmax(0, 480px); }
        .nc-grid.g2 { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .nc-grid.g3 { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .nc-grid.g4 { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .nc-grid.gn { grid-template-columns: repeat(3, minmax(0,1fr)); }

        /* ─── TILE ───────────────────────────────────────────── */
        .nc-tile {
            position: relative;
            border-radius: var(--r-xl);
            overflow: hidden;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            aspect-ratio: 16/9;
            transition: border-color .2s, box-shadow .2s;
        }
        .nc-tile:hover .nc-tile-overlay { opacity: 1; }
        .nc-tile.speaking {
            border-color: var(--green);
            box-shadow: 0 0 0 2px rgba(34,212,122,.15), inset 0 0 0 1px rgba(34,212,122,.1);
        }
        .nc-tile.screen-tile {
            aspect-ratio: 16/9;
            border-color: var(--accent);
        }
        .nc-grid:not(.g1) .nc-tile.screen-tile { grid-column: 1 / -1; }

        .nc-tile video {
            width: 100%; height: 100%;
            object-fit: cover;
            background: #000;
            display: block;
        }

        /* Avatar */
        .nc-tile-avatar {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: var(--bg-elevated);
            pointer-events: none;
            transition: opacity .2s;
        }
        .nc-tile-avatar.hidden { opacity: 0; }
        .nc-tile-avatar .av-circle {
            width: 64px; height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg, #1e3a5f 0%, #0c2a4a 100%);
            border: 2px solid rgba(79,142,247,.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; font-weight: 600;
            color: var(--accent);
        }
        .nc-tile-avatar .av-name { font-size: 12px; color: var(--text-3); font-family: var(--mono); }

        /* Tile overlay (hover) */
        .nc-tile-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 50%);
            opacity: 0;
            transition: opacity .2s;
            pointer-events: none;
        }
        /* Footer always visible */
        .nc-tile-foot {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            padding: 20px 12px 10px;
            background: linear-gradient(to top, rgba(0,0,0,.8) 0%, transparent 100%);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .nc-tile-name {
            flex: 1;
            font-size: 12px;
            font-weight: 500;
            color: rgba(255,255,255,.9);
            font-family: var(--mono);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .nc-chip {
            font-size: 10px; font-weight: 600;
            padding: 2px 8px;
            border-radius: 100px;
            letter-spacing: .3px;
        }
        .nc-chip.you    { background: rgba(79,142,247,.2); color: var(--accent); border: 1px solid rgba(79,142,247,.35); }
        .nc-chip.screen { background: rgba(34,212,122,.15); color: var(--green); border: 1px solid rgba(34,212,122,.3); }
        .nc-chip.muted  {
            width: 22px; height: 22px; padding: 0;
            background: rgba(255,87,87,.15);
            color: var(--red); border: 1px solid rgba(255,87,87,.3);
            display: none;
            align-items: center; justify-content: center;
            font-size: 11px;
        }

        /* Speaking reaction */
        .nc-tile-speaking-ring {
            position: absolute;
            inset: -2px;
            border-radius: calc(var(--r-xl) + 2px);
            border: 2px solid var(--green);
            pointer-events: none;
            opacity: 0;
            transition: opacity .2s;
        }
        .nc-tile.speaking .nc-tile-speaking-ring { opacity: 1; }

        /* Empty state */
        .nc-empty {
            grid-column: 1/-1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            color: var(--text-3);
        }
        .nc-empty-icon {
            width: 52px; height: 52px;
            border-radius: var(--r-lg);
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            display: flex; align-items: center; justify-content: center;
            font-size: 22px;
        }
        .nc-empty p { font-size: 13px; }

        /* Floating reactions */
        .nc-reaction-float {
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 6px;
            pointer-events: none;
        }
        .nc-float-emoji {
            font-size: 26px;
            animation: nc-float-up 2.5s ease-out forwards;
        }
        @keyframes nc-float-up {
            0%   { opacity: 1; transform: translateY(0) scale(1); }
            80%  { opacity: .8; }
            100% { opacity: 0; transform: translateY(-80px) scale(.8); }
        }

        /* ─── SIDEBAR ────────────────────────────────────────── */
        .nc-sidebar {
            width: var(--sidebar-w);
            background: var(--bg-surface);
            border-left: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
            transition: width .25s cubic-bezier(.4,0,.2,1), opacity .25s;
            overflow: hidden;
        }
        .nc-sidebar.closed { width: 0; opacity: 0; }

        .nc-sidebar-tabs {
            display: flex;
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
        }
        .nc-sidebar-tab {
            flex: 1;
            padding: 12px 6px;
            font-size: 12px;
            font-weight: 500;
            color: var(--text-3);
            cursor: pointer;
            text-align: center;
            border-bottom: 2px solid transparent;
            transition: all .15s;
            white-space: nowrap;
        }
        .nc-sidebar-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .nc-sidebar-tab:hover:not(.active) { color: var(--text-2); }

        .nc-tab-panel { flex: 1; overflow: hidden; display: none; flex-direction: column; }
        .nc-tab-panel.active { display: flex; }

        /* Participants list */
        .nc-participants { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
        .nc-participant-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            border-radius: var(--r-md);
            transition: background .1s;
        }
        .nc-participant-row:hover { background: var(--bg-hover); }
        .nc-part-av {
            width: 32px; height: 32px;
            border-radius: 50%;
            background: var(--bg-overlay);
            border: 1px solid var(--border-md);
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: 600; color: var(--accent);
            flex-shrink: 0;
        }
        .nc-part-name { flex: 1; font-size: 13px; color: var(--text-1); }
        .nc-part-you { font-size: 10px; color: var(--text-3); }
        .nc-part-icons { display: flex; gap: 4px; font-size: 13px; }

        /* Chat */
        .nc-chat-msgs {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .nc-chat-msgs::-webkit-scrollbar { width: 3px; }
        .nc-chat-msgs::-webkit-scrollbar-track { background: transparent; }
        .nc-chat-msgs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .nc-chat-msg { display: flex; gap: 8px; }
        .nc-chat-av {
            width: 28px; height: 28px;
            border-radius: 50%;
            background: var(--bg-overlay);
            border: 1px solid var(--border);
            font-size: 11px; font-weight: 600;
            color: var(--accent);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .nc-chat-content { flex: 1; }
        .nc-chat-meta {
            display: flex; gap: 6px; align-items: baseline;
            margin-bottom: 3px;
        }
        .nc-chat-name { font-size: 12px; font-weight: 600; color: var(--text-1); }
        .nc-chat-time { font-size: 10px; color: var(--text-3); }
        .nc-chat-text { font-size: 13px; color: var(--text-2); line-height: 1.5; }

        .nc-chat-input-area {
            padding: 12px;
            border-top: 1px solid var(--border);
            display: flex;
            gap: 8px;
        }
        .nc-chat-input {
            flex: 1;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-md);
            padding: 8px 12px;
            font-size: 13px;
            color: var(--text-1);
            font-family: var(--font);
            outline: none;
            transition: border-color .15s;
            resize: none;
            height: 36px;
            min-height: 36px;
        }
        .nc-chat-input::placeholder { color: var(--text-3); }
        .nc-chat-input:focus { border-color: var(--accent); }
        .nc-chat-send {
            width: 36px; height: 36px;
            background: var(--accent);
            border: none;
            border-radius: var(--r-md);
            color: #fff;
            font-size: 16px;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: opacity .15s;
            flex-shrink: 0;
        }
        .nc-chat-send:hover { opacity: .85; }

        /* Whiteboard */
        .nc-wb-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .nc-wb-toolbar {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 12px;
            border-bottom: 1px solid var(--border);
            flex-wrap: wrap;
        }
        .nc-wb-tool {
            width: 30px; height: 30px;
            border-radius: var(--r-sm);
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-2);
            font-size: 14px;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all .15s;
        }
        .nc-wb-tool:hover { background: var(--bg-hover); color: var(--text-1); }
        .nc-wb-tool.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
        .nc-wb-colors {
            display: flex; gap: 4px; align-items: center;
            padding-left: 4px;
            border-left: 1px solid var(--border);
            margin-left: 2px;
        }
        .nc-wb-color {
            width: 18px; height: 18px;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid transparent;
            transition: border-color .1s, transform .1s;
        }
        .nc-wb-color.active, .nc-wb-color:hover { transform: scale(1.2); }
        .nc-wb-color.active { border-color: rgba(255,255,255,.6); }
        .nc-wb-size {
            display: flex; gap: 4px; align-items: center;
            padding-left: 4px;
            border-left: 1px solid var(--border);
            margin-left: 2px;
        }
        .nc-wb-sz {
            width: 24px; height: 24px;
            border-radius: var(--r-sm);
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-2);
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all .15s;
        }
        .nc-wb-sz.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }
        .nc-wb-canvas-wrap {
            flex: 1;
            position: relative;
            background: #fff;
            overflow: hidden;
        }
        .nc-wb-canvas { display: block; cursor: crosshair; touch-action: none; }
        .nc-wb-clear {
            position: absolute;
            bottom: 10px; right: 10px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-md);
            padding: 6px 14px;
            font-size: 12px;
            color: var(--red);
            cursor: pointer;
            transition: all .15s;
        }
        .nc-wb-clear:hover { background: var(--red-dim); border-color: var(--red); }

        /* Reactions panel */
        .nc-reactions-panel {
            position: absolute;
            bottom: calc(var(--ctrl-h) + 12px);
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-elevated);
            border: 1px solid var(--border-md);
            border-radius: var(--r-xl);
            padding: 10px 16px;
            display: flex;
            gap: 6px;
            opacity: 0;
            pointer-events: none;
            transform: translateX(-50%) translateY(10px);
            transition: opacity .2s, transform .2s;
        }
        .nc-reactions-panel.open {
            opacity: 1;
            pointer-events: all;
            transform: translateX(-50%) translateY(0);
        }
        .nc-reaction-btn {
            width: 40px; height: 40px;
            border-radius: var(--r-md);
            border: none;
            background: transparent;
            font-size: 22px;
            cursor: pointer;
            transition: transform .15s, background .15s;
            display: flex; align-items: center; justify-content: center;
        }
        .nc-reaction-btn:hover { transform: scale(1.25); background: var(--bg-hover); }

        /* ─── CONTROLS ───────────────────────────────────────── */
        .nc-controls {
            height: var(--ctrl-h);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0 24px;
            background: var(--bg-surface);
            border-top: 1px solid var(--border);
            flex-shrink: 0;
            position: relative;
        }
        .nc-ctrl {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            height: 44px;
            padding: 0 20px;
            border-radius: var(--r-lg);
            border: 1px solid var(--border);
            background: var(--bg-elevated);
            color: var(--text-2);
            font-family: var(--font);
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all .15s;
            white-space: nowrap;
            letter-spacing: -.1px;
        }
        .nc-ctrl:hover { border-color: var(--border-md); color: var(--text-1); background: var(--bg-overlay); }
        .nc-ctrl:active { transform: scale(.97); }
        .nc-ctrl .nc-ctrl-icon { font-size: 17px; line-height: 1; }

        .nc-ctrl.muted   { background: var(--red-dim); border-color: rgba(255,87,87,.25); color: var(--red); }
        .nc-ctrl.cam-off { background: var(--amber-dim); border-color: rgba(245,166,35,.25); color: var(--amber); }
        .nc-ctrl.sharing { background: var(--green-dim); border-color: rgba(34,212,122,.25); color: var(--green); }

        .nc-ctrl.leave {
            background: var(--red-dim);
            border-color: rgba(255,87,87,.25);
            color: var(--red);
            font-weight: 600;
            margin-left: 8px;
        }
        .nc-ctrl.leave:hover { background: var(--red); border-color: var(--red); color: #fff; }

        /* Separator */
        .nc-ctrl-sep { width: 1px; height: 28px; background: var(--border); flex-shrink: 0; }

        /* ─── INVITE BAR ─────────────────────────────────────── */
        .nc-invite-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 20px;
            background: var(--bg-base);
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
        }
        .nc-invite-label {
            font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
            color: var(--text-3); flex-shrink: 0;
        }
        .nc-invite-link {
            flex: 1;
            font-family: var(--mono);
            font-size: 11px;
            color: var(--accent);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .nc-copy-btn {
            flex-shrink: 0;
            padding: 4px 12px;
            border-radius: var(--r-md);
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-2);
            font-size: 11px;
            font-family: var(--mono);
            cursor: pointer;
            display: flex; align-items: center; gap: 5px;
            transition: all .15s;
        }
        .nc-copy-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
        .nc-copy-btn.copied { border-color: var(--green); color: var(--green); background: var(--green-dim); }

        /* ─── LOADING ─────────────────────────────────────────── */
        .nc-loading {
            position: fixed; inset: 0;
            background: var(--bg-base);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 18px; z-index: 9999;
        }
        .nc-loading.done { display: none; }
        .nc-load-logo {
            width: 48px; height: 48px;
            background: var(--accent);
            border-radius: var(--r-xl);
            display: flex; align-items: center; justify-content: center;
            animation: nc-breathe 1.5s ease-in-out infinite;
        }
        @keyframes nc-breathe {
            0%,100% { transform: scale(1); opacity: 1; }
            50%      { transform: scale(1.08); opacity: .8; }
        }
        .nc-load-logo svg { width: 24px; height: 24px; fill: #fff; }
        .nc-load-txt {
            font-size: 13px; color: var(--text-3);
            font-family: var(--mono); letter-spacing: .5px;
        }
        .nc-load-bar {
            width: 180px; height: 2px;
            background: var(--bg-elevated);
            border-radius: 99px;
            overflow: hidden;
        }
        .nc-load-bar-fill {
            height: 100%;
            background: var(--accent);
            border-radius: 99px;
            width: 0%;
            transition: width .4s;
        }

        /* ─── PERM BANNER ────────────────────────────────────── */
        .nc-perm {
            margin: 8px 20px;
            padding: 10px 14px;
            background: var(--amber-dim);
            border: 1px solid rgba(245,166,35,.25);
            border-radius: var(--r-md);
            font-size: 12px;
            color: var(--amber);
            display: none;
        }
        .nc-perm.show { display: block; }

        /* ─── STATS ROW ──────────────────────────────────────── */
        .nc-stats {
            display: flex;
            gap: 8px;
            padding: 10px 20px;
            border-top: 1px solid var(--border);
            flex-shrink: 0;
            background: var(--bg-surface);
        }
        .nc-stat {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: var(--r-md);
            font-size: 12px;
        }
        .nc-stat-label { color: var(--text-3); }
        .nc-stat-val { font-family: var(--mono); font-weight: 600; color: var(--text-1); }
        .nc-stat-val.id { font-size: 10px; color: var(--text-2); max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* ─── SCROLLBAR ──────────────────────────────────────── */
        * { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }

        /* ─── MOBILE ─────────────────────────────────────────── */
        @media(max-width: 768px) {
            .nc-sidebar { display: none; }
            .nc-grid.g2,.nc-grid.g3,.nc-grid.g4,.nc-grid.gn { grid-template-columns: 1fr; }
            .nc-ctrl span { display: none; }
            .nc-ctrl { padding: 0 14px; }
            .nc-stats { flex-wrap: wrap; padding: 8px 14px; }
            .nc-top { padding: 0 14px; }
            .nc-controls { padding: 0 14px; gap: 6px; }
            .nc-invite-bar { padding: 6px 14px; }
        }
    </style>

    <!-- Loading -->
    <div class="nc-loading" id="nc-loading">
        <div class="nc-load-logo">
            <svg viewBox="0 0 24 24"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
        </div>
        <div class="nc-load-txt" id="nc-load-txt">Initializing...</div>
        <div class="nc-load-bar"><div class="nc-load-bar-fill" id="nc-load-fill"></div></div>
    </div>

    <div class="nc-root">

        <!-- Topbar -->
        <div class="nc-top">
            <div class="nc-logo">
                <div class="nc-logo-icon">
                    <svg viewBox="0 0 24 24"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                </div>
                <span class="nc-logo-text">NEXUS<span>·</span>CONNECT</span>
            </div>

            <div class="nc-divider"></div>

            <div class="nc-room-pill" id="nc-room-pill" title="Click to copy room ID">
                <span class="nc-room-pill-dot"></span>
                <span id="nc-room-id-short">Joining...</span>
            </div>

            <div class="nc-top-center">
                <span class="nc-timer" id="nc-timer">0:00</span>
            </div>

            <div class="nc-top-right">
                <span class="nc-status-chip connecting" id="nc-status">CONNECTING</span>
                <div class="nc-divider"></div>
                <button class="nc-icon-btn" id="nc-btn-participants" title="Participants">
                    👥
                    <span class="nc-badge" id="nc-part-count">1</span>
                </button>
                <button class="nc-icon-btn" id="nc-btn-chat" title="Chat">
                    💬
                </button>
                <button class="nc-icon-btn" id="nc-btn-wb" title="Whiteboard">
                    ✏️
                </button>
            </div>
        </div>

        <!-- Invite bar -->
        <div class="nc-invite-bar">
            <span class="nc-invite-label">Invite</span>
            <span class="nc-invite-link" id="nc-invite-link">—</span>
            <button class="nc-copy-btn" id="nc-copy-btn">
                <span>⎘</span> <span id="nc-copy-txt">Copy Link</span>
            </button>
        </div>

        <!-- Perm banner -->
        <div class="nc-perm" id="nc-perm">
            ⚠️ Camera/Microphone permission denied. Allow in browser settings and reload.
        </div>

        <!-- Body -->
        <div class="nc-body">

            <!-- Stage -->
            <div class="nc-stage">
                <div class="nc-grid-wrap">
                    <div class="nc-grid g1" id="nc-grid">
                        <div class="nc-empty" id="nc-empty">
                            <div class="nc-empty-icon">📹</div>
                            <p>Initializing room...</p>
                        </div>
                    </div>
                </div>

                <!-- Floating reactions display -->
                <div class="nc-reaction-float" id="nc-reaction-float"></div>

                <!-- Reactions picker -->
                <div class="nc-reactions-panel" id="nc-reactions-panel">
                    <button class="nc-reaction-btn" data-emoji="👍">👍</button>
                    <button class="nc-reaction-btn" data-emoji="❤️">❤️</button>
                    <button class="nc-reaction-btn" data-emoji="😂">😂</button>
                    <button class="nc-reaction-btn" data-emoji="🎉">🎉</button>
                    <button class="nc-reaction-btn" data-emoji="👏">👏</button>
                    <button class="nc-reaction-btn" data-emoji="🔥">🔥</button>
                    <button class="nc-reaction-btn" data-emoji="😮">😮</button>
                    <button class="nc-reaction-btn" data-emoji="🤔">🤔</button>
                </div>

                <!-- Stats row -->
                <div class="nc-stats">
                    <div class="nc-stat">
                        <span class="nc-stat-label">Participants</span>
                        <span class="nc-stat-val" id="nc-count">0</span>
                    </div>
                    <div class="nc-stat">
                        <span class="nc-stat-label">Duration</span>
                        <span class="nc-stat-val" id="nc-dur">0:00</span>
                    </div>
                    <div class="nc-stat" style="flex:1">
                        <span class="nc-stat-label">Room</span>
                        <span class="nc-stat-val id" id="nc-room-full">—</span>
                    </div>
                </div>
            </div>

            <!-- Sidebar -->
            <div class="nc-sidebar closed" id="nc-sidebar">
                <div class="nc-sidebar-tabs">
                    <div class="nc-sidebar-tab active" data-tab="participants">People</div>
                    <div class="nc-sidebar-tab" data-tab="chat">Chat</div>
                    <div class="nc-sidebar-tab" data-tab="whiteboard">Board</div>
                </div>

                <!-- Participants -->
                <div class="nc-tab-panel active" id="tab-participants">
                    <div class="nc-participants" id="nc-participants-list">
                        <div style="padding:20px;text-align:center;color:var(--text-3);font-size:12px;">No participants yet</div>
                    </div>
                </div>

                <!-- Chat -->
                <div class="nc-tab-panel" id="tab-chat">
                    <div class="nc-chat-msgs" id="nc-chat-msgs">
                        <div style="padding:16px;text-align:center;color:var(--text-3);font-size:12px;">No messages yet</div>
                    </div>
                    <div class="nc-chat-input-area">
                        <textarea class="nc-chat-input" id="nc-chat-input" placeholder="Type a message..." rows="1"></textarea>
                        <button class="nc-chat-send" id="nc-chat-send">➤</button>
                    </div>
                </div>

                <!-- Whiteboard -->
                <div class="nc-tab-panel" id="tab-whiteboard">
                    <div class="nc-wb-panel">
                        <div class="nc-wb-toolbar">
                            <button class="nc-wb-tool active" id="wb-pen" title="Pen">✏️</button>
                            <button class="nc-wb-tool" id="wb-line" title="Line">╱</button>
                            <button class="nc-wb-tool" id="wb-rect" title="Rectangle">▭</button>
                            <button class="nc-wb-tool" id="wb-circle" title="Circle">◯</button>
                            <button class="nc-wb-tool" id="wb-text" title="Text">T</button>
                            <button class="nc-wb-tool" id="wb-eraser" title="Eraser">⌫</button>
                            <div class="nc-wb-colors">
                                <div class="nc-wb-color active" style="background:#1a1a2e" data-color="#1a1a2e"></div>
                                <div class="nc-wb-color" style="background:#4f8ef7" data-color="#4f8ef7"></div>
                                <div class="nc-wb-color" style="background:#22d47a" data-color="#22d47a"></div>
                                <div class="nc-wb-color" style="background:#ff5757" data-color="#ff5757"></div>
                                <div class="nc-wb-color" style="background:#f5a623" data-color="#f5a623"></div>
                                <div class="nc-wb-color" style="background:#a855f7" data-color="#a855f7"></div>
                            </div>
                            <div class="nc-wb-size">
                                <button class="nc-wb-sz active" data-size="2">S</button>
                                <button class="nc-wb-sz" data-size="4">M</button>
                                <button class="nc-wb-sz" data-size="8">L</button>
                            </div>
                        </div>
                        <div class="nc-wb-canvas-wrap" id="wb-wrap">
                            <canvas class="nc-wb-canvas" id="wb-canvas"></canvas>
                            <button class="nc-wb-clear" id="wb-clear">Clear Board</button>
                        </div>
                    </div>
                </div>
            </div>

        </div><!-- /body -->

        <!-- Controls -->
        <div class="nc-controls">
            <button class="nc-ctrl" id="nc-btn-mute">
                <span class="nc-ctrl-icon">🎙️</span>
                <span>Mute</span>
            </button>
            <button class="nc-ctrl" id="nc-btn-cam">
                <span class="nc-ctrl-icon">📷</span>
                <span>Camera</span>
            </button>
            <div class="nc-ctrl-sep"></div>
            <button class="nc-ctrl" id="nc-btn-screen">
                <span class="nc-ctrl-icon">🖥️</span>
                <span>Share Screen</span>
            </button>
            <button class="nc-ctrl" id="nc-btn-react">
                <span class="nc-ctrl-icon">😊</span>
                <span>React</span>
            </button>
            <div class="nc-ctrl-sep"></div>
            <button class="nc-ctrl leave" id="nc-btn-leave">
                <span class="nc-ctrl-icon">📵</span>
                <span>Leave</span>
            </button>
        </div>

    </div>`);

    // ══════════════════════════════════════════════════════════════════
    // PARAMS
    // ══════════════════════════════════════════════════════════════════
    const params  = new URLSearchParams(window.location.search);
    const call_id = params.get("call_id");

    if (!call_id) { setStatus("NO CALL ID", "failed"); hideLoading(); return; }

    // State
    let nc_call      = null;
    let localUserId  = null;
    let localSessId  = null;
    let localStream  = null;
    let screenStream = null;
    let micMuted     = false;
    let camOff       = false;
    let screenOn     = false;
    let durationTimer = null;
    let sidebarOpen  = false;
    let activeTab    = "participants";
    const boundSessions = new Map();
    const messages = [];

    const inviteUrl = window.location.origin + "/nexus-connect-room?call_id=" + call_id;
    document.getElementById("nc-invite-link").textContent = inviteUrl;
    document.getElementById("nc-room-full").textContent   = call_id;
    document.getElementById("nc-room-id-short").textContent = call_id.substring(0, 12) + "…";

    // ──────────────────────────────────────────────────────────────────
    // HELPERS
    // ──────────────────────────────────────────────────────────────────
    function setStatus(txt, type) {
        const el = document.getElementById("nc-status");
        el.textContent = txt; el.className = "nc-status-chip " + type;
        if (type === "live") document.getElementById("nc-timer").classList.add("live");
    }
    function setLoadTxt(t, pct) {
        document.getElementById("nc-load-txt").textContent = t;
        document.getElementById("nc-load-fill").style.width = pct + "%";
    }
    function hideLoading() { document.getElementById("nc-loading").classList.add("done"); }
    function startTimer() {
        const t0 = Date.now();
        durationTimer = setInterval(function() {
            const s = Math.floor((Date.now()-t0)/1000);
            const str = Math.floor(s/60)+":"+String(s%60).padStart(2,"0");
            document.getElementById("nc-timer").textContent = str;
            document.getElementById("nc-dur").textContent   = str;
        }, 1000);
    }
    function safeId(id) { return (id||"x").replace(/[^a-zA-Z0-9]/g,"_"); }
    function getInitials(uid) {
        return (uid||"?").split("@")[0].replace(/[._-]/g," ").trim()
            .split(" ").map(function(w){return w[0]||"";}).join("").substring(0,2).toUpperCase()||"?";
    }
    function updateLayout() {
        const count = document.querySelectorAll("#nc-grid .nc-tile").length;
        const g = document.getElementById("nc-grid");
        g.className = "nc-grid " + (count===1?"g1":count===2?"g2":count===3?"g3":count===4?"g4":"gn");
    }

    // ──────────────────────────────────────────────────────────────────
    // SIDEBAR TOGGLE
    // ──────────────────────────────────────────────────────────────────
    function openSidebar(tab) {
        const sb = document.getElementById("nc-sidebar");
        if (!sidebarOpen || activeTab !== tab) {
            sidebarOpen = true;
            activeTab   = tab;
            sb.classList.remove("closed");
            document.querySelectorAll(".nc-sidebar-tab").forEach(function(t){
                t.classList.toggle("active", t.dataset.tab === tab);
            });
            document.querySelectorAll(".nc-tab-panel").forEach(function(p){
                p.classList.toggle("active", p.id === "tab-" + tab);
            });
        } else {
            sidebarOpen = false;
            sb.classList.add("closed");
        }
        // Update icon btn state
        ["participants","chat","whiteboard"].forEach(function(k){
            const btn = document.getElementById("nc-btn-" + (k==="participants"?"participants":k==="chat"?"chat":"wb"));
            if (btn) btn.classList.toggle("active", sidebarOpen && activeTab===k);
        });
        if (tab === "whiteboard") { setTimeout(initWhiteboard, 50); }
    }

    document.getElementById("nc-btn-participants").addEventListener("click", function(){ openSidebar("participants"); });
    document.getElementById("nc-btn-chat").addEventListener("click", function(){ openSidebar("chat"); });
    document.getElementById("nc-btn-wb").addEventListener("click", function(){ openSidebar("whiteboard"); });

    document.querySelectorAll(".nc-sidebar-tab").forEach(function(tab){
        tab.addEventListener("click", function(){ openSidebar(this.dataset.tab); });
    });

    // ──────────────────────────────────────────────────────────────────
    // WHITEBOARD
    // ──────────────────────────────────────────────────────────────────
    let wbTool = "pen", wbColor = "#1a1a2e", wbSize = 2;
    let wbDrawing = false, wbStartX, wbStartY, wbSnapshot;

    function initWhiteboard() {
        const wrap = document.getElementById("wb-wrap");
        const canvas = document.getElementById("wb-canvas");
        if (canvas._init) return;
        canvas._init = true;
        canvas.width  = wrap.clientWidth  || 280;
        canvas.height = wrap.clientHeight || 400;
        canvas.style.width  = "100%";
        canvas.style.height = "100%";
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        function getPos(e) {
            const r = canvas.getBoundingClientRect();
            const scaleX = canvas.width  / r.width;
            const scaleY = canvas.height / r.height;
            const src = e.touches ? e.touches[0] : e;
            return { x: (src.clientX - r.left) * scaleX, y: (src.clientY - r.top) * scaleY };
        }

        canvas.addEventListener("mousedown",  wbDown); canvas.addEventListener("touchstart", wbDown, {passive:true});
        canvas.addEventListener("mousemove",  wbMove); canvas.addEventListener("touchmove",  wbMove, {passive:true});
        canvas.addEventListener("mouseup",    wbUp);   canvas.addEventListener("touchend",   wbUp);
        canvas.addEventListener("mouseleave", wbUp);

        function wbDown(e) {
            wbDrawing = true;
            const p = getPos(e);
            wbStartX = p.x; wbStartY = p.y;
            if (wbTool === "pen" || wbTool === "eraser") {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
            } else {
                wbSnapshot = ctx.getImageData(0,0,canvas.width,canvas.height);
            }
        }

        function wbMove(e) {
            if (!wbDrawing) return;
            const p = getPos(e);
            ctx.lineWidth   = wbSize;
            ctx.lineCap     = "round";
            ctx.lineJoin    = "round";
            ctx.strokeStyle = wbTool === "eraser" ? "#fff" : wbColor;

            if (wbTool === "pen" || wbTool === "eraser") {
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            } else {
                ctx.putImageData(wbSnapshot, 0, 0);
                ctx.beginPath();
                if (wbTool === "line") {
                    ctx.moveTo(wbStartX, wbStartY);
                    ctx.lineTo(p.x, p.y);
                    ctx.stroke();
                } else if (wbTool === "rect") {
                    ctx.strokeRect(wbStartX, wbStartY, p.x-wbStartX, p.y-wbStartY);
                } else if (wbTool === "circle") {
                    const rx = (p.x - wbStartX) / 2, ry = (p.y - wbStartY) / 2;
                    ctx.ellipse(wbStartX+rx, wbStartY+ry, Math.abs(rx), Math.abs(ry), 0, 0, 2*Math.PI);
                    ctx.stroke();
                } else if (wbTool === "text") {
                    ctx.font = (wbSize*6+12) + "px Geist, sans-serif";
                    ctx.fillStyle = wbColor;
                    ctx.fillText("Text", p.x, p.y);
                }
            }
        }

        function wbUp() { wbDrawing = false; ctx.beginPath(); }

        document.getElementById("wb-clear").addEventListener("click", function(){
            ctx.fillStyle = "#fff";
            ctx.fillRect(0,0,canvas.width,canvas.height);
        });

        // Tool buttons
        ["pen","line","rect","circle","text","eraser"].forEach(function(t){
            const btn = document.getElementById("wb-"+t);
            if (btn) btn.addEventListener("click", function(){
                wbTool = t;
                document.querySelectorAll(".nc-wb-tool").forEach(function(b){ b.classList.remove("active"); });
                this.classList.add("active");
                canvas.style.cursor = t === "text" ? "text" : t === "eraser" ? "cell" : "crosshair";
            });
        });

        document.querySelectorAll(".nc-wb-color").forEach(function(c){
            c.addEventListener("click", function(){
                wbColor = this.dataset.color;
                document.querySelectorAll(".nc-wb-color").forEach(function(x){ x.classList.remove("active"); });
                this.classList.add("active");
                if (wbTool === "eraser") { wbTool = "pen"; document.getElementById("wb-pen").click(); }
            });
        });

        document.querySelectorAll(".nc-wb-sz").forEach(function(s){
            s.addEventListener("click", function(){
                wbSize = parseInt(this.dataset.size);
                document.querySelectorAll(".nc-wb-sz").forEach(function(x){ x.classList.remove("active"); });
                this.classList.add("active");
            });
        });
    }

    // ──────────────────────────────────────────────────────────────────
    // CHAT
    // ──────────────────────────────────────────────────────────────────
    function addChatMsg(name, text, isLocal) {
        const msgs = document.getElementById("nc-chat-msgs");
        const empty = msgs.querySelector("div[style]");
        if (empty) empty.remove();

        const time = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
        const div = document.createElement("div");
        div.className = "nc-chat-msg";
        div.innerHTML = `
            <div class="nc-chat-av">${getInitials(name)}</div>
            <div class="nc-chat-content">
                <div class="nc-chat-meta">
                    <span class="nc-chat-name">${name.split("@")[0]}${isLocal?" (You)":""}</span>
                    <span class="nc-chat-time">${time}</span>
                </div>
                <div class="nc-chat-text">${text}</div>
            </div>`;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
        messages.push({name,text,time});
    }

    document.getElementById("nc-chat-send").addEventListener("click", sendChat);
    document.getElementById("nc-chat-input").addEventListener("keydown", function(e){
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
    });
    function sendChat() {
        const input = document.getElementById("nc-chat-input");
        const text  = input.value.trim();
        if (!text) return;
        addChatMsg(localUserId || "You", text, true);
        input.value = "";
    }

    // ──────────────────────────────────────────────────────────────────
    // REACTIONS
    // ──────────────────────────────────────────────────────────────────
    let reactionsOpen = false;
    document.getElementById("nc-btn-react").addEventListener("click", function(){
        reactionsOpen = !reactionsOpen;
        document.getElementById("nc-reactions-panel").classList.toggle("open", reactionsOpen);
        this.classList.toggle("sharing", reactionsOpen);
    });

    document.querySelectorAll(".nc-reaction-btn").forEach(function(btn){
        btn.addEventListener("click", function(){
            const emoji = this.dataset.emoji;
            showReaction(emoji);
            reactionsOpen = false;
            document.getElementById("nc-reactions-panel").classList.remove("open");
            document.getElementById("nc-btn-react").classList.remove("sharing");
        });
    });

    function showReaction(emoji) {
        const container = document.getElementById("nc-reaction-float");
        const span = document.createElement("span");
        span.className = "nc-float-emoji";
        span.textContent = emoji;
        container.appendChild(span);
        setTimeout(function(){ span.remove(); }, 2600);
    }

    // ──────────────────────────────────────────────────────────────────
    // TILES
    // ──────────────────────────────────────────────────────────────────
    function ensureTile(sessId, uid, isLocal, isScreen) {
        const tileId = (isScreen?"tile-screen-":"tile-") + safeId(sessId);
        if (document.getElementById(tileId)) return;
        const emptyEl = document.getElementById("nc-empty");
        if (emptyEl) emptyEl.remove();
        const label = (uid||"Remote").split("@")[0];
        const div = document.createElement("div");
        div.id = tileId;
        div.className = "nc-tile" + (isScreen?" screen-tile":"");
        div.innerHTML = `
            <video id="vid-${isScreen?"screen-":""}${safeId(sessId)}"
                autoplay playsinline ${isLocal&&!isScreen?"muted":""}></video>
            <div class="nc-tile-avatar" id="ovr-${isScreen?"screen-":""}${safeId(sessId)}">
                <div class="av-circle">${isScreen?"🖥":getInitials(uid)}</div>
                <div class="av-name">${isScreen?label+"'s screen":label}</div>
            </div>
            <div class="nc-tile-overlay"></div>
            <div class="nc-tile-speaking-ring"></div>
            <div class="nc-tile-foot">
                <span class="nc-tile-name">${isScreen?"🖥 "+label:label}</span>
                ${isLocal&&!isScreen?'<span class="nc-chip you">YOU</span>':""}
                ${isScreen?'<span class="nc-chip screen">SCREEN</span>':""}
                <span class="nc-chip muted" id="micoff-${safeId(sessId)}" style="display:none">🔇</span>
            </div>`;
        document.getElementById("nc-grid").appendChild(div);
        updateLayout();
    }

    function removeTile(tileId) {
        const el = document.getElementById(tileId);
        if (el) el.remove();
        if (!document.querySelectorAll("#nc-grid .nc-tile").length) {
            document.getElementById("nc-grid").innerHTML =
                '<div class="nc-empty" id="nc-empty"><div class="nc-empty-icon">📹</div><p>No participants.</p></div>';
        }
        updateLayout();
    }

    function watchVideoOverlay(videoEl, overlayEl) {
        if (!videoEl || !overlayEl) return;
        function check() {
            const playing = videoEl.srcObject &&
                videoEl.readyState >= 2 &&
                videoEl.srcObject.getVideoTracks &&
                videoEl.srcObject.getVideoTracks().some(function(t){ return t.readyState==="live"&&t.enabled; });
            overlayEl.classList.toggle("hidden", !!playing);
        }
        videoEl.addEventListener("loadeddata", check);
        videoEl.addEventListener("play",       check);
        videoEl.addEventListener("pause",      check);
        videoEl.addEventListener("emptied",    check);
        const iv = setInterval(check, 800);
        return function(){ clearInterval(iv); };
    }

    function setMicOff(sessId, muted) {
        const el = document.getElementById("micoff-"+safeId(sessId));
        if (el) el.style.display = muted ? "flex" : "none";
    }
    function setSpeaking(sessId, speaking) {
        const tile = document.getElementById("tile-"+safeId(sessId));
        if (tile) tile.classList.toggle("speaking", !!speaking);
    }

    // Update participants sidebar
    function updateParticipantsSidebar(participants) {
        const list = document.getElementById("nc-participants-list");
        list.innerHTML = "";
        participants.forEach(function(p){
            const name = (p.userId||"Remote").split("@")[0];
            const row = document.createElement("div");
            row.className = "nc-participant-row";
            row.innerHTML = `
                <div class="nc-part-av">${getInitials(p.userId)}</div>
                <span class="nc-part-name">${name}</span>
                ${p.isLocalParticipant?'<span class="nc-part-you">You</span>':""}
                <div class="nc-part-icons">
                    <span title="mic">${p.publishedTracks&&p.publishedTracks.some(function(t){return t==="audioTrack"||t===1;})?"🎙️":"🔇"}</span>
                    <span title="cam">${p.publishedTracks&&p.publishedTracks.some(function(t){return t==="videoTrack"||t===2;})?"📷":"📵"}</span>
                </div>`;
            list.appendChild(row);
        });
        document.getElementById("nc-part-count").textContent = participants.length;
    }

    // ──────────────────────────────────────────────────────────────────
    // BIND PARTICIPANT
    // ──────────────────────────────────────────────────────────────────
    function bindSession(participant) {
        const sessId  = participant.sessionId;
        const uid     = participant.userId;
        const isLocal = participant.isLocalParticipant;
        const sid     = safeId(sessId);
        ensureTile(sessId, uid, isLocal, false);
        const entry = boundSessions.get(sessId) || { video:null, audio:null, screen:null };

        if (!entry.video) {
            const videoEl   = document.getElementById("vid-"+sid);
            const overlayEl = document.getElementById("ovr-"+sid);
            if (videoEl && nc_call) {
                if (isLocal) {
                    videoEl.srcObject = camOff ? null : localStream;
                    videoEl.play().catch(function(){});
                } else {
                    const unbind = nc_call.bindVideoElement(videoEl, sessId, "videoTrack");
                    entry.video  = unbind || true;
                }
                watchVideoOverlay(videoEl, overlayEl);
            }
        }

        if (!entry.audio && !isLocal) {
            const audioId = "aud-"+sid;
            let audioEl = document.getElementById(audioId);
            if (!audioEl) {
                audioEl = document.createElement("audio");
                audioEl.id = audioId; audioEl.autoplay = true;
                audioEl.style.display = "none";
                document.body.appendChild(audioEl);
            }
            if (nc_call) {
                const unbind = nc_call.bindAudioElement(audioEl, sessId, "audioTrack");
                entry.audio  = unbind || true;
                audioEl.play().catch(function(){});
            }
        }

        const hasScreen = participant.publishedTracks &&
            participant.publishedTracks.some(function(t){
                return t==="screenShareTrack"||t==="SCREEN_SHARE"||(typeof t==="number"&&t===3);
            });

        if (hasScreen && !entry.screen) {
            ensureTile(sessId, uid, isLocal, true);
            const scrVidEl = document.getElementById("vid-screen-"+sid);
            const scrOvrEl = document.getElementById("ovr-screen-"+sid);
            if (scrVidEl && nc_call) {
                const unbind  = nc_call.bindVideoElement(scrVidEl, sessId, "screenShareTrack");
                entry.screen  = unbind || true;
                watchVideoOverlay(scrVidEl, scrOvrEl);
            }
        } else if (!hasScreen && entry.screen) {
            if (typeof entry.screen==="function") entry.screen();
            entry.screen = null;
            removeTile("tile-screen-"+sid);
        }

        if (!isLocal) {
            const audioMuted = !participant.publishedTracks ||
                !participant.publishedTracks.some(function(t){ return t==="audioTrack"||t==="AUDIO"||t===1; });
            setMicOff(sessId, audioMuted);
        } else { setMicOff(sessId, micMuted); }
        setSpeaking(sessId, participant.isSpeaking);
        boundSessions.set(sessId, entry);
    }

    function unbindSession(sessId) {
        const entry = boundSessions.get(sessId);
        if (!entry) return;
        if (typeof entry.video==="function") entry.video();
        if (typeof entry.audio==="function") entry.audio();
        if (typeof entry.screen==="function") entry.screen();
        boundSessions.delete(sessId);
        const sid = safeId(sessId);
        removeTile("tile-"+sid);
        removeTile("tile-screen-"+sid);
        const audioEl = document.getElementById("aud-"+sid);
        if (audioEl) audioEl.remove();
    }

    function renderAll(participants) {
        document.getElementById("nc-count").textContent = participants.length;
        const active = new Set(participants.map(function(p){ return p.sessionId; }));
        participants.forEach(function(p){ bindSession(p); });
        boundSessions.forEach(function(_,sid){ if (!active.has(sid)) unbindSession(sid); });
        updateParticipantsSidebar(participants);
    }

    // ──────────────────────────────────────────────────────────────────
    // JOIN
    // ──────────────────────────────────────────────────────────────────
    frappe.call({
        method: "nexus_connect.get_stream_api.api.get_user_token",
        callback: async function(r) {
            if (!r.message || !r.message.token) {
                setStatus("TOKEN FAILED","failed"); hideLoading(); return;
            }
            localUserId = r.message.user_id;
            const token = r.message.token;

            setLoadTxt("Requesting camera & mic...", 30);
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    video:{ width:{ideal:1280}, height:{ideal:720}, facingMode:"user" },
                    audio:{ echoCancellation:true, noiseSuppression:true, autoGainControl:true }
                });
            } catch(err) {
                console.warn("Camera/mic denied:", err);
                document.getElementById("nc-perm").classList.add("show");
                try { localStream = await navigator.mediaDevices.getUserMedia({audio:true}); }
                catch(_) { localStream = null; }
            }

            setLoadTxt("Connecting to Nexus server...", 60);
            let client, call;
            try {
                client = new StreamVideoClient({
                    apiKey: "xsqmnfhudxz2",
                    user:   { id: localUserId },
                    token:  token
                });
                call = client.call("default", call_id);
                await call.join({ create: true });
                nc_call = call; window.nc_call = call;
            } catch(err) {
                console.error("Join failed:", err);
                setStatus("FAILED","failed"); hideLoading(); return;
            }

            setLoadTxt("Publishing media tracks...", 85);
            try { await call.camera.enable(); await call.microphone.enable(); }
            catch(e) { console.warn("Publish:", e); }

            setLoadTxt("Joined!", 100);
            setStatus("LIVE","live");
            startTimer();
            setTimeout(hideLoading, 400);

            call.state.participants$.subscribe(function(participants) {
                const me = participants.find(function(p){ return p.isLocalParticipant; });
                if (me && !localSessId) {
                    localSessId = me.sessionId;
                    ensureTile(me.sessionId, me.userId, true, false);
                    const vid = document.getElementById("vid-"+safeId(me.sessionId));
                    const ovr = document.getElementById("ovr-"+safeId(me.sessionId));
                    if (vid) { vid.srcObject = camOff ? null : localStream; vid.play().catch(function(){}); }
                    watchVideoOverlay(vid, ovr);
                    const entry = boundSessions.get(me.sessionId) || {video:true,audio:null,screen:null};
                    entry.video = true;
                    boundSessions.set(me.sessionId, entry);
                }
                renderAll(participants);
            });
        }
    });

    // ──────────────────────────────────────────────────────────────────
    // CONTROLS
    // ──────────────────────────────────────────────────────────────────
    document.getElementById("nc-btn-mute").addEventListener("click", async function() {
        micMuted = !micMuted;
        if (localStream) localStream.getAudioTracks().forEach(function(t){ t.enabled = !micMuted; });
        if (nc_call) micMuted ? await nc_call.microphone.disable().catch(Object)
                              : await nc_call.microphone.enable().catch(Object);
        this.querySelector(".nc-ctrl-icon").textContent = micMuted ? "🔇" : "🎙️";
        this.querySelector("span:last-child").textContent = micMuted ? "Unmute" : "Mute";
        this.classList.toggle("muted", micMuted);
        if (localSessId) setMicOff(localSessId, micMuted);
    });

    document.getElementById("nc-btn-cam").addEventListener("click", async function() {
        camOff = !camOff;
        if (localStream) localStream.getVideoTracks().forEach(function(t){ t.enabled = !camOff; });
        if (nc_call) camOff ? await nc_call.camera.disable().catch(Object)
                            : await nc_call.camera.enable().catch(Object);
        this.querySelector(".nc-ctrl-icon").textContent = camOff ? "📵" : "📷";
        this.querySelector("span:last-child").textContent = camOff ? "Cam On" : "Camera";
        this.classList.toggle("cam-off", camOff);
        if (localSessId) {
            const vid = document.getElementById("vid-"+safeId(localSessId));
            if (vid) { vid.srcObject = camOff ? null : localStream; if (!camOff) vid.play().catch(function(){}); }
        }
    });

    document.getElementById("nc-btn-screen").addEventListener("click", async function() {
        if (!screenOn) {
            try {
                screenStream = await navigator.mediaDevices.getDisplayMedia({ video:{cursor:"always"}, audio:true });
                screenOn = true;
                this.querySelector(".nc-ctrl-icon").textContent = "⏹";
                this.querySelector("span:last-child").textContent = "Stop Share";
                this.classList.add("sharing");
                if (nc_call && nc_call.screenShare) {
                    await nc_call.screenShare.enable().catch(function(e){
                        if (localSessId) {
                            ensureTile(localSessId, localUserId, true, true);
                            const sv = document.getElementById("vid-screen-"+safeId(localSessId));
                            const so = document.getElementById("ovr-screen-"+safeId(localSessId));
                            if (sv) { sv.srcObject = screenStream; sv.play().catch(function(){}); }
                            watchVideoOverlay(sv, so);
                        }
                    });
                } else if (localSessId) {
                    ensureTile(localSessId, localUserId, true, true);
                    const sv = document.getElementById("vid-screen-"+safeId(localSessId));
                    const so = document.getElementById("ovr-screen-"+safeId(localSessId));
                    if (sv) { sv.srcObject = screenStream; sv.play().catch(function(){}); }
                    watchVideoOverlay(sv, so);
                }
                screenStream.getVideoTracks()[0].addEventListener("ended", stopScreenShare.bind(this));
            } catch(e) {
                if (e.name !== "NotAllowedError") frappe.show_alert({ message: "Screen share failed: "+e.message, indicator:"red" });
            }
        } else { stopScreenShare.call(this); }
    });

    function stopScreenShare() {
        screenOn = false;
        if (screenStream) { screenStream.getTracks().forEach(function(t){ t.stop(); }); screenStream = null; }
        if (nc_call && nc_call.screenShare) nc_call.screenShare.disable().catch(function(){});
        if (localSessId) {
            removeTile("tile-screen-"+safeId(localSessId));
            const entry = boundSessions.get(localSessId);
            if (entry) entry.screen = null;
        }
        const btn = document.getElementById("nc-btn-screen");
        btn.querySelector(".nc-ctrl-icon").textContent = "🖥️";
        btn.querySelector("span:last-child").textContent = "Share Screen";
        btn.classList.remove("sharing");
    }

    document.getElementById("nc-copy-btn").addEventListener("click", function() {
        const fallback = function() {
            const ta = document.createElement("textarea");
            ta.value = inviteUrl; ta.style.cssText = "position:fixed;opacity:0";
            document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
        };
        (navigator.clipboard ? navigator.clipboard.writeText(inviteUrl).catch(fallback) : Promise.reject()).catch(fallback);
        const btn = document.getElementById("nc-copy-btn");
        const txt = document.getElementById("nc-copy-txt");
        btn.classList.add("copied"); txt.textContent = "Copied!";
        setTimeout(function(){ btn.classList.remove("copied"); txt.textContent = "Copy Link"; }, 2000);
    });

    document.getElementById("nc-btn-leave").addEventListener("click", async function() {
        await doCleanup(); window.location.href = "/app";
    });

    async function doCleanup() {
        clearInterval(durationTimer);
        if (localStream)  localStream.getTracks().forEach(function(t){ t.stop(); });
        if (screenStream) screenStream.getTracks().forEach(function(t){ t.stop(); });
        document.querySelectorAll("[id^='aud-']").forEach(function(el){ el.remove(); });
        if (nc_call) { try { await nc_call.leave(); } catch(_) {} }
        setStatus("LEFT","left");
    }

    window.addEventListener("beforeunload", function() {
        if (localStream)  localStream.getTracks().forEach(function(t){ t.stop(); });
        if (screenStream) screenStream.getTracks().forEach(function(t){ t.stop(); });
        document.querySelectorAll("[id^='aud-']").forEach(function(el){ el.remove(); });
        if (nc_call) { try { nc_call.leave(); } catch(_) {} }
    });
};