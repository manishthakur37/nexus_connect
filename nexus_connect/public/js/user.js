frappe.listview_settings["User"] = {
    onload(listview) {

        listview.page.add_inner_button(__("Scan Registration QR"), () => {

            new frappe.ui.Scanner({
                dialog: true,
                multiple: false,

                on_scan(data) {

                    frappe.call({
                        method: "nexus_connect.nexus_connect.doctype.user_resigtration.user_resigtration.create_user_from_registration",
                        args: {
                            registration: data.decodedText
                        },
                        callback(r) {
                            frappe.msgprint(r.message);
                            listview.refresh();
                        }
                    });

                }
            });

        });

    }
};




