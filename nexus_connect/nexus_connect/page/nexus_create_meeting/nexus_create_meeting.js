// nexus_connect/public/js/create_meeting.js
// Isko kisi bhi page ya button se call kar sako

frappe.pages['nexus-create-meeting'].on_page_load = async function(wrapper) {

    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'New Meeting',
        single_column: true
    });

    $(page.body).html(`
        <style>
            .nc-create {
                padding: 30px 20px;
                max-width: 540px;
                font-family: inherit;
            }
            .nc-form-label {
                font-size: 13px;
                font-weight: 500;
                color: #475569;
                margin-bottom: 6px;
                display: block;
            }
            .nc-form-group {
                margin-bottom: 18px;
            }
            .nc-form-input {
                width: 100%;
                padding: 9px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                font-size: 14px;
                color: #1e293b;
                background: #fff;
                outline: none;
                transition: border-color .15s;
                box-sizing: border-box;
            }
            .nc-form-input:focus {
                border-color: #3b82f6;
            }
            .nc-members-list {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: 8px;
                min-height: 28px;
            }
            .nc-member-tag {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: #eff6ff;
                color: #1d4ed8;
                border: 1px solid #bfdbfe;
                border-radius: 20px;
                padding: 3px 10px;
                font-size: 12px;
            }
            .nc-member-tag button {
                border: none;
                background: none;
                color: #93c5fd;
                cursor: pointer;
                padding: 0;
                font-size: 14px;
                line-height: 1;
            }
            .nc-member-tag button:hover { color: #1d4ed8; }
            .nc-add-btn {
                padding: 8px 16px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                background: #fff;
                font-size: 13px;
                cursor: pointer;
                color: #334155;
                margin-top: 6px;
            }
            .nc-add-btn:hover { background: #f8fafc; }
            .nc-create-btn {
                width: 100%;
                padding: 12px;
                border-radius: 8px;
                border: none;
                background: #3b82f6;
                color: #fff;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: background .15s;
                margin-top: 8px;
            }
            .nc-create-btn:hover { background: #2563eb; }
            .nc-create-btn:disabled {
                background: #93c5fd;
                cursor: not-allowed;
            }
            .nc-result-box {
                display: none;
                margin-top: 20px;
                padding: 16px;
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 10px;
            }
            .nc-result-box h4 {
                margin: 0 0 10px;
                color: #15803d;
                font-size: 14px;
            }
            .nc-result-link {
                font-size: 13px;
                font-family: monospace;
                color: #0f766e;
                word-break: break-all;
                background: #fff;
                padding: 8px 10px;
                border-radius: 6px;
                border: 1px solid #d1fae5;
                display: block;
                margin-bottom: 10px;
            }
            .nc-result-actions {
                display: flex;
                gap: 8px;
            }
            .nc-join-btn {
                padding: 8px 18px;
                border-radius: 7px;
                border: none;
                background: #22c55e;
                color: #fff;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
            }
            .nc-join-btn:hover { background: #16a34a; }
            .nc-copy-result-btn {
                padding: 8px 16px;
                border-radius: 7px;
                border: 1px solid #e2e8f0;
                background: #fff;
                font-size: 13px;
                cursor: pointer;
                color: #334155;
            }
        </style>

        <div class="nc-create">
            <h3 style="margin:0 0 24px; font-size:20px; color:#1e293b;">
                New Meeting
            </h3>

            <!-- Topic (optional) -->
            <div class="nc-form-group">
                <label class="nc-form-label">Meeting Topic (optional)</label>
                <input
                    class="nc-form-input"
                    id="nc-topic"
                    type="text"
                    placeholder="e.g. Weekly Standup"
                />
            </div>

            <!-- Members -->
            <div class="nc-form-group">
                <label class="nc-form-label">
                    Members add karo (Frappe user email)
                </label>
                <div style="display:flex; gap:8px;">
                    <input
                        class="nc-form-input"
                        id="nc-member-input"
                        type="text"
                        placeholder="user@example.com"
                        style="flex:1;"
                    />
                    <button class="nc-add-btn" id="nc-add-member-btn">
                        + Add
                    </button>
                </div>
                <div class="nc-members-list" id="nc-members-list"></div>
                <div style="font-size:11px; color:#94a3b8; margin-top:6px;">
                    Tum automatically include ho. Sirf additional members add karo.
                </div>
            </div>

            <button class="nc-create-btn" id="nc-create-btn">
                Create Meeting
            </button>

            <!-- Result box -->
            <div class="nc-result-box" id="nc-result-box">
                <h4>✅ Meeting Ready!</h4>
                <a class="nc-result-link" id="nc-result-link" href="#"></a>
                <div class="nc-result-actions">
                    <button class="nc-join-btn" id="nc-join-btn">
                        Join Now
                    </button>
                    <button class="nc-copy-result-btn" id="nc-copy-result-btn">
                        Copy Link
                    </button>
                </div>
            </div>
        </div>
    `);

    // ═══════════════════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════════════════
    let members    = [];  // additional member IDs
    let createdUrl = "";

    // ═══════════════════════════════════════════════════════════
    //  MEMBER ADD
    // ═══════════════════════════════════════════════════════════
    function addMember() {
        const val = $("#nc-member-input").val().trim();
        if (!val) return;
        if (members.includes(val)) {
            frappe.show_alert({
                message: val + " already added",
                indicator: "orange"
            });
            return;
        }
        members.push(val);
        renderTags();
        $("#nc-member-input").val("");
    }

    function renderTags() {
        const list = $("#nc-members-list");
        list.empty();
        members.forEach(uid => {
            const tag = $(`
                <span class="nc-member-tag">
                    ${uid}
                    <button data-uid="${uid}" title="Remove">×</button>
                </span>
            `);
            list.append(tag);
        });
    }

    $("#nc-add-member-btn").on("click", addMember);

    $("#nc-member-input").on("keydown", function(e) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addMember();
        }
    });

    $(document).on("click", ".nc-member-tag button", function() {
        const uid = $(this).data("uid");
        members = members.filter(m => m !== uid);
        renderTags();
    });

    // ═══════════════════════════════════════════════════════════
    //  CREATE MEETING
    // ═══════════════════════════════════════════════════════════
    $("#nc-create-btn").on("click", function() {
        const btn = $(this);
        btn.prop("disabled", true).text("Creating...");

        frappe.call({
            method: "nexus_connect.get_stream_api.api.create_meeting",
            args: {
                member_ids: JSON.stringify(members)
            },
            callback: function(r) {
                btn.prop("disabled", false).text("Create Meeting");

                if (!r.message || !r.message.call_id) {
                    frappe.show_alert({
                        message: "Meeting create nahi hua. Dobara try karo.",
                        indicator: "red"
                    });
                    return;
                }

                const { call_id, join_url } = r.message;
                const fullUrl = window.location.origin + join_url;
                createdUrl    = fullUrl;

                // Result box show karo
                $("#nc-result-link")
                    .text(fullUrl)
                    .attr("href", fullUrl);
                $("#nc-result-box").show();

                frappe.show_alert({
                    message: "Meeting ready! Link copy karo.",
                    indicator: "green"
                });
            },
            error: function() {
                btn.prop("disabled", false).text("Create Meeting");
                frappe.show_alert({
                    message: "Server error. Console check karo.",
                    indicator: "red"
                });
            }
        });
    });

    // ── Join now ─────────────────────────────────────────────
    $("#nc-join-btn").on("click", function() {
        if (createdUrl) window.location.href = createdUrl;
    });

    // ── Copy link ────────────────────────────────────────────
    $("#nc-copy-result-btn").on("click", function() {
        if (!createdUrl) return;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(createdUrl).then(() => {
                frappe.show_alert({ message: "Copied!", indicator: "green" });
            });
        } else {
            const el = document.createElement("textarea");
            el.value = createdUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand("copy");
            document.body.removeChild(el);
            frappe.show_alert({ message: "Copied!", indicator: "green" });
        }
    });
};