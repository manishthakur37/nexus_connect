import base64

import frappe


@frappe.whitelist(allow_guest=True)
def upload_private_file(
    file_name,
    file_data,
    doctype=None,
    docname=None,
    fieldname=None,
):
    if frappe.session.user != "Guest":
        frappe.throw("This endpoint is only for Guest users.")

    if not file_data or "," not in file_data:
        frappe.throw("Invalid file.")

    _, encoded_data = file_data.split(",", 1)

    content = base64.b64decode(encoded_data)

    file_doc = frappe.get_doc({
        "doctype": "File",
        "file_name": file_name,
        "content": content,
        "decode": False,
        "is_private": 1,
    })

    if doctype and docname:
        file_doc.attached_to_doctype = doctype
        file_doc.attached_to_name = docname

    if fieldname:
        file_doc.attached_to_field = fieldname

    file_doc.insert(ignore_permissions=True)

    return {
        "file_name": file_doc.file_name,
        "file_url": file_doc.file_url,
        "is_private": file_doc.is_private,
    }