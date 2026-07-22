# Copyright (c) 2026, Manish Kumar and contributors
# For license information, please see license.txt




import frappe
import qrcode
import base64
from io import BytesIO
from frappe.model.document import Document


class UserResigtration(Document):

    @property
    def qr_base64(self):
        qr = qrcode.QRCode(
            version=1,
            box_size=6,
            border=2
        )

        qr.add_data(self.email)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        buffer = BytesIO()
        img.save(buffer, format="PNG")

        return base64.b64encode(buffer.getvalue()).decode()



import frappe

@frappe.whitelist()
def create_user_from_registration(registration):

    name = frappe.db.get_value(
        "User Resigtration",
        {"email": registration},
        "name"
    )

    if not name:
        frappe.throw("Registration not found")

    reg = frappe.get_doc("User Resigtration", name)

   

    if frappe.db.exists("User", reg.email):
        return "User already exists."

    user = frappe.get_doc({
        "doctype": "User",
        "email": reg.email,
        "first_name": reg.first_name,
        "last_name": reg.last_name,
        "enabled": 1,
        "send_welcome_email": 0
    })

    user.insert(ignore_permissions=True)

  

    return f"User Created : {user.name}"