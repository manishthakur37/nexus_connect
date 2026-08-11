frappe.ready(() => {
    if (frappe.session.user !== "Guest") {
        return;
    }

    if (!frappe.web_form) {
        return;
    }

    const OriginalFileUploader = frappe.ui.FileUploader;

    frappe.ui.FileUploader = class extends OriginalFileUploader {
        constructor(opts = {}) {
            opts.allow_toggle_private = false;
            opts.make_attachments_public = false;

            super(opts);
        }
    };
});