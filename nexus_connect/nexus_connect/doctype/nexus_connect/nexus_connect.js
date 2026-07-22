// Copyright (c) 2026, Manish Kumar and contributors
// For license information, please see license.txt

frappe.ui.form.on("Nexus Connect", {
    refresh(frm) {
        frm.add_custom_button("Start Call", () => {

            frappe.call({
                method: "nexus_connect.get_stream_api.api.create_meeting",
                callback(r) {

                    frm.set_value("call_id", r.message.call_id);
                    frm.set_value("join_url", r.message.join_url);
                    frm.set_value("status", "Active");

                    frm.save();

                    window.open(r.message.join_url, "_blank");
                }
            });

        });
    }
});